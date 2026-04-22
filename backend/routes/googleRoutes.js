// Rotas do Google Calendar
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { gerarUrlAutorizacao, receberCallback, sincronizarEvento, listarEventosGoogle, importarEventosGoogle } = require('../services/googleCalendarService');

router.get('/autorizar', verificarToken, gerarUrlAutorizacao);    // GET /api/google/autorizar
router.get('/callback', receberCallback);                        // GET /api/google/callback (retorno do Google)
router.post('/sincronizar', verificarToken, sincronizarEvento);  // POST /api/google/sincronizar
router.get('/eventos', verificarToken, listarEventosGoogle);     // GET /api/google/eventos
router.post('/importar', verificarToken, importarEventosGoogle); // POST /api/google/importar

module.exports = router;
