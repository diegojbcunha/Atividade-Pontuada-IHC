// Middleware de autenticação JWT
// Verifica se o usuário está logado antes de acessar rotas protegidas

const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  // Pega o token do cabeçalho Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login para continuar.' });
  }

  // Verifica se o token é válido
  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido ou expirado.' });
    }
    req.usuario = usuario; // salva os dados do usuário na requisição
    next(); // continua para a próxima função
  });
}

module.exports = verificarToken;
