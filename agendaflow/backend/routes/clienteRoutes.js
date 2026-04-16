// Rotas de clientes
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { listarClientes, buscarCliente, criarCliente, atualizarCliente, excluirCliente } = require('../controllers/clienteController');

router.get('/', verificarToken, listarClientes);       // GET /api/clientes
router.get('/:id', verificarToken, buscarCliente);     // GET /api/clientes/:id
router.post('/', verificarToken, criarCliente);        // POST /api/clientes
router.put('/:id', verificarToken, atualizarCliente);  // PUT /api/clientes/:id
router.delete('/:id', verificarToken, excluirCliente); // DELETE /api/clientes/:id

module.exports = router;
