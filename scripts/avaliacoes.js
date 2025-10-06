document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    if (!token || !user || user.role !== 'ADMIN') {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = '../pages/login.html';
        return;
    }

    const currentPage = 'avaliacoes';
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

    const renderAvaliacoes = async () => {
        const container = document.getElementById('avaliacoes-content');
        const avaliacoes = await fetchData('avaliacoes');

        if (!container) return;

        if (avaliacoes && avaliacoes.length > 0) {
            let tableHTML = '<table><thead><tr><th>ID</th><th>Cliente</th><th>Produto</th><th>Nota</th><th>Comentário</th><th>Data</th></tr></thead><tbody>';
            avaliacoes.forEach(a => {
                const dataFormatada = new Date(a.data_avaliacao).toLocaleDateString('pt-BR');
                tableHTML += `<tr><td>${a.id}</td><td>${a.cliente?.nome || ''}</td><td>${a.produto?.nome || ''}</td><td>${a.nota}</td><td>${a.comentario || ''}</td><td>${dataFormatada}</td></tr>`;
            });
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } else {
            container.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
        }
    };

    renderAvaliacoes();
});