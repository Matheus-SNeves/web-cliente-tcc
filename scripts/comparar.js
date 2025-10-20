document.addEventListener('DOMContentLoaded', async () => {
    // API_URL e getFullImage são esperados de utils.js, que deve ser carregado antes.
    // Se precisar da API_URL, ela deve estar definida globalmente em utils.js.
    // Ex: if (typeof API_URL === 'undefined') { ... }

    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get('category');
    const productIdRaw = urlParams.get('productId');
    const productId = productIdRaw ? parseInt(productIdRaw, 10) : NaN;

    const productContainer = document.querySelector('.product-details-container');
    const pricesContainer = document.querySelector('.prices-list-container');
    const actionModal = document.getElementById('action-modal');

    if (!productContainer || !pricesContainer || !actionModal) {
        console.error('Elementos da página de comparar não encontrados.');
        return;
    }

    // Autenticação: inclui token se existir (igual aos outros scripts)
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    let allProducts = [];
    let allSupermarkets = [];
    let currentProduct = null;
    let selectedSupermarket = null;

    const renderProductDetails = (product) => {
        // USO DE getFullImage para a imagem do produto.
        productContainer.innerHTML = `
            <div class="product-header">
                <a href="produtos.html?category=${categoryName}" class="back-link">&#8592; ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</a>
                <h2 class="product-name">${product.nome}</h2>
            </div>
            <div class="product-image">
                <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
            </div>
            <p class="product-brand">Marca: ${product.marca || 'N/A'}</p>
            <p class="product-description">${product.descricao || 'Sem descrição.'}</p>
        `;
    };

    const renderPriceList = (product, allSupermarkets) => {
        pricesContainer.innerHTML = '<h2>Preços Disponíveis</h2>';

        // FIX PRINCIPAL para o TypeError: Garante que product.precos seja um array válido.
        const productPrices = product.precos;

        if (!productPrices || !Array.isArray(productPrices) || productPrices.length === 0) { 
            pricesContainer.innerHTML += '<p class="no-prices">Este produto não tem preços registrados ou está indisponível no momento.</p>';
            return;
        }

        const prices = productPrices
            .map(priceEntry => {
                const supermarket = allSupermarkets.find(s => s.id === priceEntry.supermercado_id);
                return { ...priceEntry, supermarket };
            })
            .filter(item => item.supermarket)
            .sort((a, b) => a.preco - b.preco);

        pricesContainer.innerHTML += prices.map(item => `
            <div class="price-item" data-supermarket-id="${item.supermarket.id}" data-supermarket-name="${item.supermarket.nome}">
                <div class="store-info">
                    <img src="${getFullImage(item.supermarket.img || item.supermarket.imagem)}" alt="${item.supermarket.nome}" class="store-logo">
                    <span class="store-name">${item.supermarket.nome}</span>
                </div>
                <div class="price-details">
                    <span class="price">R$ ${item.preco.toFixed(2).replace('.', ',')}</span>
                    <button class="add-to-cart-btn" 
                            data-product-id="${product.id}" 
                            data-supermarket-id="${item.supermarket.id}">
                        Adicionar
                    </button>
                </div>
            </div>
        `).join('');

        pricesContainer.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const storeId = parseInt(e.currentTarget.dataset.supermarketId, 10);
                selectedSupermarket = allSupermarkets.find(s => s.id === storeId);
                if (currentProduct && selectedSupermarket) {
                    showAddToCartModal(currentProduct, selectedSupermarket);
                }
            });
        });
    };

    const fetchProductData = async () => {
        if (isNaN(productId)) {
            productContainer.innerHTML = '<h1>ID do produto inválido.</h1>';
            return;
        }

        try {
            // Assume que API_URL está disponível de utils.js
            const [productRes, allSupermarketsRes] = await Promise.all([
                fetch(`${API_URL}/produtos/${productId}`, { headers }),
                fetch(`${API_URL}/empresas`, { headers })
            ]);

            if (!productRes.ok) {
                 if (productRes.status === 404) {
                    productContainer.innerHTML = '<h1>Produto não encontrado.</h1>';
                    return;
                }
                throw new Error('Falha ao buscar produto.');
            }
            if (!allSupermarketsRes.ok) {
                throw new Error('Falha ao buscar supermercados.');
            }

            currentProduct = await productRes.json();
            allSupermarkets = await allSupermarketsRes.json();

            if (currentProduct) {
                renderProductDetails(currentProduct);
                renderPriceList(currentProduct, allSupermarkets);
            } else {
                productContainer.innerHTML = '<h1>Produto não encontrado.</h1>';
            }
        } catch (error) {
            console.error("Erro ao buscar dados do produto:", error);
            productContainer.innerHTML = '<h1>Erro ao carregar dados do produto. Tente novamente.</h1>';
        }
    };

    // Lógica do Modal de Adicionar ao Carrinho

    const showAddToCartModal = (product, store) => {
        const actionModalTitle = document.getElementById('action-modal-title');
        const actionModalBody = document.querySelector('.action-modal-body');
        
        // Uso de checagem defensiva para precos
        const priceEntry = (product.precos || []).find(p => p.supermercado_id === store.id);
        const price = priceEntry ? priceEntry.preco : null;

        if (!price) {
            actionModalTitle.textContent = 'Indisponível';
            actionModalBody.innerHTML = '<p>Preço não encontrado para este supermercado.</p>';
        } else {
            actionModalTitle.textContent = 'Adicionar ao Carrinho';
            actionModalBody.innerHTML = `
                <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
                <div>
                    <p><strong>Produto:</strong> ${product.nome}</p>
                    <p><strong>Loja:</strong> ${store.nome}</p>
                    <p>Você confirma a adição de 1 item de <strong>R$ ${price.toFixed(2).replace('.', ',')}</strong>?</p>
                </div>
            `;
        }
        
        const confirmBtn = document.getElementById('action-modal-confirm');
        if (confirmBtn && confirmBtn.parentNode) {
            // Remove listener antigo para evitar múltiplos cliques
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            newConfirmBtn.addEventListener('click', () => {
                // A função addToCart está em cart-logic.js e deve ser globalmente acessível
                if (typeof addToCart === 'function') {
                     addToCart(product, store);
                } else {
                    console.error('Função addToCart não encontrada. Verifique se cart-logic.js foi carregado.');
                }
                actionModal.classList.add('hidden');
            });
        }
        
        actionModal.classList.remove('hidden');
    }

    const actionClose = document.getElementById('action-modal-close');
    if (actionClose) actionClose.addEventListener('click', () => {
        actionModal.classList.add('hidden');
    });

    // Fechar modal ao clicar fora
    actionModal.addEventListener('click', (e) => {
        if (e.target === actionModal) {
            actionModal.classList.add('hidden');
        }
    });

    fetchProductData();
    // A função updateCartUI deve ser globalmente acessível a partir de cart-logic.js
    if (typeof updateCartUI === 'function') {
        updateCartUI(); 
    }
});