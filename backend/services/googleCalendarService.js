// Serviço de integração com Google Calendar
// Permite sincronizar agendamentos com a conta do Google do usuário

const { google } = require('googleapis');
const supabase = require('../config/supabase');
require('dotenv').config();

// Cria o cliente OAuth2 do Google
function criarClienteOAuth() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Gera a URL de autorização do Google
function gerarUrlAutorizacao(req, res) {
  const oauth2Client = criarClienteOAuth();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: req.usuario.id // salva o ID do usuário para recuperar depois
  });

  res.json({ url_autorizacao: url });
}

// Recebe o código de retorno do Google e salva o token
async function receberCallback(req, res) {
  const { code, state: usuario_id } = req.query;

  try {
    const oauth2Client = criarClienteOAuth();
    const { tokens } = await oauth2Client.getToken(code);

    // Salva o token nas configurações do usuário
    const tokenJson = JSON.stringify(tokens);

    const { data: existente } = await supabase
      .from('configuracoes_agenda')
      .select('id')
      .eq('usuario_id', usuario_id)
      .single();

    if (existente) {
      await supabase
        .from('configuracoes_agenda')
        .update({ google_token: tokenJson })
        .eq('usuario_id', usuario_id);
    } else {
      await supabase
        .from('configuracoes_agenda')
        .insert([{ usuario_id, google_token: tokenJson }]);
    }

    // Redireciona para a página de Google Calendar no frontend
    res.redirect('/pages/google-calendar.html?conectado=true');
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter token do Google: ' + err.message });
  }
}

// Sincronizar agendamento com Google Calendar
async function sincronizarEvento(req, res) {
  const { agendamento_id } = req.body;
  const usuario_id = req.usuario.id;

  // Busca token do usuário
  const { data: config } = await supabase
    .from('configuracoes_agenda')
    .select('google_token')
    .eq('usuario_id', usuario_id)
    .single();

  if (!config || !config.google_token) {
    return res.status(400).json({ erro: 'Conta do Google não conectada. Autorize primeiro.' });
  }

  // Busca o agendamento
  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select(`*, clientes(nome, email), espacos(nome)`)
    .eq('id', agendamento_id)
    .single();

  if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

  try {
    const oauth2Client = criarClienteOAuth();
    oauth2Client.setCredentials(JSON.parse(config.google_token));

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Monta o evento do Google Calendar
    const evento = {
      summary: agendamento.titulo,
      description: agendamento.descricao || '',
      location: agendamento.espacos ? agendamento.espacos.nome : '',
      start: { 
        dateTime: new Date(agendamento.data_inicio).toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: { 
        dateTime: new Date(agendamento.data_fim).toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      attendees: agendamento.clientes && agendamento.clientes.email
        ? [{ email: agendamento.clientes.email }]
        : []
    };

    let resposta;
    if (agendamento.google_event_id) {
      // Atualiza evento existente
      resposta = await calendar.events.update({
        calendarId: 'primary',
        eventId: agendamento.google_event_id,
        requestBody: evento
      });
    } else {
      // Cria novo evento
      resposta = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: evento
      });

      // Salva o ID do evento do Google no agendamento
      await supabase
        .from('agendamentos')
        .update({ google_event_id: resposta.data.id })
        .eq('id', agendamento_id);
    }

    res.json({ mensagem: 'Evento sincronizado com Google Calendar!', evento_id: resposta.data.id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao sincronizar com Google Calendar: ' + err.message });
  }
}

// Listar eventos do Google Calendar
async function listarEventosGoogle(req, res) {
  const usuario_id = req.usuario.id;

  const { data: config } = await supabase
    .from('configuracoes_agenda')
    .select('google_token')
    .eq('usuario_id', usuario_id)
    .single();

  if (!config || !config.google_token) {
    return res.status(400).json({ erro: 'Conta do Google não conectada.' });
  }

  try {
    const oauth2Client = criarClienteOAuth();
    oauth2Client.setCredentials(JSON.parse(config.google_token));

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const resposta = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 20,
      orderBy: 'startTime',
      singleEvents: true,
      timeMin: new Date().toISOString()
    });

    res.json(resposta.data.items);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar eventos: ' + err.message });
  }
}

// Importar eventos do Google para o banco local
async function importarEventosGoogle(req, res) {
  const usuario_id = req.usuario.id;

  const { data: config } = await supabase
    .from('configuracoes_agenda')
    .select('google_token')
    .eq('usuario_id', usuario_id)
    .single();

  if (!config || !config.google_token) {
    return res.status(400).json({ erro: 'Conta do Google não conectada.' });
  }

  try {
    const oauth2Client = criarClienteOAuth();
    oauth2Client.setCredentials(JSON.parse(config.google_token));

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const resposta = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 50,
      orderBy: 'startTime',
      singleEvents: true,
      timeMin: new Date().toISOString()
    });

    const eventosGoogle = resposta.data.items || [];
    let importados = 0;

    for (const evento of eventosGoogle) {
      if (!evento.start || (!evento.start.dateTime && !evento.start.date)) continue;

      const { data: existente } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('google_event_id', evento.id)
        .single();

      if (!existente) {
        let inicio = evento.start.dateTime || `${evento.start.date}T00:00:00Z`;
        let fim = evento.end.dateTime || `${evento.end.date}T23:59:59Z` || inicio;

        await supabase.from('agendamentos').insert([{
          usuario_id,
          titulo: evento.summary || 'Evento do Google',
          descricao: evento.description || '',
          data_inicio: inicio,
          data_fim: fim,
          status: 'confirmado',
          cor: '#10B981',
          google_event_id: evento.id
        }]);
        importados++;
      }
    }

    res.json({ mensagem: `${importados} evento(s) importado(s) do Google Calendar.` });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao importar do Google: ' + err.message });
  }
}

// =====================================
// Funções em Background (Chamadas Internas do Controlador, Não travam a requisição)
// =====================================

async function deleteAgendamentoBackground(usuario_id, google_event_id) {
  if (!usuario_id || !google_event_id) return;
  try {
    const { data: config } = await supabase.from('configuracoes_agenda').select('google_token').eq('usuario_id', usuario_id).single();
    if (!config || !config.google_token) return;
    
    const oauth2Client = criarClienteOAuth();
    oauth2Client.setCredentials(JSON.parse(config.google_token));
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({ calendarId: 'primary', eventId: google_event_id });
  } catch (err) {
    console.error('Falha no deleteAgendamentoBackground:', err.message);
  }
}

async function syncAgendamentoBackground(usuario_id, agendamento_id) {
  if (!usuario_id || !agendamento_id) return;
  try {
    const { data: config } = await supabase.from('configuracoes_agenda').select('google_token').eq('usuario_id', usuario_id).single();
    if (!config || !config.google_token) return; 
    
    const { data: agendamento } = await supabase.from('agendamentos').select('*, clientes(nome, email), espacos(nome)').eq('id', agendamento_id).single();
    if (!agendamento) return;
    
    const isAtivo = ['confirmado', 'agendado', 'pendente'].includes(agendamento.status);
    
    if (!isAtivo) {
      if (agendamento.google_event_id) {
        await deleteAgendamentoBackground(usuario_id, agendamento.google_event_id);
        await supabase.from('agendamentos').update({ google_event_id: null }).eq('id', agendamento_id);
      }
      return;
    }
    
    const oauth2Client = criarClienteOAuth();
    oauth2Client.setCredentials(JSON.parse(config.google_token));
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const evento = {
      summary: agendamento.titulo,
      description: agendamento.descricao || '',
      location: agendamento.espacos ? agendamento.espacos.nome : '',
      start: { dateTime: new Date(agendamento.data_inicio).toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: new Date(agendamento.data_fim).toISOString(), timeZone: 'America/Sao_Paulo' },
      attendees: agendamento.clientes && agendamento.clientes.email ? [{ email: agendamento.clientes.email }] : []
    };
    
    if (agendamento.google_event_id) {
      await calendar.events.update({ calendarId: 'primary', eventId: agendamento.google_event_id, requestBody: evento });
    } else {
      const resposta = await calendar.events.insert({ calendarId: 'primary', requestBody: evento });
      await supabase.from('agendamentos').update({ google_event_id: resposta.data.id }).eq('id', agendamento_id);
    }
  } catch (err) {
    console.error('Falha no syncAgendamentoBackground:', err.message);
  }
}

module.exports = { 
  gerarUrlAutorizacao, 
  receberCallback, 
  sincronizarEvento, 
  listarEventosGoogle, 
  importarEventosGoogle,
  syncAgendamentoBackground,
  deleteAgendamentoBackground
};
