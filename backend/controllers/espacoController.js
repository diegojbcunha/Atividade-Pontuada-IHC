// Controlador de espaços (salas, consultórios, laboratórios)
// Permite gerenciar os locais onde ocorrem os atendimentos

const supabase = require('../config/supabase');

// Listar todos os espaços
async function listarEspacos(req, res) {
  const { data, error } = await supabase
    .from('espacos')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Buscar espaço por ID
async function buscarEspaco(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('espacos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ erro: 'Espaço não encontrado.' });
  res.json(data);
}

// Criar novo espaço
async function criarEspaco(req, res) {
  const { nome, descricao, capacidade } = req.body;

  if (!nome) return res.status(400).json({ erro: 'O nome do espaço é obrigatório.' });

  const { data, error } = await supabase
    .from('espacos')
    .insert([{ nome, descricao, capacidade: capacidade || 1 }])
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.status(201).json(data);
}

// Atualizar espaço
async function atualizarEspaco(req, res) {
  const { id } = req.params;
  const { nome, descricao, capacidade, ativo } = req.body;

  const { data, error } = await supabase
    .from('espacos')
    .update({ nome, descricao, capacidade, ativo })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Excluir (desativar) espaço
async function excluirEspaco(req, res) {
  const { id } = req.params;
  // Desativa em vez de excluir para manter histórico
  const { error } = await supabase
    .from('espacos')
    .update({ ativo: false })
    .eq('id', id);

  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Espaço removido com sucesso.' });
}

module.exports = { listarEspacos, buscarEspaco, criarEspaco, atualizarEspaco, excluirEspaco };
