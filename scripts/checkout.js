// scripts/checkout.js

(function () {
    const resumoCarrinhoContainer = document.getElementById('resumo-carrinho');
    const totalPedidoSpan = document.getElementById('total-pedido');
    const checkoutForm = document.getElementById('checkout-form');
    const confirmarModalBtn = document.getElementById('confirmar-modal-btn'); // Botão principal do formulário
    const checkoutMessage = document.getElementById('checkout-message');
    
    // Elementos do Modal
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalVoltarBtn = document.getElementById('modal-voltar-btn');
    const modalConfirmarBtn = document.getElementById('modal-confirmar-btn');
    const enderecoExibido = document.getElementById('endereco-exibido');
    
    // Variáveis para o Modal
    const modalTotalSpan = document.getElementById('modal-total');
    const modalEnderecoSpan = document.getElementById('modal-endereco');
    const modalPagamentoSpan = document.getElementById('modal-pagamento');

    // Endereço (usando um mock/placeholder para demonstração, 
    // idealmente viria do localStorage ou de uma chamada API de perfil)
    const ENDERECO_ENTREGA_DEFAULT = {
        enderecoCompleto: "Rua da Amostra, 123 - Apto 101",
        cidade: "São Paulo",
        cep: "01000-000",
        // Campo completo para envio à API
        apiData: {
            endereco: "Rua da Amostra, 123",
            complemento: "Apto 101",
            cidade: "São Paulo",
            cep: "01000-000"
        }
    };
    
    // Atualiza o texto do endereço no corpo da página
    enderecoExibido.textContent = `${ENDERECO_ENTREGA_DEFAULT.enderecoCompleto} - ${ENDERECO_ENTREGA_DEFAULT.cidade}, ${ENDERECO_ENTREGA_DEFAULT.cep}`;


    // Função para exibir mensagens de sucesso ou erro
    const exibirMensagem = (mensagem, tipo = 'erro') => {
        checkoutMessage.textContent = mensagem;
        checkoutMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        
        if (tipo === 'sucesso') {
            checkoutMessage.classList.add('bg-green-100', 'text-green-700');
        } else {
            checkoutMessage.classList.add('bg-red-100', 'text-red-700');
        }

        setTimeout(() => {
            checkoutMessage.classList.add('hidden');
        }, 5000);
    };

    // Função para renderizar os itens do carrinho na página de checkout
    function renderizarResumoCarrinho() {
        const carrinho = getCart(); // Função global do cart.js
        resumoCarrinhoContainer.innerHTML = '';
        let total = 0;

        if (carrinho.length === 0) {
            resumoCarrinhoContainer.innerHTML = '<p class="text-gray-500">Seu carrinho está vazio. <a href="home.html" class="text-primary font-semibold">Voltar às compras</a></p>';
            totalPedidoSpan.textContent = formatCurrency(0);
            confirmarModalBtn.disabled = true;
            return;
        }

        carrinho.forEach(item => {
            const subtotal = item.preco * (item.quantidade || 1); 
            total += subtotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-start text-sm';
            itemElement.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-semibold">${item.nome}</span>
                    <span class="text-gray-500">${item.quantidade || 1} x ${formatCurrency(item.preco)}</span>
                </div>
                <span class="font-bold">${formatCurrency(subtotal)}</span>
            `;
            resumoCarrinhoContainer.appendChild(itemElement);
        });

        totalPedidoSpan.textContent = formatCurrency(total);
        confirmarModalBtn.disabled = false;
    }
    
    // Função para abrir o modal de confirmação
    function openConfirmationModal(totalFormatado, metodoPagamento) {
        modalTotalSpan.textContent = totalFormatado; // Recebe e atribui o texto formatado
        modalEnderecoSpan.textContent = ENDERECO_ENTREGA_DEFAULT.enderecoCompleto;
        modalPagamentoSpan.textContent = metodoPagamento;
        confirmationModal.classList.remove('hidden');
    }

    // Função para fechar o modal
    function closeConfirmationModal() {
        confirmationModal.classList.add('hidden');
        confirmarModalBtn.disabled = false;
        confirmarModalBtn.textContent = 'Revisar e Finalizar Pedido';
    }

    // NOVO: Função para enviar o pedido após confirmação no modal
    async function confirmOrder() {
        const carrinho = getCart();
        const metodoPagamento = document.querySelector('input[name="payment-method"]:checked').value;
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            exibirMensagem('Você precisa estar logado para finalizar o pedido.');
            closeConfirmationModal();
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }

        const totalTexto = totalPedidoSpan.textContent;
        const total = parseFloat(totalTexto.replace('R$', '').replace('.', '').replace(',', '.'));

        const pedidoData = {
            itens: carrinho.map(item => ({
                produtoId: item.id,
                quantidade: item.quantidade || 1,
                precoUnitario: item.preco 
            })),
            endereco: ENDERECO_ENTREGA_DEFAULT.apiData, // Usando o objeto de endereço fixo
            metodoPagamento: metodoPagamento,
            total: total
        };
        
        modalConfirmarBtn.disabled = true;
        modalConfirmarBtn.textContent = 'Enviando...';

        try {
            const response = await fetch(`${API_URL}/pedidos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}` 
                },
                body: JSON.stringify(pedidoData)
            });

            if (response.ok) {
                clearCart(); // Limpa o carrinho
                
                closeConfirmationModal();
                exibirMensagem('Pedido finalizado com sucesso! Redirecionando para a home.', 'sucesso');
                
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 3000);

            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erro ao processar o pedido. Tente novamente.' }));
                closeConfirmationModal(); // Fecha o modal e reativa o botão principal
                exibirMensagem(errorData.message || 'ERRO: Falha na finalização do pedido.');
            }
        } catch (error) {
            console.error('Erro de Conexão:', error);
            closeConfirmationModal(); // Fecha o modal e reativa o botão principal
            exibirMensagem('ERRO: Não foi possível conectar ao servidor.');
        }
    }

    // Funções de Evento (Manipuladores)
    
    // O submit do formulário agora APENAS abre o modal de confirmação
    function handleFormSubmit(event) {
        event.preventDefault();

        const carrinho = getCart();
        if (carrinho.length === 0) {
            exibirMensagem('O carrinho está vazio. Adicione produtos para finalizar o pedido.');
            return;
        }
        
        // 1. Coletar dados de pagamento
        const metodoPagamento = document.querySelector('input[name="payment-method"]:checked');
        if (!metodoPagamento) {
            exibirMensagem('Por favor, selecione um método de pagamento.');
            return;
        }
        
        // AQUI: Pegamos o texto TOTAL que já está formatado
        const totalTextoFormatado = totalPedidoSpan.textContent; 
  
        openConfirmationModal(totalTextoFormatado, metodoPagamento.value);
    }
    
    // Inicialização: Carregar resumo do carrinho e anexar listeners
    document.addEventListener('DOMContentLoaded', () => {
        renderizarResumoCarrinho();
        checkoutForm.addEventListener('submit', handleFormSubmit);
        
        // Listeners do Modal
        modalVoltarBtn.addEventListener('click', closeConfirmationModal);
        modalConfirmarBtn.addEventListener('click', confirmOrder);
        
        // Fechar modal ao clicar fora
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                closeConfirmationModal();
            }
        });
    });

})();