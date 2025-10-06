const icons = {
    "hortifruti": "https://cdn-icons-png.flaticon.com/512/5346/5346400.png",
    "acougue": "https://cdn-icons-png.flaticon.com/512/1534/1534825.png",
    "padaria": "https://cdn-icons-png.flaticon.com/512/7547/7547106.png",
    "laticinios": "https://cdn-icons-png.flaticon.com/512/3070/3070925.png",
    "bebidas": "https://cdn-icons-png.freepik.com/256/2405/2405451.png",
    "frios": "https://cdn-icons-png.flaticon.com/512/869/869664.png",
    "limpeza": "https://cdn-icons-png.freepik.com/512/994/994928.png",
    "higiene": "https://cdn-icons-png.flaticon.com/512/11264/11264253.png"
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryKey = urlParams.get('category');
    const storeId = parseInt(urlParams.get('storeId'));

    const titleElement = document.getElementById('page-title');
    const container = document.getElementById('products-container');
    const modal = document.getElementById('product-action-modal');

    if (!titleElement || !container || !modal) {
        console.error('Elementos da página de produtos não encontrados.');
        return;
    }

    // MODIFICADO: URL da API
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    const getFullImage = (src) => {
        const placeholder = 'https://via.placeholder.com/100?text=Sem+Imagem';
        if (!src) return placeholder;
        try {
            if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) return src;
            if (/^\/\//.test(src)) return window.location.protocol + src;
            if (src.startsWith('/')) return API_URL.replace(/\/$/, '') + src;
            return API_URL.replace(/\/$/, '') + '/' + src.replace(/^\//, '');
        } catch (e) {
            return placeholder;
        }
    };

    if (!categoryKey || !storeId) {
        titleElement.textContent = 'Informações inválidas';
        return;
    }

    try {
        // MODIFICADO: Busca produtos da categoria e os supermercados da API.
        // O endpoint de produtos pode ser otimizado no futuro para aceitar storeId.
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        const [productsResponse, supermarketsResponse] = await Promise.all([
            fetch(`${API_URL}/produtos?categoria=${categoryKey}`, { headers }),
            fetch(`${API_URL}/empresas`, { headers })
        ]);

        if (productsResponse.status === 401 || productsResponse.status === 403 || supermarketsResponse.status === 401 || supermarketsResponse.status === 403) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return;
        }
        
        let categoryProducts = productsResponse.ok ? await productsResponse.json() : [];
        let allSupermarkets = supermarketsResponse.ok ? await supermarketsResponse.json() : [];

        console.debug('/produtos?categoria status:', productsResponse.status, 'responseBody:', categoryProducts);
        console.debug('/empresas status:', supermarketsResponse.status, 'responseBody:', allSupermarkets);

        // Normaliza possíveis formatos: API pode retornar { produtos: [...] } ou objeto com chave de categoria
        if (categoryProducts && !Array.isArray(categoryProducts)) {
            // procura propriedades comuns
            if (Array.isArray(categoryProducts.produtos)) categoryProducts = categoryProducts.produtos;
            else if (Array.isArray(categoryProducts.items)) categoryProducts = categoryProducts.items;
            else if (categoryProducts[categoryKey] && Array.isArray(categoryProducts[categoryKey])) categoryProducts = categoryProducts[categoryKey];
            else {
                // tenta extrair primeiro array encontrado
                const firstArray = Object.values(categoryProducts).find(v => Array.isArray(v));
                if (firstArray) categoryProducts = firstArray;
            }
        }

        if (allSupermarkets && !Array.isArray(allSupermarkets)) {
            if (Array.isArray(allSupermarkets.empresas)) allSupermarkets = allSupermarkets.empresas;
            else if (Array.isArray(allSupermarkets.supermercados)) allSupermarkets = allSupermarkets.supermercados;
            else if (Array.isArray(allSupermarkets.data)) allSupermarkets = allSupermarkets.data;
            else {
                const firstArray = Object.values(allSupermarkets).find(v => Array.isArray(v));
                if (firstArray) allSupermarkets = firstArray;
            }
        }

        // Sem fallback local; confiamos na API para retornar produtos e supermercados

        const store = (allSupermarkets || []).find(s => s.id === storeId);

        titleElement.textContent = store ? `Produtos em ${store.nome}` : 'Produtos';

        if (!categoryProducts || categoryProducts.length === 0) {
            container.innerHTML = '<p>Nenhum produto encontrado nesta categoria.</p>';
            return;
        }

        container.innerHTML = '';
        categoryProducts.forEach(item => {
            const priceEntry = (item.precos || []).find(p => p.supermercado_id === storeId);
            if (!priceEntry) return;

            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            
            const priceText = `R$ ${priceEntry.preco.toFixed(2).replace('.', ',')}`;

            // Debug: log image fields to help diagnose missing images
            try { console.debug('produto id=', item.id, 'imagem raw=', item.imagem, 'normalized=', getFullImage(item.imagem)); } catch (e) {}

            productItem.innerHTML = `
                <img src="${getFullImage(item.imagem)}" alt="${item.nome}">
                <h4>${item.nome}</h4>
                <p>${priceText}</p>
            `;

            productItem.addEventListener('click', () => {
                showProductActionModal(item, store, priceText);
            });
            container.appendChild(productItem);
        });

    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        titleElement.textContent = 'Erro ao Carregar';
        container.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    }

    function showProductActionModal(product, store, priceText) {
        modal.classList.remove('hidden');
        modal.innerHTML = `
            <div class="action-modal-content">
                <div class="action-modal-header">
                    <h3>${product.nome}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="action-modal-body">
                    <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
                    <p>${priceText}</p>
                </div>
                <div class="action-modal-footer">
                    <button class="action-btn" id="modal-add-to-cart">Adicionar no Carrinho</button>
                    <button class="action-btn-secondary" id="modal-compare-prices">Comparar Preços</button>
                </div>
            </div>
        `;
        
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        document.getElementById('modal-add-to-cart').addEventListener('click', () => {
            addToCart(product, store);
            modal.classList.add('hidden');
        });

        document.getElementById('modal-compare-prices').addEventListener('click', () => {
            window.location.href = `comparar.html?category=${categoryKey}&productId=${product.id}`;
        });
    }
});