// Rotas de espaços
const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { listarEspacos, buscarEspaco, criarEspaco, atualizarEspaco, excluirEspaco } = require('../controllers/espacoController');

router.get('/', listarEspacos);                        // GET /api/espacos (público - para agendamento público)
router.get('/:id', verificarToken, buscarEspaco);      // GET /api/espacos/:id
router.post('/', verificarToken, criarEspaco);         // POST /api/espacos
router.put('/:id', verificarToken, atualizarEspaco);   // PUT /api/espacos/:id
router.delete('/:id', verificarToken, excluirEspaco);  // DELETE /api/espacos/:id

module.exports = router;
