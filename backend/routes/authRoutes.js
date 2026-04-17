// Rotas de autenticação
const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');

// POST /api/auth/register - cadastrar novo usuário
router.post('/register', registrar);

// POST /api/auth/login - fazer login
router.post('/login', login);

module.exports = router;
