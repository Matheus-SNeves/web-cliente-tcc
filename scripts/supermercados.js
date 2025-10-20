document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.supermarkets-container');

    const renderSupermarkets = (supermercados) => {
        if (!container) return;
        container.innerHTML = '';

        if (supermercados.length === 0) {
            container.innerHTML = '<p>Nenhum supermercado cadastrado.</p>';
            return;
        }

        supermercados.forEach(sup => {
            const supItem = document.createElement('a');
            supItem.href = `produtos.html?supermarket=${sup.id}&name=${encodeURIComponent(sup.nome)}`;
            supItem.className = 'supermarket-card';
            supItem.innerHTML = `
                <img src="${getFullImage(sup.logo)}" alt="${sup.nome}">
                <div class="supermarket-info">
                    <h3>${sup.nome}</h3>
                    <p>Entrega Rápida</p>
                </div>
            `;
            container.appendChild(supItem);
        });
    };

    const fetchData = async () => {
        try {
            const response = await authFetch('empresas');

            if (!response.ok) {
                throw new Error('Erro ao carregar a lista de supermercados.');
            }

            const supermercados = await response.json();
            renderSupermarkets(supermercados);

        } catch (error) {
            console.error('Erro ao buscar supermercados:', error);
            if (error.message !== 'Unauthorized') {
                 container.innerHTML = '<p>Erro ao carregar supermercados. Tente novamente.</p>';
            }
        }
    };

    fetchData();
});