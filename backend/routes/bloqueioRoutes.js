// Rotas de bloqueios de horário
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { listarBloqueios, bloquearHorario, removerBloqueio } = require('../controllers/bloqueioController');

router.get('/', verificarToken, listarBloqueios);        // GET /api/bloqueios
router.post('/', verificarToken, bloquearHorario);        // POST /api/bloqueios
router.delete('/:id', verificarToken, removerBloqueio);  // DELETE /api/bloqueios/:id

module.exports = router;
