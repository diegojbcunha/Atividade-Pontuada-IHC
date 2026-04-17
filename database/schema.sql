-- ===========================================
-- AgendaFlow - Schema do Banco de Dados
-- Execute este arquivo no SQL Editor do Supabase
-- ===========================================

-- Tabela de usuários (administradores/profissionais)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) DEFAULT 'admin', -- 'admin' ou 'profissional'
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(20),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de espaços (salas, consultórios, etc.)
CREATE TABLE IF NOT EXISTS espacos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  capacidade INT DEFAULT 1,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  espaco_id UUID REFERENCES espacos(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  status VARCHAR(30) DEFAULT 'agendado',
  -- Status: agendado, confirmado, pendente, cancelado, concluido, bloqueado
  cor VARCHAR(10) DEFAULT '#2563EB',
  google_event_id VARCHAR(255), -- ID do evento no Google Calendar
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de bloqueios de horário
CREATE TABLE IF NOT EXISTS bloqueios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  espaco_id UUID REFERENCES espacos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo VARCHAR(200),
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS lembretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) DEFAULT 'email', -- 'email' ou 'notificacao'
  enviado BOOLEAN DEFAULT FALSE,
  enviado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de configurações da agenda
CREATE TABLE IF NOT EXISTS configuracoes_agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  hora_inicio TIME DEFAULT '08:00',
  hora_fim TIME DEFAULT '18:00',
  intervalo_minutos INT DEFAULT 30,
  dias_semana VARCHAR(50) DEFAULT '1,2,3,4,5', -- 0=dom, 1=seg, ..., 6=sab
  visualizacao_padrao VARCHAR(10) DEFAULT 'semana', -- 'dia', 'semana', 'mes'
  cor_padrao VARCHAR(10) DEFAULT '#2563EB',
  google_token TEXT, -- token OAuth2 do Google
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- Dados iniciais de exemplo
-- ===========================================

-- Espaços de exemplo
INSERT INTO espacos (nome, descricao, capacidade) VALUES
  ('Sala 01', 'Sala de reuniões principal', 10),
  ('Consultório A', 'Consultório individual', 1),
  ('Laboratório', 'Laboratório de informática', 30)
ON CONFLICT DO NOTHING;

-- Trigger para atualizar campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agendamentos_atualizado
  BEFORE UPDATE ON agendamentos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_config_atualizado
  BEFORE UPDATE ON configuracoes_agenda
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
