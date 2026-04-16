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
    res.redirect('/frontend/pages/google-calendar.html?conectado=true');
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
      start: { dateTime: agendamento.data_inicio },
      end: { dateTime: agendamento.data_fim },
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

module.exports = { gerarUrlAutorizacao, receberCallback, sincronizarEvento, listarEventosGoogle };
