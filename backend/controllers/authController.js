// Controlador de autenticação
// Gerencia o registro e login de usuários

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
require('dotenv').config();

// Registrar novo usuário
async function registrar(req, res) {
  const { nome, email, senha } = req.body;

  // Validação básica
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  // Verificar se o email já existe
  const { data: usuarioExistente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();

  if (usuarioExistente) {
    return res.status(400).json({ erro: 'Este email já está cadastrado.' });
  }

  // Criptografa a senha antes de salvar
  const senhaCriptografada = await bcrypt.hash(senha, 10);

  // Salva o novo usuário no banco
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email, senha: senhaCriptografada }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ erro: 'Erro ao criar usuário: ' + error.message });
  }

  res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuario: { id: data.id, nome: data.nome, email: data.email } });
}

// Login de usuário
async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  // Busca o usuário pelo email
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !usuario) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  }

  // Compara a senha digitada com a senha salva
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  }

  // Gera o token JWT com os dados do usuário
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // token válido por 24 horas
  );

  res.json({
    mensagem: 'Login realizado com sucesso!',
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
  });
}

module.exports = { registrar, login };
