// Rotas de lembretes
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { enviarLembrete, listarLembretes } = require('../services/lembreteService');

router.get('/', verificarToken, listarLembretes);                                // GET /api/lembretes
router.post('/enviar/:id', verificarToken, (req, res) => enviarLembrete(req.params.id, res)); // POST /api/lembretes/enviar/:id

module.exports = router;
