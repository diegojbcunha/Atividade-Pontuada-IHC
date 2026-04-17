// Rotas de agendamentos
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
  listarAgendamentos,
  buscarAgendamento,
  criarAgendamento,
  atualizarStatus,
  atualizarAgendamento,
  excluirAgendamento
} = require('../controllers/agendamentoController');

router.get('/', verificarToken, listarAgendamentos);              // GET /api/agendamentos
router.get('/:id', verificarToken, buscarAgendamento);            // GET /api/agendamentos/:id
router.post('/', criarAgendamento);                               // POST /api/agendamentos (público para cliente agendar)
router.patch('/:id/status', verificarToken, atualizarStatus);     // PATCH /api/agendamentos/:id/status
router.put('/:id', verificarToken, atualizarAgendamento);         // PUT /api/agendamentos/:id
router.delete('/:id', verificarToken, excluirAgendamento);        // DELETE /api/agendamentos/:id

module.exports = router;
