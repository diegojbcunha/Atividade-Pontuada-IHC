// Controlador de clientes
// Gerencia o cadastro e listagem de clientes

const supabase = require('../config/supabase');

// Listar todos os clientes
async function listarClientes(req, res) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome');

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Buscar cliente por ID
async function buscarCliente(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json(data);
}

// Criar novo cliente
async function criarCliente(req, res) {
  const { nome, email, telefone, observacoes } = req.body;

  if (!nome) return res.status(400).json({ erro: 'O nome do cliente é obrigatório.' });

  const { data, error } = await supabase
    .from('clientes')
    .insert([{ nome, email, telefone, observacoes }])
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.status(201).json(data);
}

// Atualizar cliente
async function atualizarCliente(req, res) {
  const { id } = req.params;
  const { nome, email, telefone, observacoes } = req.body;

  const { data, error } = await supabase
    .from('clientes')
    .update({ nome, email, telefone, observacoes })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

// Excluir cliente
async function excluirCliente(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from('clientes').delete().eq('id', id);

  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Cliente excluído com sucesso.' });
}

module.exports = { listarClientes, buscarCliente, criarCliente, atualizarCliente, excluirCliente };
