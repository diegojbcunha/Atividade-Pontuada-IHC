// Controlador de agendamentos
// Gerencia criação, listagem, atualização de status e cancelamento de agendamentos

const supabase = require('../config/supabase');

// Mapa de cores por status
const coresPorStatus = {
  agendado: '#2563EB',   // azul
  confirmado: '#10B981', // verde
  pendente: '#F59E0B',   // amarelo
  cancelado: '#EF4444',  // vermelho
  concluido: '#6B7280',  // cinza
  bloqueado: '#9CA3AF'   // cinza médio
};

// Listar todos os agendamentos (com dados do cliente e espaço)
async function listarAgendamentos(req, res) {
  const { data_inicio, data_fim, status } = req.query;

  let query = supabase
    .from('agendamentos')
    .select(`
      *,
      clientes (id, nome, email, telefone),
      espacos (id, nome)
    `)
    .order('data_inicio');

  // Filtros opcionais
  if (data_inicio) query = query.gte('data_inicio', data_inicio);
  if (data_fim) query = query.lte('data_fim', data_fim);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Buscar agendamento por ID
async function buscarAgendamento(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('agendamentos')
    .select(`*, clientes(*), espacos(*)`)
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  res.json(data);
}

// Criar novo agendamento
async function criarAgendamento(req, res) {
  const { cliente_id, espaco_id, titulo, descricao, data_inicio, data_fim, status } = req.body;

  if (!titulo || !data_inicio || !data_fim) {
    return res.status(400).json({ erro: 'Título, data de início e data de fim são obrigatórios.' });
  }

  // Verifica se o horário já está ocupado no mesmo espaço
  if (espaco_id) {
    const { data: conflito } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('espaco_id', espaco_id)
      .neq('status', 'cancelado')
      .lt('data_inicio', data_fim)
      .gt('data_fim', data_inicio);

    if (conflito && conflito.length > 0) {
      return res.status(409).json({ erro: 'Este espaço já está ocupado nesse horário.' });
    }

    // Verifica se o horário está bloqueado
    const { data: bloqueio } = await supabase
      .from('bloqueios')
      .select('id')
      .eq('espaco_id', espaco_id)
      .lt('data_inicio', data_fim)
      .gt('data_fim', data_inicio);

    if (bloqueio && bloqueio.length > 0) {
      return res.status(409).json({ erro: 'Este horário está bloqueado e não pode ser agendado.' });
    }
  }

  const statusUsado = status || 'agendado';
  const cor = coresPorStatus[statusUsado] || '#2563EB';
  const usuario_id = req.usuario ? req.usuario.id : null;

  const { data, error } = await supabase
    .from('agendamentos')
    .insert([{ cliente_id, espaco_id, usuario_id, titulo, descricao, data_inicio, data_fim, status: statusUsado, cor }])
    .select(`*, clientes(*), espacos(*)`)
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.status(201).json(data);
}

// Atualizar status do agendamento
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const statusValidos = ['agendado', 'confirmado', 'pendente', 'cancelado', 'concluido', 'bloqueado'];
  if (!statusValidos.includes(status)) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  const cor = coresPorStatus[status];

  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status, cor })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Atualizar agendamento completo
async function atualizarAgendamento(req, res) {
  const { id } = req.params;
  const { titulo, descricao, data_inicio, data_fim, cliente_id, espaco_id, status } = req.body;

  const statusUsado = status || 'agendado';
  const cor = coresPorStatus[statusUsado] || '#2563EB';

  const { data, error } = await supabase
    .from('agendamentos')
    .update({ titulo, descricao, data_inicio, data_fim, cliente_id, espaco_id, status: statusUsado, cor })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Excluir agendamento
async function excluirAgendamento(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from('agendamentos').delete().eq('id', id);

  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Agendamento excluído.' });
}

module.exports = { listarAgendamentos, buscarAgendamento, criarAgendamento, atualizarStatus, atualizarAgendamento, excluirAgendamento };
