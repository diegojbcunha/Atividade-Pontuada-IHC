// Controlador de bloqueios de horário
// Permite bloquear períodos em que não haverá atendimento

const supabase = require('../config/supabase');

// Listar todos os bloqueios
async function listarBloqueios(req, res) {
  const { data, error } = await supabase
    .from('bloqueios')
    .select(`*, espacos(id, nome)`)
    .order('data_inicio');

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Criar bloqueio de horário
async function bloquearHorario(req, res) {
  const { espaco_id, motivo, data_inicio, data_fim } = req.body;
  const usuario_id = req.usuario ? req.usuario.id : null;

  if (!data_inicio || !data_fim) {
    return res.status(400).json({ erro: 'Data de início e fim são obrigatórias.' });
  }

  if (new Date(data_inicio) >= new Date(data_fim)) {
    return res.status(400).json({ erro: 'A data de início deve ser antes da data de fim.' });
  }

  const { data, error } = await supabase
    .from('bloqueios')
    .insert([{ espaco_id, usuario_id, motivo, data_inicio, data_fim }])
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.status(201).json(data);
}

// Remover bloqueio
async function removerBloqueio(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from('bloqueios').delete().eq('id', id);

  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Bloqueio removido com sucesso.' });
}

module.exports = { listarBloqueios, bloquearHorario, removerBloqueio };
