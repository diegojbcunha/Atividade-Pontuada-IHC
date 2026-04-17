// Configuração do cliente Supabase
// Aqui conectamos ao banco de dados Supabase usando as variáveis do arquivo .env

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cria o cliente Supabase com a URL e chave do projeto
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = supabase;
