// scripts/profile_modal.js

// --- Variáveis de Configuração ---
const PROFILE_MODAL_ID = 'profile-modal';
const PROFILE_BTN_ID = 'profile-btn'; 
const LOGOUT_BTN_ID = 'logout-btn'; 
// IDs dos Painéis e Botões
const MENU_DADOS_ID = 'menu-dados-pessoais';
const MENU_PEDIDOS_ID = 'menu-ultimos-pedidos';
const CONTENT_DADOS_ID = 'content-dados';
const CONTENT_PEDIDOS_ID = 'content-pedidos';
const ORDERS_CONTAINER_ID = 'order-history-container';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obter Elementos do DOM
    const profileModal = document.getElementById(PROFILE_MODAL_ID);
    const profileBtn = document.getElementById(PROFILE_BTN_ID);
    const logoutBtn = document.getElementById(LOGOUT_BTN_ID);
    const menuButtons = document.querySelectorAll('.menu-button');
    const contentPanels = document.querySelectorAll('.content-panel');
    const ordersContainer = document.getElementById(ORDERS_CONTAINER_ID);

    // 2. Função para Carregar os Dados do Usuário
    function loadUserProfile() {
        const user = JSON.parse(localStorage.getItem('user'));
        
        const nameDisplay = document.getElementById('profile-name-display');
        const emailDisplay = document.getElementById('profile-email-display');

        if (nameDisplay) nameDisplay.textContent = user?.nome || 'Usuário Desconhecido';
        if (emailDisplay) emailDisplay.textContent = user?.email || 'E-mail não disponível';
    }
    
    // 3. Função para Buscar Pedidos (APENAS API)
    async function fetchOrders() {
        if (!ordersContainer) return [];
        ordersContainer.innerHTML = '<p class="text-gray-500 text-center">Buscando pedidos...</p>';
        
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            ordersContainer.innerHTML = '<p class="text-red-500">Faça login para ver seu histórico de pedidos.</p>';
            return []; 
        }
        
        try {
            // Assume API_URL está globalmente disponível (config.js)
            const response = await fetch(`${API_URL}/pedidos`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                // Tenta ler o erro do servidor para mensagem mais clara
                const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar' }));
                throw new Error(errorData.message || 'Falha ao carregar pedidos: Erro no servidor.');
            }
            
            const data = await response.json();
            
            return Array.isArray(data) ? data : (data.pedidos || []);
            
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error.message);
            ordersContainer.innerHTML = `<p class="text-red-500 text-center p-4">Falha ao carregar pedidos. Verifique sua conexão ou API.</p>`;
            return []; 
        }
    }
    
    // 4. Função para Renderizar Pedidos
    function renderOrders(orders) {
        if (!ordersContainer) return;
        ordersContainer.innerHTML = '';
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="text-gray-500 text-center p-4">Você ainda não fez nenhum pedido.</p>';
            return;
        }

        orders.forEach(order => {
            // Nota: Se sua API retornar o 'status' no objeto Pedido, use-o. 
            // O Prisma schema atual não tem campo 'status' em Pedido. 
            // Usaremos um status mock para visualização, até que você adicione o campo no DB.
            const statusMock = order.status || (Math.random() > 0.7 ? 'Cancelado' : Math.random() > 0.4 ? 'Em Preparação' : 'Entregue');
            
            const statusColor = statusMock === 'Entregue' ? 'bg-secondary' : 
                                statusMock === 'Cancelado' ? 'bg-red-500' : 'bg-yellow-500';
            
            const totalFormatado = typeof window.formatCurrency === 'function' 
                ? window.formatCurrency(order.valor) 
                : `R$ ${order.valor.toFixed(2).replace('.', ',')}`;
            
            // Ajusta a data para o formato brasileiro
            const dataFormatada = new Date(order.data_pedido).toLocaleDateString('pt-BR');


            const orderCard = `
                <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-lg text-primary">Pedido #${order.id}</p>
                        <p class="text-sm text-gray-600">Data: ${dataFormatada}</p>
                        <p class="text-sm text-gray-600">${order.itens_pedido?.length || 0} item(s)</p>
                    </div>
                    <div class="text-right">
                        <span class="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColor} mb-1">
                            ${statusMock}
                        </span>
                        <p class="font-extrabold text-xl">${totalFormatado}</p>
                    </div>
                </div>
            `;
            ordersContainer.innerHTML += orderCard;
        });
    }


    // 5. Função para Alternar o Conteúdo
    async function switchContent(contentId) {
        document.getElementById('close-profile-modal-btn')?.focus(); // Foca no botão de fechar para tirar o foco dos botões de menu

        menuButtons.forEach(btn => btn.classList.remove('bg-gray-200', 'text-primary'));
        contentPanels.forEach(panel => panel.classList.add('hidden'));

        if (contentId === CONTENT_DADOS_ID) {
            document.getElementById(MENU_DADOS_ID)?.classList.add('bg-gray-200', 'text-primary');
            document.getElementById(CONTENT_DADOS_ID)?.classList.remove('hidden');
        } else if (contentId === CONTENT_PEDIDOS_ID) {
            document.getElementById(MENU_PEDIDOS_ID)?.classList.add('bg-gray-200', 'text-primary');
            const pedidosPanel = document.getElementById(CONTENT_PEDIDOS_ID);
            if (pedidosPanel) {
                pedidosPanel.classList.remove('hidden');
                const orders = await fetchOrders();
                renderOrders(orders);
            }
        }
    }


    // 6. Função para Abrir/Fechar o Modal
    function toggleProfileModal() {
        const closeBtn = document.getElementById('close-profile-modal-btn');
        if (profileModal) {
            profileModal.classList.toggle('hidden');
            if (!profileModal.classList.contains('hidden')) {
                loadUserProfile(); 
                switchContent(CONTENT_DADOS_ID); 
                if(closeBtn) closeBtn.focus(); // Foca no botão de fechar
            }
        }
    }

    // 7. Função de Logout
    function handleLogout(event) {
        event.preventDefault();
        
        localStorage.clear(); // Limpa todo o localStorage
        
        window.location.href = 'login.html';
    }

    // 8. Configurar Event Listeners
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleProfileModal);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Listeners do Menu de Navegação
    document.getElementById(MENU_DADOS_ID)?.addEventListener('click', () => switchContent(CONTENT_DADOS_ID));
    document.getElementById(MENU_PEDIDOS_ID)?.addEventListener('click', () => switchContent(CONTENT_PEDIDOS_ID));

    // Listeners de Fechar Modal (Overlay e ESC)
    const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', toggleProfileModal);

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                toggleProfileModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !profileModal.classList.contains('hidden')) {
                toggleProfileModal();
            }
        });
    }
    
    loadUserProfile();
    // Inicializa o primeiro painel ativo
    switchContent(CONTENT_DADOS_ID);
});