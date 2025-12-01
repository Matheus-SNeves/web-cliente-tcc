// scripts/supermercado.js
(function() { 
    
    // Estas variáveis são locais a este arquivo JS, evitando conflitos com home.js
    let categoriaAtiva = null;
    let supermercadoId = null; 
    let produtoModalAberto = null; 

    const CATEGORIAS = [
        { nome: 'acougue', display: 'Açougue', icon: '🥩' },
        { nome: 'bebidas', display: 'Bebidas', icon: '🍹' },
        { nome: 'frios', display: 'Frios', icon: '🧀' },
        { nome: 'higiene', display: 'Higiene', icon: '🧼' },
        { nome: 'hortifruti', display: 'Hortifrúti', icon: '🍎' },
        { nome: 'laticinios', display: 'Laticínios', icon: '🥛' },
        { nome: 'limpeza', display: 'Limpeza', icon: '🧹' },
        { nome: 'padaria', display: 'Padaria', icon: '🍞' },
    ];

    function goToHome() {
        window.location.href = 'home.html';
    }

    function getSupermercadoIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async function fetchSupermercado(id) {
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        try {
            // API_URL (global, do config.js) é acessível aqui
            const response = await fetch(`${API_URL}/empresas/${id}`, { 
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                throw new Error(`Erro ao buscar o supermercado: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar detalhes do supermercado:', error);
            return null;
        }
    }

    async function fetchProdutosDoSupermercado(id) {
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        try {
            const response = await fetch(`${API_URL}/produtos?id_supermercado=${id}`, {
                method: 'GET',
                headers: headers
            });
            if (!response.ok) {
                throw new Error(`Erro ao buscar produtos: ${response.status}`);
            }
            const data = await response.json();
            
            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.produtos)) {
                return data.produtos;
            }
            return [];

        } catch (error) {
            console.error('Erro ao buscar produtos do supermercado:', error);
            return [];
        }
    }

    function handleCategoriaClick(nomeCategoria) {
        if (categoriaAtiva === nomeCategoria) {
            categoriaAtiva = null;
        } else {
            categoriaAtiva = nomeCategoria;
        }

        document.querySelectorAll('.card-categoria').forEach(card => {
            card.classList.remove('bg-primary', 'text-white', 'scale-105');
            card.classList.add('bg-white', 'text-gray-700');
        });

        if (categoriaAtiva) {
            const cardAtivo = document.getElementById(`cat-${categoriaAtiva}`);
            if (cardAtivo) {
                cardAtivo.classList.remove('bg-white', 'text-gray-700');
                cardAtivo.classList.add('bg-primary', 'text-white', 'scale-105');
            }
        }

        displayProdutos(categoriaAtiva);
    }

    function createCategoriaCard(categoria) {
        const card = document.createElement('div');
        card.id = `cat-${categoria.nome}`;
        card.className = 'card-categoria flex flex-col items-center justify-center p-3 rounded-xl w-24 h-24 shadow-md hover:bg-gray-100 transition duration-200 cursor-pointer flex-shrink-0 text-center bg-white text-gray-700';

        if (categoria.nome === categoriaAtiva) {
            card.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-100');
            card.classList.add('bg-primary', 'text-white', 'scale-105');
        }
        
        card.innerHTML = `
            <span class="text-3xl">${categoria.icon}</span>
            <p class="text-xs font-semibold mt-1">${categoria.display}</p>
        `;
        
        card.addEventListener('click', () => {
            handleCategoriaClick(categoria.nome);
        });
        return card;
    }

    function displayCategories() {
        const gradeCategorias = document.getElementById('grade-categorias');
        if (!gradeCategorias) return;

        gradeCategorias.innerHTML = ''; 
        
        CATEGORIAS.forEach(categoria => {
            const card = createCategoriaCard(categoria);
            gradeCategorias.appendChild(card);
        });
    }

    function openProductModal(produto) {
        produtoModalAberto = produto;
        
        const modalImg = document.getElementById('modal-img');
        const modalNome = document.getElementById('modal-nome');
        const modalDescricao = document.getElementById('modal-descricao');
        const modalPreco = document.getElementById('modal-preco');
        const modalBtn = document.getElementById('modal-add-to-cart-btn');
        const modal = document.getElementById('product-modal');

        if(modalImg) modalImg.src = produto.img;
        if(modalNome) modalNome.textContent = produto.nome;
        if(modalDescricao) modalDescricao.textContent = produto.descricao || 'Sem descrição disponível.';
        if(modalPreco) modalPreco.textContent = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;
        
        if (modalBtn) {
            modalBtn.textContent = 'Adicionar ao Carrinho';
            modalBtn.onclick = () => {
                // addToCart (global, do cart.js) é acessível aqui
                addToCart(produto); 
                if(modal) modal.classList.add('hidden'); 
                produtoModalAberto = null;
            };
        }

        if(modal) modal.classList.remove('hidden');
    }

    function createProdutoCard(produto) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm hover:shadow-lg transition duration-200 overflow-hidden flex flex-col justify-between'; 
        
        const nomeCategoriaDisplay = CATEGORIAS.find(c => c.nome === produto.categoria)?.display || produto.categoria;

        card.innerHTML = `
            <div class="relative cursor-pointer" id="card-details-${produto.id}">
                <img src="${produto.img}" alt="${produto.nome}" class="w-full h-32 object-contain p-2">
                <span class="absolute top-2 right-2 bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">${nomeCategoriaDisplay}</span>
            </div>
            <div class="p-3 cursor-pointer" id="card-name-price-${produto.id}">
                <h4 class="text-sm font-semibold text-gray-800 line-clamp-2">${produto.nome}</h4>
            </div>
            <div class="p-3 border-t flex items-center justify-between">
                <p class="text-lg font-bold text-primary">R$ ${(produto.preco || 0).toFixed(2).replace('.', ',')}</p>
                <button class="add-to-cart-btn bg-primary text-white p-2 rounded-full hover:bg-opacity-90 transition duration-150" title="Adicionar ao Carrinho" data-product-id="${produto.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        `;

        card.querySelector(`#card-details-${produto.id}`).addEventListener('click', () => {
            openProductModal(produto);
        });
        card.querySelector(`#card-name-price-${produto.id}`).addEventListener('click', () => {
            openProductModal(produto);
        });
        
        card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            addToCart(produto); 
        });
        
        return card;
    }

    async function displayProdutos(filtroCategoria = null) {
        const produtos = await fetchProdutosDoSupermercado(supermercadoId);
        const gradeProdutos = document.getElementById('grade-produtos');
        const tituloProdutos = document.getElementById('titulo-produtos');

        if (!gradeProdutos) return;

        gradeProdutos.innerHTML = ''; 

        if (filtroCategoria) {
            const nomeDisplay = CATEGORIAS.find(c => c.nome === filtroCategoria)?.display || 'Produtos Filtrados';
            if (tituloProdutos) tituloProdutos.textContent = `Produtos em ${nomeDisplay}`;
        } else {
            if (tituloProdutos) tituloProdutos.textContent = 'Todos os Produtos';
        }

        const produtosFiltrados = filtroCategoria 
            ? produtos.filter(p => p.categoria === filtroCategoria)
            : produtos;
        
        if (produtosFiltrados.length === 0) {
            gradeProdutos.innerHTML = '<p class="text-gray-500 text-center col-span-full p-8">Nenhum produto encontrado nesta seção.</p>';
            return;
        }

        produtosFiltrados.forEach(produto => {
            const card = createProdutoCard(produto);
            gradeProdutos.appendChild(card);
        });
    }

    async function initSupermercadoPage() {
        supermercadoId = getSupermercadoIdFromUrl();

        const nomeElement = document.getElementById('supermercado-nome');
        const titleElement = document.getElementById('page-title');

        if (!supermercadoId) {
            if (nomeElement) nomeElement.textContent = 'Erro: Supermercado não especificado.';
            return;
        }

        const info = await fetchSupermercado(supermercadoId);

        if (info) {
            if (nomeElement) nomeElement.textContent = info.nome; 
            if (titleElement) titleElement.textContent = `${info.nome} - Speed Market`;
        } else {
            if (nomeElement) nomeElement.textContent = 'Supermercado não encontrado.';
        }

        displayCategories(); 
        displayProdutos(); 

        const backButton = document.getElementById('back-to-home-btn');
        if(backButton) {
            backButton.addEventListener('click', goToHome);
        }
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                 const modal = document.getElementById('product-modal');
                 if(modal) modal.classList.add('hidden');
                 produtoModalAberto = null;
            });
        }
    }

    document.addEventListener('DOMContentLoaded', initSupermercadoPage);

})(); // Fim da IIFE