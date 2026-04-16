// Serviço de lembretes
// Envia lembretes por e-mail usando Nodemailer

const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
require('dotenv').config();

// Configura o transportador de e-mail
function criarTransportador() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Envia um lembrete por e-mail para o cliente
async function enviarLembrete(agendamentoId, res) {
  // Busca o agendamento com dados do cliente
  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .select(`*, clientes(nome, email), espacos(nome)`)
    .eq('id', agendamentoId)
    .single();

  if (error || !agendamento) {
    return res.status(404).json({ erro: 'Agendamento não encontrado.' });
  }

  if (!agendamento.clientes || !agendamento.clientes.email) {
    return res.status(400).json({ erro: 'O cliente não possui e-mail cadastrado.' });
  }

  const dataFormatada = new Date(agendamento.data_inicio).toLocaleString('pt-BR');
  const espaco = agendamento.espacos ? agendamento.espacos.nome : 'local a definir';

  // Monta o e-mail
  const opcoes = {
    from: process.env.EMAIL_USER,
    to: agendamento.clientes.email,
    subject: `Lembrete: ${agendamento.titulo} - AgendaFlow`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 500px; margin: auto;">
        <div style="background: #2563EB; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">📅 Lembrete de Agendamento</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Olá, <strong>${agendamento.clientes.nome}</strong>!</p>
          <p>Este é um lembrete do seu agendamento:</p>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding:6px 0; color:#6B7280;">📋 Serviço:</td><td><strong>${agendamento.titulo}</strong></td></tr>
            <tr><td style="padding:6px 0; color:#6B7280;">🕒 Data/Hora:</td><td><strong>${dataFormatada}</strong></td></tr>
            <tr><td style="padding:6px 0; color:#6B7280;">📍 Local:</td><td><strong>${espaco}</strong></td></tr>
          </table>
          <p style="margin-top:16px; color:#6B7280; font-size:13px;">Em caso de dúvidas, entre em contato conosco.</p>
          <p style="color:#2563EB; font-weight:bold;">AgendaFlow</p>
        </div>
      </div>
    `
  };

  try {
    const transportador = criarTransportador();
    await transportador.sendMail(opcoes);

    // Registra o lembrete como enviado no banco
    await supabase.from('lembretes').insert([{
      agendamento_id: agendamentoId,
      tipo: 'email',
      enviado: true,
      enviado_em: new Date().toISOString()
    }]);

    res.json({ mensagem: 'Lembrete enviado com sucesso para ' + agendamento.clientes.email });
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao enviar e-mail: ' + err.message });
  }
}

// Listar lembretes enviados
async function listarLembretes(req, res) {
  const { data, error } = await supabase
    .from('lembretes')
    .select(`*, agendamentos(titulo, data_inicio, clientes(nome, email))`)
    .order('criado_em', { ascending: false });

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
}

module.exports = { enviarLembrete, listarLembretes };
