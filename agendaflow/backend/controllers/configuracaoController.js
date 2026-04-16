// Controlador de configurações da agenda
// Permite personalizar horários, intervalos, cores e visualização

const supabase = require('../config/supabase');

// Buscar configurações do usuário logado
async function buscarConfiguracoes(req, res) {
  const usuario_id = req.usuario.id;

  const { data, error } = await supabase
    .from('configuracoes_agenda')
    .select('*')
    .eq('usuario_id', usuario_id)
    .single();

  if (error) {
    // Se não existir, retorna configurações padrão
    return res.json({
      hora_inicio: '08:00',
      hora_fim: '18:00',
      intervalo_minutos: 30,
      dias_semana: '1,2,3,4,5',
      visualizacao_padrao: 'semana',
      cor_padrao: '#2563EB'
    });
  }

  res.json(data);
}

// Salvar ou atualizar configurações
async function salvarConfiguracoes(req, res) {
  const usuario_id = req.usuario.id;
  const { hora_inicio, hora_fim, intervalo_minutos, dias_semana, visualizacao_padrao, cor_padrao } = req.body;

  // Verifica se já existem configurações para esse usuário
  const { data: existente } = await supabase
    .from('configuracoes_agenda')
    .select('id')
    .eq('usuario_id', usuario_id)
    .single();

  let resultado;

  if (existente) {
    // Atualiza as configurações existentes
    const { data, error } = await supabase
      .from('configuracoes_agenda')
      .update({ hora_inicio, hora_fim, intervalo_minutos, dias_semana, visualizacao_padrao, cor_padrao })
      .eq('usuario_id', usuario_id)
      .select()
      .single();

    if (error) return res.status(500).json({ erro: error.message });
    resultado = data;
  } else {
    // Cria novas configurações
    const { data, error } = await supabase
      .from('configuracoes_agenda')
      .insert([{ usuario_id, hora_inicio, hora_fim, intervalo_minutos, dias_semana, visualizacao_padrao, cor_padrao }])
      .select()
      .single();

    if (error) return res.status(500).json({ erro: error.message });
    resultado = data;
  }

  res.json(resultado);
}

// Salvar token do Google Calendar nas configurações
async function salvarTokenGoogle(req, res) {
  const usuario_id = req.usuario.id;
  const { google_token } = req.body;

  const { data: existente } = await supabase
    .from('configuracoes_agenda')
    .select('id')
    .eq('usuario_id', usuario_id)
    .single();

  if (existente) {
    await supabase
      .from('configuracoes_agenda')
      .update({ google_token })
      .eq('usuario_id', usuario_id);
  } else {
    await supabase
      .from('configuracoes_agenda')
      .insert([{ usuario_id, google_token }]);
  }

  res.json({ mensagem: 'Token do Google salvo com sucesso.' });
}

module.exports = { buscarConfiguracoes, salvarConfiguracoes, salvarTokenGoogle };
