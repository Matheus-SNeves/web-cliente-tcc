document.addEventListener('DOMContentLoaded', () => {
    // 'checkoutCart' é definido por 'cart-logic.js'
    const cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    const address = JSON.parse(localStorage.getItem('checkoutAddress')) || null;
    
    const summaryItemsDiv = document.getElementById('summary-items');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    const deliveryAddressP = document.getElementById('delivery-address');
    const creditCardForm = document.getElementById('credit-card-form');
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCVVInput = document.getElementById('card-cvv');

    if (!summaryItemsDiv || !summaryTotalPrice || !deliveryAddressP || !confirmOrderBtn) {
        return;
    }

    if (cart.length === 0 || !address) {
        document.querySelector('.checkout-container').innerHTML = '<h1>Erro: Carrinho ou endereço não encontrados. Volte para a página inicial.</h1>';
        return;
    }

    // Funções de máscara vêm de utils.js
    if (cardNumberInput) cardNumberInput.addEventListener('input', (e) => {
        e.target.value = maskCardNumber(e.target.value);
    });
    if (cardExpiryInput) cardExpiryInput.addEventListener('input', (e) => {
        e.target.value = maskCardExpiry(e.target.value);
    });
    if (cardCVVInput) cardCVVInput.addEventListener('input', (e) => {
        e.target.value = maskCVV(e.target.value);
    });

    // REMOVIDO: calculateCartTotal e calculateShippingFee
    // Elas agora vêm de cart-logic.js, que deve ser importado no HTML.

    const renderSummary = () => {
        summaryItemsDiv.innerHTML = cart.map(item => {
            const priceEntry = (item.precos || []).find(p => p.supermercado_id === item.supermarket.id);
            const price = priceEntry ? priceEntry.preco : 0;
            const itemTotalPrice = price * item.quantity;
            
            return `<div class="summary-item">
                <img src="${getFullImage(item.imagem)}" alt="${item.nome}">
                <div class="item-details">
                    <p class="item-name">${item.nome}</p>
                    <p class="item-quantity">Qtd: ${item.quantity}</p>
                    <p class="item-price">R$ ${itemTotalPrice.toFixed(2).replace('.', ',')}</p>
                    <p class="store-name">${item.supermarket.nome}</p>
                </div>
            </div>`;
        }).join('');

        // Usando as funções globais de cart-logic.js
        const cartTotal = calculateCartTotal();
        const shippingFee = calculateShippingFee();
        const finalTotal = cartTotal + shippingFee;

        summaryTotalPrice.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;

        deliveryAddressP.innerHTML = `
            ${address.street}, ${address.number} (${address.complement || 'S/C'})<br>
            ${address.neighborhood}<br>
            ${address.city}, ${address.state} - ${maskCEP(address.zipcode)}
        `;
    };
    
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (!creditCardForm) return;
            if (e.target.value === 'credit-card') {
                creditCardForm.classList.remove('hidden');
            } else {
                creditCardForm.classList.add('hidden');
            }
        });
    });

    const handleConfirmOrder = async () => {
        const paymentMethod = document.querySelector('input[name="payment"]:checked');

        if (!paymentMethod) {
            showFeedback('Selecione uma forma de pagamento.', 'error'); // showFeedback de utils.js
            return;
        }

        if (paymentMethod.value === 'credit-card') {
            const cardNumber = cardNumberInput.value.replace(/\D/g, '');
            const cardName = document.getElementById('card-name').value.trim();
            const cardExpiry = cardExpiryInput.value.replace(/\D/g, '');
            const cardCVV = cardCVVInput.value.replace(/\D/g, '');

            if (cardNumber.length !== 16 || cardExpiry.length !== 4 || cardCVV.length !== 3 || !cardName) {
                showFeedback('Preencha os dados do cartão de crédito corretamente.', 'error');
                return;
            }
        }
        
        try {
            // Usando as funções globais de cart-logic.js
            const total = calculateCartTotal() + calculateShippingFee();
            
            const storesInCart = [...new Set(cart.map(item => item.supermarket?.id))];
            
            const pedidoItems = cart.map(item => {
                const priceEntry = (item.precos || []).find(p => p.supermercado_id === item.supermarket.id);
                return {
                    produto_id: item.id,
                    supermercado_id: item.supermarket.id,
                    quantidade: item.quantity,
                    preco_unitario: priceEntry ? priceEntry.preco : 0
                };
            });
            
            const requestBody = {
                total,
                endereco: address,
                formaPagamento: paymentMethod.value,
                itens: pedidoItems,
                supermercados: storesInCart
            };

            // authFetch de utils.js
            const response = await authFetch('pedidos', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                showFeedback('Pedido confirmado com sucesso! Redirecionando para a Home.');
                localStorage.removeItem('checkoutCart');
                // LIMPA o carrinho principal após a compra
                localStorage.removeItem('cart'); 
                
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            } else {
                 const errorData = await response.json().catch(() => ({ message: 'Erro ao processar pedido' }));
                 showFeedback(errorData.message || 'Falha ao confirmar o pedido. Tente novamente.', 'error');
            }

        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            showFeedback('Não foi possível conectar ao servidor para finalizar o pedido.', 'error');
        }
    };

    if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', handleConfirmOrder);

    renderSummary();
});