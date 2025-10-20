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
    // REMOVIDO: Conflito de carrinho. O carrinho agora é gerenciado por cart-logic.js
    
    const mainContent = document.getElementById('main-content');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchInput = document.getElementById('search-input');
    
    // REMOVIDO: Eventos do carrinho. Agora são gerenciados globalmente por cart-logic.js
    
    const genericModalOverlay = document.getElementById('generic-modal-overlay');
    
    // REMOVIDO: API_URL e getFullImage. Agora são globais de utils.js

    const initializeApp = async () => {
        try {
            // 'authFetch' agora é global de utils.js
            const [supermercadosRes, produtosRes] = await Promise.all([
                authFetch('empresas'),
                authFetch('produtos')
            ]);

            if (!supermercadosRes.ok || !produtosRes.ok) {
                // authFetch já cuida de redirecionar em caso de 401/403
                throw new Error('Erro ao carregar dados da aplicação.');
            }

            const [supermercados, produtos] = await Promise.all([
                supermercadosRes.json(),
                produtosRes.json()
            ]);

            // Categorias a partir dos produtos, usando imagem do objeto icons
            const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];
            const categorias = categoriasUnicas.map(cat => ({
                chave: cat,
                nome: cat.charAt(0).toUpperCase() + cat.slice(1),
                imagem: icons[cat] || 'https://via.placeholder.com/100?text=Sem+Imagem'
            }));

            allData.categorias = categorias;
            allData.supermercados = supermercados;
            allData.allProducts = produtos;

            allData.categoryMap = {};
            categorias.forEach(cat => {
                allData.categoryMap[cat.chave] = {
                    data: produtos.filter(p => p.categoria === cat.chave),
                    icon: cat.imagem,
                    name: cat.nome
                };
            });

            setupHomePage();
            setupEventListeners();
            
            // ATUALIZADO: Chama a função global de updateCartUI de cart-logic.js
            // para garantir que o contador de ícones seja exibido corretamente.
            if (typeof updateCartUI === 'function') {
                updateCartUI();
            }

        } catch (error) {
            console.error("Erro ao inicializar a aplicação:", error);
            if (mainContent) mainContent.innerHTML = "<h1>Erro ao carregar os dados. Faça login novamente.</h1>";
        }
    };

    const setupHomePage = () => {
        const selecoesDiv = document.querySelector('.selecoes');
        if (selecoesDiv) {
            selecoesDiv.innerHTML = allData.categorias.map(cat => `
                <div class="card-item" data-category-key="${cat.chave}">
                    <img src="${getFullImage(cat.imagem)}" alt="${cat.nome}">
                    <h3>${cat.nome}</h3>
                </div>
            `).join('');
        }

        const ultLojasDiv = document.querySelector('.ultLojas');
        if (ultLojasDiv) {
            ultLojasDiv.innerHTML = allData.supermercados.slice(0, 8).map(store => `
                <div class="store-item" data-store-id="${store.id}">
                    <img src="${getFullImage(store.img || store.imagem || null)}" alt="${store.nome}">
                    <div class="store-info">
                        <h3>${store.nome}</h3>
                        <p>${store.endereco || ''}</p>
                    </div>
                </div>
            `).join('');
        }
    };

    const setupEventListeners = () => {
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        const clearBtn = document.getElementById('clear-search-btn');
        if (clearBtn) clearBtn.addEventListener('click', clearSearch);

        document.body.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.card-item');
            const storeCard = e.target.closest('.store-item');

            if (categoryCard && categoryCard.dataset.categoryKey) {
                const categoryKey = categoryCard.dataset.categoryKey;
                showProductsModal(categoryKey);
            }
            if (storeCard && storeCard.dataset.storeId) {
                showStoreCategoriesModal(parseInt(storeCard.dataset.storeId));
            }
        });

        // REMOVIDO: Eventos de clique do carrinho (cartButton, closeCartBtn, cartOverlay)
        // Eles agora são gerenciados por setupCartEvents() em cart-logic.js
    };

    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm.length > 1) {
            const results = allData.allProducts.filter(p => p.nome.toLowerCase().includes(searchTerm));
            mainContent.classList.add('hidden');
            searchResultsContainer.classList.remove('hidden');
            document.getElementById('search-results-title').textContent = `Resultados para "${searchTerm}"`;

            const grid = document.getElementById('search-results-grid');
            if (results.length > 0) {
                grid.innerHTML = results.map(product => {
                    // Correção: Garantir que 'precos' existe e tem itens
                    const bestPrice = (product.precos && product.precos.length > 0) ? product.precos[0].preco.toFixed(2).replace('.', ',') : '--';
                    return `
                        <div class="product-item" onclick="window.location.href='comparar.html?category=${product.categoria}&productId=${product.id}'">
                            <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
                            <h4>${product.nome}</h4>
                            <p>A partir de R$ ${bestPrice}</p>
                        </div>
                    `;
                }).join('');
            } else {
                grid.innerHTML = '<p>Nenhum produto encontrado.</p>';
            }
        } else {
            clearSearch();
        }
    };

    const clearSearch = () => {
        searchInput.value = '';
        mainContent.classList.remove('hidden');
        searchResultsContainer.classList.add('hidden');
    };

    const showProductsModal = (categoryKey) => {
        const category = allData.categoryMap[categoryKey];
        if (!category) return;

        const maxItems = 5;
        const itemsToDisplay = category.data.slice(0, maxItems);

        let modalContentHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${getFullImage(category.icon)}" alt="${category.name}" class="modal-logo">
                    <h2 class="modal-title">${category.name}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-products">
                        ${itemsToDisplay.map(p => {
                            const productUrl = `comparar.html?category=${categoryKey}&productId=${p.id}`;
                            // Correção: Garantir que 'precos' existe e tem itens
                            const bestPrice = (p.precos && p.precos.length > 0) ? p.precos[0].preco.toFixed(2).replace('.', ',') : '--';
                            return `
                                <div class="product-item" onclick="window.location.href='${productUrl}'">
                                    <img src="${getFullImage(p.imagem)}" alt="${p.nome}">
                                    <h4>${p.nome}</h4>
                                    <p>A partir de R$ ${bestPrice}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
        `;

        if (category.data.length > maxItems) {
            modalContentHTML += `<button class="ver-mais-btn" onclick="window.location.href='produtos.html?category=${categoryKey}'">Ver Todos os Produtos</button>`;
        }

        modalContentHTML += `</div></div>`;

        genericModalOverlay.innerHTML = modalContentHTML;
        genericModalOverlay.classList.remove('hidden');
        genericModalOverlay.querySelector('.close-btn').addEventListener('click', () => genericModalOverlay.classList.add('hidden'));
    };

    const showStoreCategoriesModal = (storeId) => {
        const store = allData.supermercados.find(s => s.id === storeId);
        if (!store) return; // Proteção caso a loja não seja encontrada
        
        genericModalOverlay.classList.remove('hidden');
        genericModalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${getFullImage(store.img)}" alt="${store.nome}" class="modal-logo">
                    <h2 class="modal-title">${store.nome}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-categories">
                        ${allData.categorias.map(cat => `
                            <div class="card-item" onclick="window.location.href='produtos.html?category=${cat.chave}&storeId=${store.id}'">
                                <img src="${getFullImage(cat.imagem)}" alt="${cat.nome}">
                                <h3>${cat.nome}</h3>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        genericModalOverlay.querySelector('.close-btn').addEventListener('click', () => {
            genericModalOverlay.classList.add('hidden');
        });
    };

    // REMOVIDO: Todas as funções de carrinho (toggleCart, updateCartCount, saveCart, changeQuantity, updateCartUI)
    // Elas agora são globais e vêm de cart-logic.js

    initializeApp();
});