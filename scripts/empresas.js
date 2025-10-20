document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    if (!token || !user || user.role !== 'ADMIN') {
        alert('Acesso negado. Faça login como administrador.');
        window.location.href = '../pages/login.html';
        return;
    }

    const currentPage = 'empresas';
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
            if (response.status === 401 || response.status === 403) {
                 localStorage.clear();
                 alert('Sessão expirada ou acesso negado. Faça login novamente.');
                 window.location.href = '../pages/login.html';
                 throw new Error('Unauthorized');
            }
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            return await response.json();
        } catch (error) {
            console.error(`Erro em ${endpoint}:`, error);
            return null;
        }
    };

    const renderEmpresas = async () => {
        const container = document.getElementById('empresas-content');
        const empresas = await fetchData('empresas');

        if (!container) return;

        if (empresas && empresas.length > 0) {
            let tableHTML = '<table><thead><tr><th>ID</th><th>Nome</th><th>CNPJ</th><th>Email</th></tr></thead><tbody>';
            empresas.forEach(e => {
                const cnpjFormatado = e.cnpj || 'N/A';
                tableHTML += `<tr><td>${e.id}</td><td>${e.nome}</td><td>${cnpjFormatado}</td><td>${e.email}</td></tr>`;
            });
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        } else {
            container.innerHTML = '<p>Nenhuma empresa cadastrada.</p>';
        }
    };

    renderEmpresas();
});