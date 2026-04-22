# Documentação do Projeto: AgendaFlow

Este documento detalha o desenvolvimento do sistema **AgendaFlow**, desenvolvido para a Unidade Curricular de **Interface Homem-Computador** da Universidade Senai Cimatec.

---

## 🚀 1. Objetivo do Módulo
O objetivo do sistema **AgendaFlow** é fornecer uma solução web moderna e intuitiva para o gerenciamento de agendamentos e atendimentos. O módulo visa centralizar a organização de horários, espaços físicos e comunicação com clientes, eliminando falhas de agendamentos manuais e otimizando a produtividade de profissionais que dependem de uma gestão de tempo eficiente.

## ✨ 2. Funcionalidades Implementadas

### Core do Sistema
1.  **Agendamento Online**: Interface visual para marcação de serviços, seleção de datas e horários disponíveis.
2.  **Agenda por Status e Cores**: Organização visual utilizando o padrão de cores exigido (Azul: Agendado, Verde: Confirmado, Amarelo: Pendente, Vermelho: Cancelado).
3.  **Gestão de Espaços**: Cadastro e controle de ocupação de locais (salas, consultórios, etc.).
4.  **Bloqueio de Horários**: Funcionalidade para indisponibilizar períodos específicos (intervalos, reuniões, folgas).
5.  **Lembretes Automáticos**: Envio de notificações por e-mail para clientes via integração com provedor SMTP.

### Integrações e UX
6.  **Integração com Google Agenda**: Sincronização automática e bidirecional em background. Eventos criados no AgendaFlow são enviados ao Google, e exclusões são replicadas.
7.  **Responsividade Total**: Interface adaptada para Desktop, Tablets e Smartphones, incluindo Menu Hambúrguer dinâmico e tabelas fluidas.
8.  **Gestão de Clientes**: Cadastro completo de base de clientes para facilitar o fluxo de marcação.
9.  **Dashboard de Estatísticas**: Visão geral de atendimentos realizados e métricas de desempenho.

## 🛠️ 3. Tecnologias Utilizadas

### Front-end
- **HTML5 & CSS3**: Estrutura e estilização moderna com variáveis CSS.
- **Javascript (Vanilla)**: Lógica de interface e consumo de API sem frameworks pesados.
- **Bootstrap 5.3**: Utilizado para grid system e componentes de UI.
- **Bootstrap Icons**: Biblioteca de ícones vetoriais.

### Back-end
- **Node.js**: Ambiente de execução Javascript no servidor.
- **Express.js**: Framework para criação da API REST.
- **Supabase (PostgreSQL)**: Banco de dados relacional na nuvem.
- **Google Calendar API**: Integração com serviços externos via OAuth2.
- **Nodemailer**: Engine para disparo de e-mails de lembrete.
- **JWT (JSON Web Token)**: Autenticação e proteção de rotas.

---

## 🗄️ 4. Estrutura de Banco de Dados

O sistema utiliza um modelo relacional hospedado no Supabase:

-   **`usuarios`**: Gestores do sistema (id, nome, email, senha).
-   **`clientes`**: Base de contatos (id, nome, email, telefone).
-   **`espacos`**: Locais de atendimento (id, nome, capacidade, ativo).
-   **`agendamentos`**: Registro de compromissos (id, usuario_id, cliente_id, espaco_id, titulo, data_inicio, data_fim, status, google_event_id).
-   **`bloqueios`**: Períodos de indisponibilidade (id, usuario_id, data_inicio, data_fim, motivo).
-   **`lembretes`**: Log de disparos de notificações (id, agendamento_id, enviado_em, tipo).
-   **`configuracoes_agenda`**: Tokens de integração e preferências (id, usuario_id, google_token).

---

## 🔌 5. Endpoints da API (Principais)

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Autenticação de usuário e retorno de JWT |
| `GET` | `/api/agendamentos` | Lista todos os agendamentos |
| `POST` | `/api/agendamentos` | Cria novo registro (dispara sync Google) |
| `DELETE` | `/api/agendamentos/:id` | Exclui registro (dispara delete Google) |
| `POST` | `/api/google/autorizar` | Inicia fluxo OAuth2 do Google |
| `POST` | `/api/lembretes/enviar/:id` | Dispara e-mail de lembrete manual/auto |
| `GET` | `/api/espacos` | Lista espaços cadastrados |

---

## 🚀 6. Instruções para Execução

### Pré-requisitos
- Node.js instalado (v16 ou superior).
- Conta no Supabase (ou banco PostgreSQL equivalente).
- Credenciais da Google Cloud Platform (Client ID e Secret).

### Passo a Passo
1.  **Clonar o Projeto**: Extraia o arquivo .zip enviado.
2.  **Instalar Dependências**:
    ```bash
    npm install
    ```
3.  **Configurar Variáveis de Ambiente**:
    Crie/edite o arquivo `.env` na raiz com os seguintes campos:
    ```env
    PORT=3003
    SUPABASE_URL=sua_url
    SUPABASE_KEY=sua_chave
    JWT_SECRET=sua_assinatura
    GOOGLE_CLIENT_ID=seu_id
    GOOGLE_CLIENT_SECRET=seu_secret
    GOOGLE_REDIRECT_URI=http://localhost:3003/api/google/callback
    EMAIL_USER=seu_email@gmail.com
    EMAIL_PASS=sua_senha_app_google
    ```
4.  **Executar o Servidor**:
    ```bash
    npm run dev
    ```
5.  **Acessar o Sistema**:
    Abra o navegador em `http://localhost:3003/pages/login.html`.
