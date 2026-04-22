// Camada de serviços do frontend
// Centraliza todas as chamadas à API do backend

const API_URL = '/api';

// Retorna o token JWT salvo no localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Salva dados do usuário no localStorage após login
function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

// Remove a sessão (logout)
function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/pages/login.html';
}

// Retorna os dados do usuário logado
function getUsuario() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}

// Verifica se o usuário está logado, redireciona se não estiver
function verificarLogin() {
  const token = getToken();
  if (!token) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

// Cabeçalhos padrão com autenticação
function getHeaders(comAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (comAuth) {
    headers['Authorization'] = 'Bearer ' + getToken();
  }
  return headers;
}

// ==========================================
// Funções genéricas de requisição HTTP
// ==========================================

async function apiGet(endpoint, autenticado = true) {
  const resposta = await fetch(API_URL + endpoint, {
    headers: getHeaders(autenticado)
  });
  if (resposta.status === 401 || resposta.status === 403) {
    limparSessao();
    return null;
  }
  return resposta.json();
}

async function apiPost(endpoint, dados, autenticado = true) {
  const resposta = await fetch(API_URL + endpoint, {
    method: 'POST',
    headers: getHeaders(autenticado),
    body: JSON.stringify(dados)
  });
  return resposta.json();
}

async function apiPut(endpoint, dados) {
  const resposta = await fetch(API_URL + endpoint, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return resposta.json();
}

async function apiPatch(endpoint, dados) {
  const resposta = await fetch(API_URL + endpoint, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(dados)
  });
  return resposta.json();
}

async function apiDelete(endpoint) {
  const resposta = await fetch(API_URL + endpoint, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return resposta.json();
}

// ==========================================
// Mostrar notificação toast na tela
// ==========================================

function mostrarToast(mensagem, tipo = 'success') {
  const container = document.getElementById('toastContainer') || criarToastContainer();

  const toast = document.createElement('div');
  const icone = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️';
  const cor = tipo === 'success' ? '#10B981' : tipo === 'error' ? '#EF4444' : '#2563EB';

  toast.style.cssText = `
    background: white;
    border-left: 4px solid ${cor};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    margin-top: 8px;
    font-size: 13.5px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease;
    max-width: 320px;
  `;
  toast.innerHTML = `<span>${icone}</span> <span>${mensagem}</span>`;
  container.appendChild(toast);

  // Remove o toast após 3 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function criarToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
  document.body.appendChild(container);
  return container;
}

// ==========================================
// Formatar data para exibição
// ==========================================
function formatarData(dataString) {
  if (!dataString) return '-';
  return new Date(dataString).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatarDataSimples(dataString) {
  if (!dataString) return '-';
  return new Date(dataString).toLocaleDateString('pt-BR');
}

// ==========================================
// Injeção Automática de Responsividade
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector('.topbar');
  const sidebar = document.getElementById('sidebar');

  // Adiciona o botão de hambúrguer na topbar
  if (topbar && sidebar && !document.getElementById('btnMenuMobile')) {
    const title = topbar.querySelector('.topbar-title');
    if (title) {
      const leftContainer = document.createElement('div');
      leftContainer.className = 'd-flex align-items-center gap-2';
      
      const btn = document.createElement('button');
      btn.id = 'btnMenuMobile';
      btn.className = 'btn d-md-none p-0 border-0 text-primary';
      btn.innerHTML = '<i class="bi bi-list fs-3"></i>';
      btn.onclick = (e) => {
        e.stopPropagation(); // Impede duplo acionamento 
        sidebar.classList.add('aberta');
      };
      
      topbar.insertBefore(leftContainer, title);
      leftContainer.appendChild(btn);
      leftContainer.appendChild(title);
      title.style.margin = '0';
    }
  }

  // Adiciona o botão de fechar dentro da sidebar (visível apenas no mobile)
  const sidebarBrand = document.querySelector('.sidebar-brand');
  if (sidebarBrand && !document.getElementById('btnCloseSidebar')) {
    sidebarBrand.classList.add('d-flex', 'justify-content-between', 'align-items-center');
    
    const btnClose = document.createElement('button');
    btnClose.id = 'btnCloseSidebar';
    btnClose.className = 'btn text-white d-md-none p-0 border-0';
    btnClose.innerHTML = '<i class="bi bi-x fs-1"></i>';
    btnClose.onclick = () => sidebar.classList.remove('aberta');
    
    sidebarBrand.appendChild(btnClose);
  }

  // Permitir fechar o sidebar clicando na parte escura (fora do menu)
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('aberta') && window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && e.target.id !== 'btnMenuMobile') {
        sidebar.classList.remove('aberta');
      }
    }
  });

  // Automação para transformar TODAS as tabelas em Responsivas (rolagem horizontal suave)
  const tabelas = document.querySelectorAll('table.table');
  tabelas.forEach(table => {
    // Só envelopa se o elemento 'pai' ainda não for o table-responsive do bootstrap
    if (!table.parentElement.classList.contains('table-responsive')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive border-0 m-0 p-0';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
});
