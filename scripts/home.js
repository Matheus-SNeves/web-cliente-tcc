// scripts/home.js

// Ícones permanecem
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


document.addEventListener('DOMContentLoaded', () => {
    let allData = {};
    const categoriesContainer = document.getElementById('categories-container');
    const supermarketsContainer = document.getElementById('stores-container');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const genericModalOverlay = document.getElementById('generic-modal-overlay');

    // Funções de Renderização 
    const renderCategories = (categories) => {
        if (!categoriesContainer) return;
        categoriesContainer.innerHTML = categories.map(cat => {
            const iconUrl = icons[cat.chave] || icons['default']; 
            return `
                <div class="card-item category-card" data-category-chave="${cat.chave}" onclick="window.location.href='produtos.html?category=${cat.chave}'">
                    <img src="${iconUrl}" alt="${cat.nome}">
                    <h3>${cat.nome}</h3>
                </div>
            `;
        }).join('');
    };

    const renderSupermarkets = (supermarkets) => {
        if (!supermarketsContainer) {
             console.error('Elemento #supermarkets-container não encontrado.');
             return;
        }
        supermarketsContainer.innerHTML = '';

        if (supermarkets.length === 0) {
            supermarketsContainer.innerHTML = '<p class="no-supermarkets">Nenhum supermercado cadastrado ou carregado.</p>';
            return;
        }
        
        // Renderiza os 10 primeiros supermercados
        supermarkets.slice(0, 10).forEach(store => {
            const storeCard = document.createElement('div');
            storeCard.className = 'card-item supermarket-card';
            // Usamos template string para preencher o HTML interno
            storeCard.innerHTML = `
                <img src="${getFullImage(store.img)}" alt="${store.nome}">
                <h3>${store.nome}</h3>
                <button class="ver-produtos-btn" data-store-id="${store.id}">Ver Produtos</button>
            `;
            
            // Adiciona o evento de clique ao botão "Ver Produtos"
            const verProdutosBtn = storeCard.querySelector('.ver-produtos-btn');
            if(verProdutosBtn) {
                 verProdutosBtn.addEventListener('click', (e) => {
                    const storeId = parseInt(e.target.getAttribute('data-store-id'));
                    openSupermarketModal(storeId);
                });
            }

            // Anexa o cartão à seção principal
            supermarketsContainer.appendChild(storeCard);
        });
    };

    const renderSearchResults = (products) => {
        if (!searchResultsGrid) return;
        searchResultsGrid.innerHTML = '';

        if (products.length === 0) {
            searchResultsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
            return;
        }

        products.forEach(product => {
            const storeName = product.supermercado ? product.supermercado.nome : 'Loja Desconhecida';
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${getFullImage(product.img)}" alt="${product.nome}">
                <div class="product-info">
                    <h3>${product.nome}</h3>
                    <p class="price">R$ ${product.preco.toFixed(2).replace('.', ',')}</p>
                    <p class="store">Loja: ${storeName}</p>
                </div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Adicionar</button>
            `;
            
            productCard.querySelector('.add-to-cart-btn').addEventListener('click', () => {
                 const supermarket = product.supermercado;
                 if (supermarket) {
                    addToCart(product, supermarket); 
                 } else {
                     showFeedback('Não foi possível adicionar ao carrinho. Loja desconhecida.', 'error');
                 }
            });

            searchResultsGrid.appendChild(productCard);
        });
    };

    const openSupermarketModal = (storeId) => {
        const store = allData.supermarkets.find(s => s.id === storeId);
        if (!store) return;
        
        genericModalOverlay.classList.remove('hidden');
        genericModalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${getFullImage(store.img)}" alt="${store.nome}" class="modal-logo">
                    <h2 class="modal-title">${store.nome}</h2>
                    <button class="close-btn modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Ver por Categoria</h3>
                    <div class="modal-categories">
                        ${allData.categorias.map(cat => `
                            <div class="card-item" onclick="window.location.href='produtos.html?category=${cat.chave}&storeId=${store.id}'">
                                <img src="${icons[cat.chave] || getFullImage(cat.imagem)}" alt="${cat.nome}">
                                <h3>${cat.nome}</h3>
                            </div>
                        `).join('')}
                    </div>
                    <button class="ver-mais-btn" onclick="window.location.href='produtos.html?storeId=${store.id}'">Ver Todos os Produtos</button>
                </div>
            </div>`;
            
        // Correção de seletor: .modal-close-btn estava na tag button
        genericModalOverlay.querySelector('.modal-close-btn').addEventListener('click', () => { 
            genericModalOverlay.classList.add('hidden');
        });
    };
    
    // Lógica de Busca
    const searchProducts = async (query) => {
        if (query.length < 3) {
            searchResultsContainer.classList.add('hidden');
            return;
        }

        try {
            const response = await authFetch(`produtos?q=${query}`); 
            const products = await response.json();
            
            // Anexar a relação Supermercado a cada Produto buscado
            const productsWithStore = products.map(p => {
                 const supermarketId = Number(p.id_supermercado);
                 return {
                    ...p,
                    // Busca na lista de supermercados carregada na inicialização
                    supermercado: allData.supermarkets.find(s => s.id === supermarketId) || null 
                 };
            });
            
            document.getElementById('search-results-title').textContent = `Resultados da busca por "${query}"`;
            renderSearchResults(productsWithStore);
            searchResultsContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Erro na busca:', error);
            document.getElementById('search-results-title').textContent = `Erro na busca por "${query}"`;
            searchResultsGrid.innerHTML = '<p class="error-message">Não foi possível realizar a busca.</p>';
            searchResultsContainer.classList.remove('hidden');
        }
    };

    // Lógica de Inicialização
    const initializeApp = async () => {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Requisições
            const [empresasRes, produtosRes] = await Promise.all([
                authFetch('empresas'),
                authFetch('produtos'),
            ]);

            // Parsing do JSON
            const [supermarkets, allProducts] = await Promise.all([
                empresasRes.json(),
                produtosRes.json(),
            ]);

            const categories = Object.keys(icons).map(key => ({
                chave: key,
                nome: key.charAt(0).toUpperCase() + key.slice(1),
                imagem: icons[key]
            }));

            allData = { 
                supermarkets, 
                allProducts, 
                categorias: categories 
            };
            
            // =======================================================
            // DEBUG: VERIFICAÇÃO CRÍTICA DE DADOS
            // =======================================================
            console.log('DEBUG: Supermercados carregados:', allData.supermarkets.length);
            // =======================================================
            
            // Renderização
            renderCategories(categories);
            renderSupermarkets(supermarkets);
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            if (error.message !== 'Unauthorized') {
                 showFeedback('Erro ao carregar dados iniciais. Verifique o console.', 'error');
                 if (supermarketsContainer) {
                     supermarketsContainer.innerHTML = '<p class="error-message">Falha ao carregar supermercados. Verifique a conexão com a API.</p>';
                 }
            }
        }
    };
    
    // Event Listeners
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            searchTimeout = setTimeout(() => {
                searchProducts(query);
            }, 300); 
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchResultsContainer.classList.add('hidden');
        });
    }

    if (typeof setupCartEvents === 'function') {
        setupCartEvents(); 
    }

    initializeApp();
});