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
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const mainContent = document.getElementById('main-content');
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchInput = document.getElementById('search-input');
    const cartButton = document.getElementById('cart-button');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const genericModalOverlay = document.getElementById('generic-modal-overlay');
    const API_URL = "https://tcc-senai-tawny.vercel.app";

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

    const initializeApp = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = "login.html";
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        const [supermercadosRes, produtosRes] = await Promise.all([
            fetch(`${API_URL}/empresas`, { headers }),
            fetch(`${API_URL}/produtos`, { headers })
        ]);

        if (!supermercadosRes.ok || !produtosRes.ok) {
            throw new Error('Erro de autenticação ou permissão.');
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
        updateCartUI();

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

        if (cartButton) cartButton.addEventListener('click', toggleCart);
        if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
        if (cartOverlay) cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) toggleCart();
        });
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
                grid.innerHTML = results.map(product => `
                    <div class="product-item" onclick="window.location.href='comparar.html?category=${product.categoria}&productId=${product.id}'">
                        <img src="${product.imagem}" alt="${product.nome}">
                        <h4>${product.nome}</h4>
                        <p>A partir de R$ ${product.precos && product.precos[0] ? product.precos[0].preco.toFixed(2).replace('.', ',') : '--'}</p>
                    </div>
                `).join('');
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
                    <img src="${category.icon}" alt="${category.name}" class="modal-logo">
                    <h2 class="modal-title">${category.name}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-products">
                        ${itemsToDisplay.map(p => {
            const productUrl = `comparar.html?category=${categoryKey}&productId=${p.id}`;
            return `
                                <div class="product-item" onclick="window.location.href='${productUrl}'">
                                    <img src="${p.imagem}" alt="${p.nome}">
                                    <h4>${p.nome}</h4>
                                    <p>A partir de R$ ${p.precos && p.precos[0] ? p.precos[0].preco.toFixed(2).replace('.', ',') : '--'}</p>
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
        genericModalOverlay.classList.remove('hidden');
        genericModalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${store.img}" alt="${store.nome}" class="modal-logo">
                    <h2 class="modal-title">${store.nome}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-categories">
                        ${allData.categorias.map(cat => `
                            <div class="card-item" onclick="window.location.href='produtos.html?category=${cat.chave}&storeId=${store.id}'">
                                <img src="${cat.imagem}" alt="${cat.nome}">
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

    const toggleCart = () => {
        cartOverlay.classList.toggle('hidden');
        if (!cartOverlay.classList.contains('hidden')) {
            updateCartUI();
        }
    };

    const updateCartCount = () => {
        const cartCount = document.getElementById('cart-count');
        cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    };

    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    const updateCartUI = () => {
        updateCartCount();
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalPrice = document.getElementById('cart-total-price');
        const checkoutBtn = document.getElementById('checkout-btn');
        const cartModal = document.querySelector('.cart-modal');

        if (!cartItemsContainer || !cartTotalPrice || !checkoutBtn || !cartModal) {
            return;
        }

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Seu carrinho está vazio.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => {
                const priceEntry = item.precos.find(p => p.supermercado_id === item.supermarket.id);
                const price = priceEntry ? priceEntry.preco : 0;
                return `
                <div class="cart-item">
                    <img src="${item.imagem}" alt="${item.nome}">
                    <div class="cart-item-details">
                        <h4>${item.nome}</h4>
                        <p class="store-name">${item.supermarket.nome}</p>
                        <div class="quantity-controls">
                            <button data-cart-index="${index}" class="decrease-qty">-</button>
                            <span>${item.quantity}</span>
                            <button data-cart-index="${index}" class="increase-qty">+</button>
                        </div>
                    </div>
                    <p class="cart-item-price">R$ ${(price * item.quantity).toFixed(2).replace('.', ',')}</p>
                </div>`;
            }).join('');
        }

        cartItemsContainer.querySelectorAll('.increase-qty').forEach(btn => btn.addEventListener('click', () => changeQuantity(btn.dataset.cartIndex, 1)));
        cartItemsContainer.querySelectorAll('.decrease-qty').forEach(btn => btn.addEventListener('click', () => changeQuantity(btn.dataset.cartIndex, -1)));

        const totalPrice = cart.reduce((total, item) => {
            const priceEntry = item.precos.find(p => p.supermercado_id === item.supermarket.id);
            const price = priceEntry ? priceEntry.preco : 0;
            return total + (price * item.quantity);
        }, 0);
        cartTotalPrice.textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

        const addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
        const selectedAddressId = localStorage.getItem('selectedAddressId');
        const currentAddressSpan = document.getElementById('current-address');
        let selectedAddress = null;

        if (selectedAddressId) {
            selectedAddress = addresses.find(addr => addr.id == selectedAddressId);
        }
        if (!selectedAddress && addresses.length > 0) {
            selectedAddress = addresses[0];
        }

        if (selectedAddress) {
            currentAddressSpan.textContent = `${selectedAddress.street}, ${selectedAddress.number}`;
        } else {
            currentAddressSpan.textContent = 'Nenhum endereço cadastrado';
        }

        document.getElementById('change-address-btn').onclick = () => window.location.href = 'conta.html';

        if (cart.length > 0 && selectedAddress) {
            checkoutBtn.classList.remove('disabled');
            checkoutBtn.onclick = () => {
                localStorage.setItem('checkoutCart', JSON.stringify(cart));
                localStorage.setItem('checkoutAddress', JSON.stringify(selectedAddress));
                window.location.href = 'pagamento.html';
            };
        } else {
            checkoutBtn.classList.add('disabled');
            checkoutBtn.onclick = null;
        }
    };

    const changeQuantity = (index, amount) => {
        cart[index].quantity += amount;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartUI();
    };

    initializeApp();
});