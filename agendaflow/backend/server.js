// Servidor principal do AgendaFlow
// Configura o Express, registra todas as rotas e inicia o servidor

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ==========================================
// Configurações gerais
// ==========================================

// Permite requisições de qualquer origem (necessário para o frontend)
app.use(cors());

// Permite receber dados JSON no corpo das requisições
app.use(express.json());

// Serve os arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ==========================================
// Rotas da API
// ==========================================

const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const espacoRoutes = require('./routes/espacoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const bloqueioRoutes = require('./routes/bloqueioRoutes');
const lembreteRoutes = require('./routes/lembreteRoutes');
const configuracaoRoutes = require('./routes/configuracaoRoutes');
const googleRoutes = require('./routes/googleRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/espacos', espacoRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/bloqueios', bloqueioRoutes);
app.use('/api/lembretes', lembreteRoutes);
app.use('/api/configuracoes', configuracaoRoutes);
app.use('/api/google', googleRoutes);

// ==========================================
// Rota raiz - redireciona para o login
// ==========================================
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// ==========================================
// Tratamento de erros gerais
// ==========================================
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err.message);
  res.status(500).json({ erro: 'Ocorreu um erro interno no servidor.' });
});

// ==========================================
// Inicializa o servidor
// ==========================================
const PORTA = process.env.PORT || 3003;
app.listen(PORTA, () => {
  console.log(`✅ AgendaFlow rodando em http://localhost:${PORTA}`);
  console.log(`📅 Sistema de Agendamento e Gestão iniciado com sucesso!`);
});

// Exporta o app para que plataformas Serverless (como Vercel) consigam rodá-lo
module.exports = app;
