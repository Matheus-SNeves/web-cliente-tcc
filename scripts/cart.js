// scripts/cart.js

// Variáveis Globais de Carrinho
window.cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartOverlay = document.getElementById('cart-overlay');
const cartCount = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items-container');
const checkoutBtn = document.getElementById('checkout-btn');


// --- Funções de Utilidade ---

function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}
// Torna a função global para uso em outros scripts (como profile_modal.js)
window.formatCurrency = formatCurrency;

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(window.cart));
    updateCartDisplay();
}

function calculateTotal() {
    return window.cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
}


// --- Funções de Exibição do Carrinho ---

function updateCartCount() {
    const totalCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalCount;
}

function updateCartDisplay() {
    if (!cartItemsContainer || !cartTotalElement) return;

    updateCartCount();
    
    cartItemsContainer.innerHTML = '';
    const total = calculateTotal();
    cartTotalElement.textContent = formatCurrency(total);

    if (window.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-gray-500 p-4">O carrinho está vazio.</p>';
        if(checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    if(checkoutBtn) checkoutBtn.disabled = false;

    window.cart.forEach(item => {
        const itemTotal = item.preco * item.quantity;
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between border-b py-3';
        
        itemElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${item.img}" alt="${item.nome}" class="w-12 h-12 object-contain rounded">
                <div>
                    <h4 class="text-sm font-semibold text-gray-800">${item.nome}</h4>
                    <p class="text-xs text-gray-500">${formatCurrency(item.preco)} cada</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="flex items-center border rounded-lg">
                    <button data-id="${item.id}" class="decrease-btn p-2 text-primary hover:bg-gray-100 rounded-l-lg">-</button>
                    <span class="px-3 text-sm font-medium">${item.quantity}</span>
                    <button data-id="${item.id}" class="increase-btn p-2 text-primary hover:bg-gray-100 rounded-r-lg">+</button>
                </div>
                <p class="text-sm font-bold">${formatCurrency(itemTotal)}</p>
                <button data-id="${item.id}" class="remove-btn text-red-500 hover:text-red-700 p-1 rounded-full">&times;</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    // Adiciona Listeners aos botões de +/- e remover
    cartItemsContainer.querySelectorAll('.increase-btn').forEach(btn => btn.addEventListener('click', handleQuantityChange));
    cartItemsContainer.querySelectorAll('.decrease-btn').forEach(btn => btn.addEventListener('click', handleQuantityChange));
    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', removeItem));
}


// --- Funções de Manipulação do Carrinho ---

window.addToCart = function(product) {
    const existingItem = window.cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        window.cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    // Feedback visual (pode ser substituído por um toast)
    console.log(`${product.nome} adicionado ao carrinho!`);
    if(cartOverlay && cartOverlay.classList.contains('hidden')) {
        // Opcional: abre o carrinho ou notifica
    }
};

function handleQuantityChange(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const item = window.cart.find(item => item.id === id);
    if (!item) return;

    if (e.currentTarget.classList.contains('increase-btn')) {
        item.quantity += 1;
    } else if (e.currentTarget.classList.contains('decrease-btn')) {
        item.quantity -= 1;
        if (item.quantity < 1) {
            // Remove o item se a quantidade chegar a zero
            window.cart = window.cart.filter(i => i.id !== id);
        }
    }
    saveCart();
}

function removeItem(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    window.cart = window.cart.filter(item => item.id !== id);
    saveCart();
}


// --- Funções de Checkout (Integração com a API) ---

async function handleCheckout() {
    if (window.cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert('Você precisa estar logado para finalizar o pedido.');
        // Redireciona para login (opcional)
        // window.location.href = 'login.html'; 
        return;
    }

    // DESABILITA o botão para prevenir cliques múltiplos
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processando...';

    // 1. Constrói o Payload do Pedido (conforme o schema Prisma)
    const payload = {
        // NOTA: O id_usuario é obtido pelo BACKEND a partir do authToken
        valor: calculateTotal(),
        
        // Simula a seleção de pagamento. No front real, você teria um formulário.
        pagamento: {
            tipo: "PIX" // Use um dos valores do ENUM TipoPagamento: PIX, DINHEIRO, DEBITO, CREDITO
        },

        // Mapeia os itens do carrinho para o formato ItensPedido
        itens: window.cart.map(item => ({
            id_produto: item.id,
            quantidade: item.quantity,
            // Preço individual para histórico pode ser adicionado aqui
        }))
    };
    
    console.log('Payload de Pedido a ser enviado:', payload);


    try {
        // Assume API_URL está globalmente disponível (config.js)
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro ao criar pedido' }));
            throw new Error(errorData.message || 'Falha ao finalizar pedido: Erro no servidor.');
        }

        const data = await response.json();
        
        // 2. Sucesso: Limpar o Carrinho
        window.cart = [];
        saveCart(); // Salva o carrinho vazio no localStorage
        
        // 3. Feedback e Fechar
        alert(`Pedido #${data.id || data.pedido.id} criado com sucesso! Total: ${formatCurrency(payload.valor)}.`);
        closeCart();

    } catch (error) {
        console.error('Erro no Checkout:', error);
        alert(`Erro ao finalizar pedido: ${error.message}`);
    } finally {
        // REABILITA o botão
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Finalizar Pedido';
    }
}


// --- Funções de Modal ---

function openCart() {
    if (cartOverlay) cartOverlay.classList.remove('hidden');
    updateCartDisplay();
}

function closeCart() {
    if (cartOverlay) cartOverlay.classList.add('hidden');
}


// --- Inicialização e Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Listener para abrir o carrinho
    const cartButton = document.getElementById('cart-button');
    if (cartButton) cartButton.addEventListener('click', openCart);

    // Listener para fechar o carrinho
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    
    // Listener para o botão de Checkout
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

    // Fecha o carrinho clicando no overlay
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                closeCart();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !cartOverlay.classList.contains('hidden')) {
                closeCart();
            }
        });
    }

    // Inicializa a exibição do carrinho
    updateCartDisplay();
});