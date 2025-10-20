// PADRONIZADO: Usando 'cart' como a chave principal do localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function canAddToCart(product, supermarket) {
    const supermarketsInCart = [...new Set(cart.map(item => item.supermarket?.id).filter(Boolean))];
    const isNewSupermarket = !supermarketsInCart.includes(supermarket.id);

    if (supermarketsInCart.length >= 1 && isNewSupermarket) {
        for (const existingStoreId of supermarketsInCart) {
            const itemCount = cart
                .filter(item => item.supermarket.id === existingStoreId)
                .reduce((sum, item) => sum + item.quantity, 0);

            if (itemCount < 5) {
                const storeName = cart.find(i => i.supermarket.id === existingStoreId).supermarket.nome;
                showFeedback(`Adição bloqueada. Você precisa ter pelo menos 5 itens do supermercado "${storeName}" antes de adicionar de uma nova loja.`, 'error');
                return false;
            }
        }
    }
    return true;
}

function addToCart(product, supermarket) {
    if (!canAddToCart(product, supermarket)) {
        return;
    }

    const existingItem = cart.find(item => item.id === product.id && item.supermarket?.id === supermarket.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        const productWithFullSupermarket = { 
            ...product, 
            supermarket: { 
                id: supermarket.id, 
                nome: supermarket.nome, 
            },
            quantity: 1 
        };
        cart.push(productWithFullSupermarket);
    }
    
    saveCart();
    // Funções 'showFeedback' e 'updateCartUI' são globais (de utils.js e deste arquivo)
    showFeedback(`"${product.nome}" adicionado ao carrinho!`, 'success');
    updateCartUI();
}

function removeCartItem(productId, storeId) {
    const initialLength = cart.length;
    cart = cart.filter(item => !(item.id === productId && item.supermarket.id === storeId));
    if (cart.length < initialLength) {
        saveCart();
        updateCartUI();
    }
}

function changeQuantity(productId, storeId, amount) {
    const itemIndex = cart.findIndex(item => item.id === productId && item.supermarket.id === storeId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += amount;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        saveCart();
        updateCartUI();
    }
}

function calculateCartTotal() {
    return cart.reduce((total, item) => {
        // Correção: Adicionado '|| []' para evitar erro se 'precos' não existir
        const priceEntry = (item.precos || []).find(p => p.supermercado_id === item.supermarket.id);
        const price = priceEntry ? priceEntry.preco : 0;
        return total + (price * item.quantity);
    }, 0);
}

function calculateShippingFee() {
    const baseFeePerStore = 5.00;
    const feeBetweenStores = 2.00;
    
    const supermarketsInCart = [...new Set(cart.map(item => item.supermarket?.id).filter(Boolean))];
    let totalShipping = supermarketsInCart.length * baseFeePerStore;

    if (supermarketsInCart.length > 1) {
        totalShipping += (supermarketsInCart.length - 1) * feeBetweenStores;
    }

    return totalShipping;
}

function updateCartUI() {
    // Recarrega o carrinho do localStorage para garantir sincronia
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) cartCount.textContent = totalItems;

    // Seletor do DOM para o modal do carrinho (pode estar em home.html, conta.html, etc.)
    const cartModal = document.querySelector('.cart-modal');
    
    if (cartItemsContainer) {
        const cartTotal = calculateCartTotal();
        const shippingFee = calculateShippingFee();
        const finalTotal = cartTotal + shippingFee;

        if (cartTotalPrice) cartTotalPrice.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Seu carrinho está vazio.</p>';
            if (checkoutBtn) checkoutBtn.classList.add('disabled');
        } else {
            cartItemsContainer.innerHTML = `
                ${cart.map(item => {
                    // Correção: Adicionado '|| []' para evitar erro
                    const priceEntry = (item.precos || []).find(p => p.supermercado_id === item.supermarket.id);
                    const price = priceEntry ? priceEntry.preco : 0;
                    
                    return `<div class="cart-item">
                        <img src="${getFullImage(item.imagem)}" alt="${item.nome}">
                        <div class="item-details">
                            <p class="item-name">${item.nome}</p>
                            <p class="item-store">${item.supermarket.nome}</p>
                            <p class="item-price">R$ ${price.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div class="item-controls">
                            <button class="quantity-btn remove-one" data-product-id="${item.id}" data-store-id="${item.supermarket.id}">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn add-one" data-product-id="${item.id}" data-store-id="${item.supermarket.id}">+</button>
                            <button class="remove-btn" data-product-id="${item.id}" data-store-id="${item.supermarket.id}">Remover</button>
                        </div>
                    </div>`;
                }).join('')}
                <div class="cart-summary-details">
                    <p>Subtotal: <span>R$ ${cartTotal.toFixed(2).replace('.', ',')}</span></p>
                    <p>Taxa de Entrega: <span>R$ ${shippingFee.toFixed(2).replace('.', ',')}</span></p>
                    <p class="final-total">Total: <span>R$ ${finalTotal.toFixed(2).replace('.', ',')}</span></p>
                </div>
            `;
            
            cartItemsContainer.querySelectorAll('.add-one').forEach(btn => btn.addEventListener('click', (e) => {
                changeQuantity(parseInt(e.target.dataset.productId), parseInt(e.target.dataset.storeId), 1);
            }));
            cartItemsContainer.querySelectorAll('.remove-one').forEach(btn => btn.addEventListener('click', (e) => {
                changeQuantity(parseInt(e.target.dataset.productId), parseInt(e.target.dataset.storeId), -1);
            }));
            cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', (e) => {
                removeCartItem(parseInt(e.target.dataset.productId), parseInt(e.target.dataset.storeId));
            }));
        }
    }
    
    // Esta lógica de endereço e checkout precisa estar em todas as páginas com carrinho
    if (cartModal) {
        const addresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
        const selectedAddressId = localStorage.getItem('selectedAddressId');
        let selectedAddress = addresses.find(addr => addr.id == selectedAddressId) || addresses[0];

        const currentAddressSpan = cartModal.querySelector('#current-address');
        if (currentAddressSpan) {
            currentAddressSpan.textContent = selectedAddress ? `${selectedAddress.street}, ${selectedAddress.number}` : 'Nenhum endereço selecionado';
        }
        
        const changeAddressBtn = cartModal.querySelector('#change-address-btn');
        if (changeAddressBtn) changeAddressBtn.onclick = () => window.location.href = 'conta.html';

        if (checkoutBtn) {
            if (cart.length > 0 && selectedAddress) {
                checkoutBtn.classList.remove('disabled');
                checkoutBtn.onclick = () => {
                    // Prepara os dados para a página de pagamento
                    localStorage.setItem('checkoutCart', JSON.stringify(cart));
                    localStorage.setItem('checkoutAddress', JSON.stringify(selectedAddress));
                    window.location.href = 'pagamento.html';
                };
            } else {
                checkoutBtn.classList.add('disabled');
                checkoutBtn.onclick = () => {
                    showFeedback(selectedAddress ? 'Seu carrinho está vazio.' : 'Selecione um endereço para continuar.', 'error');
                };
            }
        }
    }
}

// Função global para abrir/fechar o carrinho
function toggleCart() {
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.classList.toggle('hidden');
        if (!cartOverlay.classList.contains('hidden')) {
            updateCartUI(); // Atualiza o carrinho sempre que é aberto
        }
    }
}

// Configura os eventos globais do carrinho
function setupCartEvents() {
    const cartButton = document.getElementById('cart-button');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');

    if (cartButton) cartButton.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);

    if (cartOverlay) cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            toggleCart();
        }
    });

    // Atualização inicial (para contagem de itens)
    updateCartUI();
}

// Roda a configuração de eventos em todas as páginas que importam este script
document.addEventListener('DOMContentLoaded', setupCartEvents);