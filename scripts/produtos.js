// scripts/produtos.js

document.addEventListener('DOMContentLoaded', () => {
    // Garante que o usuário está logado antes de continuar (Proteção)
    if (!localStorage.getItem('authToken')) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get('category');
    // Usando 'storeId' para consistência (recebido de home.js)
    const storeId = urlParams.get('storeId'); 
    const pageTitle = document.getElementById('page-title');
    const productsContainer = document.getElementById('products-container');
    // Elemento do modal (presente no produtos.html)
    const productActionModal = document.getElementById('product-action-modal'); 

    let allProducts = [];
    let allSupermarkets = [];

    // --- FUNÇÕES DE LÓGICA E RENDERIZAÇÃO ---

    const updateTitle = () => {
        if (categoryName) {
            pageTitle.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        } else if (storeId) {
            // Se tiver storeId, busca o nome na lista de supermercados
            const store = allSupermarkets.find(s => s.id === parseInt(storeId));
            pageTitle.textContent = store ? `Produtos de ${store.nome}` : 'Produtos por Loja';
        } else {
            pageTitle.textContent = 'Todos os Produtos';
        }
    };
    
    // RENDERIZAÇÃO 1: Lista Simples (usada quando o usuário busca por UMA LOJA específica)
    const renderProductsNormal = (products) => {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Nenhum produto encontrado nesta loja/seção.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Garante que o nome da loja seja exibido (se a junção funcionou)
            const storeName = product.supermercado ? product.supermercado.nome : 'Loja Desconhecida';
            
            productCard.innerHTML = `
                <img src="${getFullImage(product.img)}" alt="${product.nome}">
                <div class="product-info">
                    <h3>${product.nome}</h3>
                    <p class="price">R$ ${product.preco.toFixed(2).replace('.', ',')}</p> 
                    <p class="store">Loja: ${storeName}</p>
                </div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Adicionar</button>
            `;

            const addButton = productCard.querySelector('.add-to-cart-btn');
            addButton.addEventListener('click', () => {
                const supermarket = product.supermercado;
                if (supermarket) {
                     // addToCart é global (de cart-logic.js)
                     addToCart(product, supermarket); 
                } else {
                    showFeedback('Não foi possível adicionar ao carrinho. Loja desconhecida.', 'error');
                }
            });

            productsContainer.appendChild(productCard);
        });
    };
    
    // FUNÇÃO DO MODAL: Abre e renderiza a comparação de preços
    const openComparisonModal = (productGroup) => {
        if (!productActionModal) return;

        const mainProduct = productGroup[0];
        
        // Ordena as ofertas do mais barato para o mais caro
        const sortedOffers = productGroup.sort((a, b) => a.preco - b.preco);

        // Filtra ofertas sem supermercado (onde a junção falhou)
        const validOffers = sortedOffers.filter(offer => offer.supermercado); 

        // Se não houver ofertas válidas, não abre o modal
        if (validOffers.length === 0) {
            showFeedback('Nenhuma loja encontrada para este produto.', 'error');
            return;
        }

        productActionModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${getFullImage(mainProduct.img)}" alt="${mainProduct.nome}" class="modal-logo" style="width: 60px;">
                    <h2 class="modal-title">${mainProduct.nome}</h2>
                    <button class="close-btn modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <h3>Comparação de Preços em ${validOffers.length} Loja(s)</h3>
                    <div class="comparison-list">
                        ${validOffers.map(offer => `
                            <div class="comparison-item">
                                <div class="store-info">
                                    <img src="${getFullImage(offer.supermercado.img)}" alt="${offer.supermercado.nome}" class="store-logo">
                                    <p>${offer.supermercado.nome}</p>
                                </div>
                                <div class="price-info">
                                    <p class="price">R$ ${offer.preco.toFixed(2).replace('.', ',')}</p>
                                    <button class="add-to-cart-btn-modal" data-product-id="${offer.id}">Adicionar</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Evento para fechar o modal
        productActionModal.querySelector('.modal-close-btn').addEventListener('click', () => {
            productActionModal.classList.add('hidden');
        });

        // Evento para adicionar ao carrinho a partir do modal
        productActionModal.querySelectorAll('.add-to-cart-btn-modal').forEach(button => {
            button.addEventListener('click', () => {
                const offerId = parseInt(button.getAttribute('data-product-id'));
                const offer = allProducts.find(p => p.id === offerId);
                
                if (offer && offer.supermercado) {
                    addToCart(offer, offer.supermercado);
                } else {
                    showFeedback('Erro ao adicionar produto ao carrinho. Loja não encontrada.', 'error');
                }
            });
        });

        productActionModal.classList.remove('hidden');
    };

    // RENDERIZAÇÃO 2: Lista Agrupada com Comparador (usada quando busca por categoria ou todos)
    const renderGroupedProducts = (products) => {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';
        
        // 1. Agrupa as ofertas pelo nome do produto
        const groupedProducts = products.reduce((acc, product) => {
            // Filtra produtos que não têm nome ou supermercado associado
            if (!product.nome || !product.supermercado) return acc;
            
            const key = product.nome.toLowerCase().trim();
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(product);
            return acc;
        }, {});
        
        const uniqueProductGroups = Object.values(groupedProducts);

        if (uniqueProductGroups.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Nenhum produto encontrado nesta seção.</p>';
            return;
        }
        
        // 2. Renderiza um card para cada grupo (produto único)
        uniqueProductGroups.forEach(productGroup => {
            const mainProduct = productGroup[0];
            const cheapestOffer = productGroup.reduce((min, p) => p.preco < min.preco ? p : min, productGroup[0]);

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            productCard.innerHTML = `
                <img src="${getFullImage(mainProduct.img)}" alt="${mainProduct.nome}">
                <div class="product-info">
                    <h3>${mainProduct.nome}</h3>
                    <p class="price">A partir de R$ ${cheapestOffer.preco.toFixed(2).replace('.', ',')}</p>
                    <p class="stores-count">Disponível em ${productGroup.length} loja(s)</p>
                </div>
                <button class="compare-btn">Ver Preços</button>
            `;

            // Adiciona o evento de clique para abrir o modal
            productCard.querySelector('.compare-btn').addEventListener('click', () => {
                openComparisonModal(productGroup);
            });

            productsContainer.appendChild(productCard);
        });
    };


    // Função para buscar os dados dos produtos e supermercados (Com Robustez)
    const fetchData = async () => {
        productsContainer.innerHTML = '<p class="loading-message">Carregando produtos...</p>';
        pageTitle.textContent = 'Carregando...';

        try {
            const [produtosRes, supermercadosRes] = await Promise.all([
                authFetch('produtos'), 
                authFetch('empresas')  
            ]);

            if (!produtosRes.ok || !supermercadosRes.ok) {
                // authFetch já trata 401/403, então só precisamos de um erro genérico
                throw new Error('Falha na comunicação com o servidor.');
            }

            allProducts = await produtosRes.json();
            allSupermarkets = await supermercadosRes.json();

            // =======================================================
            // ASSOCIAÇÃO CRÍTICA (Ajustada para robustez)
            // =======================================================
            allProducts = allProducts.map(p => {
                // 1. Garante que id_supermercado é um número (CORREÇÃO DE TIPO CRÍTICA)
                const supermarketId = Number(p.id_supermercado); 

                // 2. Encontra o supermercado pelo ID (comparando número com número)
                const supermercadoEncontrado = allSupermarkets.find(s => s.id === supermarketId);
                
                return {
                    ...p,
                    supermercado: supermercadoEncontrado || null // Anexa o objeto ou null
                };
            });
            // =======================================================


            // Aplica os filtros
            let filteredProducts = allProducts;
            
            if (categoryName) {
                filteredProducts = filteredProducts.filter(p => p.categoria && p.categoria.toLowerCase() === categoryName.toLowerCase());
            } 
            
            // Lógica principal de exibição
            if (storeId) {
                const id = parseInt(storeId);
                filteredProducts = filteredProducts.filter(p => p.id_supermercado === id);
                renderProductsNormal(filteredProducts); // Lista simples por loja
            } else {
                 renderGroupedProducts(filteredProducts); // Lista agrupada com comparador
            }

            // Atualiza Título
            updateTitle();

        } catch (error) {
            console.error('Erro ao buscar produtos:', error); 
            if (error.message !== 'Unauthorized') {
                productsContainer.innerHTML = `<p class="error-message">Erro ao carregar produtos: ${error.message}. Verifique sua conexão e os dados do backend.</p>`;
                pageTitle.textContent = 'Erro';
            }
        }
    };

    // --- SETUP INICIAL ---
    
    // Assumindo que setupCartEvents() é global (de cart-logic.js)
    if (typeof setupCartEvents === 'function') {
        setupCartEvents(); 
    }
    
    fetchData();
});