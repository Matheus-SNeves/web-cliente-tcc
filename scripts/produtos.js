document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get('category');
    const supermarketId = urlParams.get('supermarket');
    const supermarketName = urlParams.get('name');
    const pageTitle = document.getElementById('page-title');
    const productsContainer = document.getElementById('products-container');

    let allProducts = [];
    let allSupermarkets = [];

    // REMOVIDO: API_URL, token, headers, authFetch, getFullImage
    // Essas funções e variáveis agora são globais de utils.js

    const updateTitle = () => {
        if (categoryName) {
            pageTitle.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        } else if (supermarketName) {
            pageTitle.textContent = `Produtos de ${supermarketName}`;
        } else {
            pageTitle.textContent = 'Produtos';
        }
    };

    const renderProducts = (products) => {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">Nenhum produto encontrado nesta seção.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            let bestPriceEntry = { preco: Infinity, supermercado_id: null };
            
            // Garante que product.precos é um array antes de usar 'find' ou 'reduce'
            const productPrices = Array.isArray(product.precos) ? product.precos : [];

            if (supermarketId) {
                // Se um supermercado está selecionado, busca o preço dele.
                bestPriceEntry = productPrices.find(p => p.supermercado_id == supermarketId) || { preco: Infinity, supermercado_id: null };
            } else {
                // Busca o melhor preço entre todos os supermercados
                bestPriceEntry = productPrices.reduce((best, current) => {
                    if (current.preco < best.preco) {
                        return current;
                    }
                    return best;
                }, { preco: Infinity, supermercado_id: null });
            }

            const bestPriceStore = allSupermarkets.find(s => s.id === bestPriceEntry.supermercado_id) || {};
            const priceDisplay = bestPriceEntry.preco !== Infinity ? `R$ ${bestPriceEntry.preco.toFixed(2).replace('.', ',')}` : 'R$ --';
            const storeDisplay = bestPriceEntry.preco !== Infinity ? bestPriceStore.nome : 'N/A';
            const pricePerUnit = product.preco_por_unidade ? `R$ ${product.preco_por_unidade.toFixed(2).replace('.', ',')}/${product.unidade_medida}` : '';

            productCard.innerHTML = `
                <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
                <div class="product-info">
                    <h4>${product.nome}</h4>
                    ${pricePerUnit ? `<p class="unit-price">${pricePerUnit}</p>` : ''}
                    <p class="best-price"><strong>Melhor Preço:</strong> ${priceDisplay}</p>
                    <p class="best-store"><strong>Loja:</strong> ${storeDisplay}</p>
                    <button class="add-to-cart-btn" 
                        data-product-id="${product.id}" 
                        data-product-name="${product.nome}" 
                        data-store-id="${bestPriceStore.id}"
                        data-store-name="${bestPriceStore.nome}"
                        ${bestPriceEntry.preco === Infinity ? 'disabled' : ''}>
                        <i class="fa-solid fa-cart-shopping"></i> Adicionar
                    </button>
                    <a href="comparar.html?category=${categoryName || product.categoria}&productId=${product.id}" class="compare-btn">Comparar Preços</a>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });
        setupCartButtons(products);
    };

    const setupCartButtons = (products) => {
        const cartButtons = document.querySelectorAll('.add-to-cart-btn');
        cartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.productId);
                const storeId = parseInt(e.currentTarget.dataset.storeId);
                
                const product = products.find(p => p.id === productId);
                const supermarket = allSupermarkets.find(s => s.id === storeId);
                
                if (product && supermarket) {
                    // 'addToCart' é a função global de cart-logic.js
                    addToCart(product, supermarket);
                }
            });
        });
    };

    const fetchData = async () => {
        updateTitle();
        
        try {
            // 'authFetch' é a função global de utils.js
            const [produtosRes, supermercadosRes] = await Promise.all([
                authFetch('produtos'),
                authFetch('empresas')
            ]);

            if (!produtosRes.ok || !supermercadosRes.ok) {
                // authFetch já trata 401/403, então só precisamos de um erro genérico
                throw new Error('Erro ao carregar dados.');
            }

            allProducts = await produtosRes.json();
            allSupermarkets = await supermercadosRes.json();

            let filteredProducts = allProducts;

            if (categoryName) {
                filteredProducts = allProducts.filter(p => p.categoria && p.categoria.toLowerCase() === categoryName.toLowerCase());
            } 
            
            if (supermarketId) {
                const id = parseInt(supermarketId);
                // Correção: Adicionado (p.precos || []) para evitar TypeError
                filteredProducts = filteredProducts.filter(p => (p.precos || []).some(preco => preco.supermercado_id === id));
            }

            renderProducts(filteredProducts);

        } catch (error) {
            console.error('Erro ao buscar produtos:', error); 
            // Se o erro for 'Unauthorized', o authFetch já terá redirecionado
            if (error.message !== 'Unauthorized' && productsContainer) {
                productsContainer.innerHTML = '<p>Erro ao carregar produtos. Tente novamente.</p>';
            }
        }
    };

    fetchData();
});