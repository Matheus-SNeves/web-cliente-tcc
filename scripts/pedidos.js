document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    if (!token || !user || user.role !== 'ADMIN') {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = '../pages/login.html';
        return;
    }

    const currentPage = 'pedidos';
    const navItem = document.querySelector(`.nav-item[data-page=${currentPage}]`);
    if (navItem) navItem.classList.add('active');

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../pages/login.html';
    });

    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            return await response.json();
        } catch (error) {
            console.error(`Erro em ${endpoint}:`, error);
            return null;
        }
    };

    const renderPedidos = async () => {
        const container = document.getElementById('pedidos-content');
        const pedidos = await fetchData('pedidos');

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
    };

    renderPedidos();
});