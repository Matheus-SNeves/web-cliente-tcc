// Arquivo: pedidos.js (CORRIGIDO)
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // REMOVIDO: API_URL (vem de utils.js)

    if (!token || !user || user.role !== 'ADMIN') {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = '../login.html'; // Assumindo que a pasta admin está um nível acima de login
        return;
    }

    const currentPage = 'pedidos';
    const navItem = document.querySelector(`.nav-item[data-page=${currentPage}]`);
    if (navItem) navItem.classList.add('active');

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../login.html'; 
    });

    // REMOVIDO: Função fetchData duplicada. Usaremos authFetch de utils.js

    const renderPedidos = async () => {
        const container = document.getElementById('pedidos-content');
        
        try {
            // USANDO authFetch global
            const response = await authFetch('pedidos');
            if (!response.ok) throw new Error('Falha ao buscar pedidos.');
            
            const pedidos = await response.json();

            if (!container) return;

            if (pedidos && pedidos.length > 0) {
                let tableHTML = '<table><thead><tr><th>ID Pedido</th><th>Cliente</th><th>Data</th><th>Valor Total</th></tr></thead><tbody>';
                pedidos.forEach(p => {
                    const dataFormatada = new Date(p.data_pedido).toLocaleString('pt-BR');
                    const valorFormatado = `R$ ${Number(p.valor || 0).toFixed(2).replace('.', ',')}`;
                    tableHTML += `<tr><td>${p.id}</td><td>${p.cliente?.nome || ''} (ID: ${p.id_cliente || ''})</td><td>${dataFormatada}</td><td>${valorFormatado}</td></tr>`;
                });
                tableHTML += '</tbody></table>';
                container.innerHTML = tableHTML;
            } else {
                container.innerHTML = '<p>Nenhum pedido encontrado.</p>';
            }
        } catch (error) {
            console.error('Erro ao renderizar pedidos:', error);
            if (error.message !== 'Unauthorized' && container) {
                 container.innerHTML = '<p>Erro ao carregar pedidos.</p>';
            }
        }
    };

    renderPedidos();
});