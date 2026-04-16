// Rotas de configurações da agenda
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { buscarConfiguracoes, salvarConfiguracoes, salvarTokenGoogle } = require('../controllers/configuracaoController');

router.get('/', verificarToken, buscarConfiguracoes);        // GET /api/configuracoes
router.post('/', verificarToken, salvarConfiguracoes);       // POST /api/configuracoes
router.post('/google-token', verificarToken, salvarTokenGoogle); // POST /api/configuracoes/google-token

module.exports = router;
