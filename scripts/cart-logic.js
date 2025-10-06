let cart = JSON.parse(localStorage.getItem('shoppingCart') || '[]') || [];

function canAddToCart(product, supermarket) {
    const supermarketsInCart = [...new Set(cart.map(item => item.supermarket?.id).filter(Boolean))];
    const isNewSupermarket = !supermarketsInCart.includes(supermarket.id);

    if (supermarketsInCart.length >= 2 && isNewSupermarket) {
        for (const storeId of supermarketsInCart) {
            const itemCount = cart
                .filter(item => item.supermarket.id === storeId)
                .reduce((sum, item) => sum + item.quantity, 0);

            if (itemCount < 5) {
                const storeName = cart.find(i => i.supermarket.id === storeId).supermarket.nome;
                alert(`Você precisa ter pelo menos 5 itens do supermercado "${storeName}" para adicionar produtos de uma nova loja.`);
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
        const productWithFullSupermarket = { ...product, supermarket: { id: supermarket.id, nome: supermarket.nome, endereco: supermarket.endereco } };
        cart.push({ ...productWithFullSupermarket, quantity: 1 });
    }
    saveCart();
    updateCartCount();
    showFeedback(`${product.nome} adicionado ao carrinho!`);
}

function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        if (totalItems > 0) {
            cartCountElement.style.display = 'flex';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}

async function calculateShipping() {
    const supermarketsInCart = [...new Set(cart.map(item => item.supermarket.id))];
    if (supermarketsInCart.length === 0) {
        return 0;
    }
    const baseFeePerStore = 5.00;
    const feeBetweenStores = 2.00;

    let totalShipping = supermarketsInCart.length * baseFeePerStore;
    if (supermarketsInCart.length > 1) {
        totalShipping += (supermarketsInCart.length - 1) * feeBetweenStores;
    }

    return totalShipping;
}


function showFeedback(message) {
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.innerHTML = `
        .feedback-popup {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #2c2c2c;
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 5000;
            font-size: 14px;
            animation: fadeInOut 2.5s forwards;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; bottom: 0px; }
            20% { opacity: 1; bottom: 20px; }
            80% { opacity: 1; bottom: 20px; }
            100% { opacity: 0; bottom: 0px; }
        }`;
        document.head.appendChild(style);
    }

    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'feedback-popup';
    feedbackDiv.textContent = message;
    document.body.appendChild(feedbackDiv);
    setTimeout(() => {
        feedbackDiv.remove();
    }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    try { updateCartCount(); } catch (e) { /* safe */ }
});