// Arquivo: scripts/supermarket-detail.js

// Variáveis globais de estado
let allProducts = []; // Armazena todos os produtos do mercado para filtragem local
let currentSupermarket = null; // Armazena os dados do mercado atual
let cartCount = 0; // Contagem inicial do carrinho

// ============== FUNÇÕES AUXILIARES (extensões de utils.js, mas específicas para a página) ==============

/**
 * Normaliza e traduz chaves de categoria para exibição amigável.
 * @param {string} key - Chave da categoria.
 * @returns {string} Nome amigável.
 */
const normalizeCategoryName = (key) => {
    // Mapeamento de chaves para nomes amigáveis (ajuste conforme sua API)
    const map = {
        'acougue': 'Açougue',
        'laticinios': 'Laticínios',
        'higiene': 'Higiene Pessoal',
        'hortifruti': 'Hortifrúti',
        'frios': 'Frios',
        'bebidas': 'Bebidas',
        'limpeza': 'Limpeza',
        'padaria': 'Padaria',
    };
    const cleanKey = String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return map[cleanKey] || (key ? (key.charAt(0).toUpperCase() + key.slice(1)) : 'Geral');
}

/**
 * Extrai o ID do supermercado da URL.
 * @returns {string | null} O ID do supermercado ou null.
 */
const getSupermarketIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
};


// ============== LÓGICA DO CARRINHO (API) ==============

/**
 * Carrega a contagem de itens do carrinho da API e atualiza o display.
 */
const loadCartCount = async () => {
    try {
        // Assume um endpoint que retorna a contagem total de itens no carrinho do usuário
        const response = await authFetch('/carrinho/count'); 
        const data = await response.json();
        
        // A API pode retornar { count: 5 } ou apenas o número 5
        const count = data.count !== undefined ? data.count : (typeof data === 'number' ? data : 0);
        cartCount = count;
        
        updateCartCountDisplay(); 
    } catch (error) {
        // Silenciosamente falha se o carrinho não puder ser carregado
        console.error("Erro ao carregar contagem do carrinho:", error);
    }
};

/**
 * Atualiza a contagem de itens do carrinho no header.
 */
const updateCartCountDisplay = () => {
    const countElement = document.getElementById('contagem-carrinho');
    if (countElement) {
        countElement.textContent = cartCount;
        // Mostra a contagem se for maior que zero
        countElement.classList.toggle('hidden', cartCount === 0);
    }
};


/**
 * Adiciona um produto ao carrinho via API.
 * @param {number} productId - ID do produto a ser adicionado.
 * @param {number} quantity - Quantidade a ser adicionada. Padrão 1.
 */
const addToCart = async (productId, quantity = 1) => {
    if (!currentSupermarket) {
        alert('Erro: Dados do mercado não carregados. Tente recarregar a página.');
        return;
    }
    
    // O ID do mercado é necessário para o endpoint de adicionar ao carrinho, 
    // garantindo que o produto seja adicionado ao carrinho da loja correta.
    const payload = {
        produtoId: productId,
        quantidade: quantity,
        empresaId: currentSupermarket.id 
    };

    try {
        const response = await authFetch('/carrinho/adicionar', {
            method: 'POST',
            // authFetch já adiciona 'Content-Type': 'application/json' e 'Authorization'
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
             // Se o backend retorna a nova contagem, usamos ela
            if (data.novaContagem !== undefined) {
                cartCount = data.novaContagem;
                updateCartCountDisplay();
            } else {
                // Caso contrário, forçamos a recarga
                loadCartCount(); 
            }
            console.log(`Produto ${productId} adicionado.`, data);
            alert('✅ Produto adicionado ao carrinho!');
        } else {
             // O backend pode retornar uma mensagem de erro no corpo
            const errorMessage = data.message || 'Falha ao adicionar item ao carrinho. Verifique as regras da loja (mínimo, estoque, etc).';
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error("Erro ao adicionar ao carrinho:", error);
        alert(`❌ Erro: ${error.message}`);
    }
};

// Expondo a função para ser usada nos botões do HTML
window.addToCart = addToCart; 


// ============== LÓGICA DE RENDERIZAÇÃO E FILTRAGEM ==============

/**
 * Renderiza a lista de produtos na tela.
 */
const renderProductList = (products) => {
    const container = document.getElementById('container-supermercado-produtos');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `<div class="p-4 text-center w-full text-gray-500 col-span-full">Nenhum produto encontrado nesta categoria.</div>`;
        return;
    }
    
    products.forEach(product => {
        // Usa as funções globais formatPrice e getFullImage (do utils.js)
        const price = product.preco || 0.00;
        const originalPrice = product.preco_antigo; 
        // Verifica se é uma oferta válida (preço novo < preço antigo)
        const isOffer = originalPrice && parseFloat(originalPrice) > parseFloat(price);

        const discountHtml = isOffer ? 
            `<span class="text-sm line-through text-gray-400 mr-2">${formatPrice(originalPrice)}</span>` : '';
        const discountBadge = isOffer ? 
            `<span style="background-color: var(--color-secondary);" class="absolute top-3 left-3 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">OFERTA</span>` 
            : '';
        
        const categoryName = normalizeCategoryName(product.categoria);
        // getFullImage é uma função do utils.js
        const imageUrl = getFullImage(product.img || ''); 

        const element = `
            <div class="product-card bg-white rounded-xl shadow-md overflow-hidden flex flex-col justify-between p-4 relative border border-gray-100">
                ${discountBadge}
                <img src="${imageUrl}" alt="${product.nome}" class="w-full h-36 object-contain mb-3 rounded-lg" onerror="this.onerror=null;this.src='https://placehold.co/180x180/F2E9D8/0A3D62?text=Produto';">
                <div class="flex flex-col flex-grow">
                    <h3 class="text-base font-semibold text-gray-800 line-clamp-2">${product.nome}</h3>
                    <p class="text-xs text-gray-500 mt-1 mb-2">${categoryName}</p>
                </div>
                <div class="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                    <div class="flex flex-col items-start">
                        ${discountHtml}
                        <span style="color: var(--color-primary);" class="text-xl font-extrabold">${formatPrice(price)}</span>
                    </div>
                    <button onclick="addToCart(${product.id})" style="background-color: var(--color-primary);" class="hover:opacity-90 text-white text-sm font-semibold p-2 rounded-full shadow-md transition duration-200 transform hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += element;
    });
};


/**
 * Filtra os produtos localmente (client-side) e renderiza.
 * @param {string} categoryKey - Chave da categoria para filtrar ('all' para todos).
 * @param {Event} event - O evento de clique.
 */
const filterProducts = (categoryKey, event) => {
    // Previne o comportamento padrão do <a>
    if (event) event.preventDefault(); 
    
    let filteredProducts = [];
    
    if (categoryKey === 'all') {
        filteredProducts = allProducts;
    } else {
        // Filtra comparando a chave da categoria (case insensitive e removendo espaços/caracteres especiais)
        const cleanKey = categoryKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        filteredProducts = allProducts.filter(p => 
            String(p.categoria || '').toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey
        );
    }
    
    renderProductList(filteredProducts);
    
    // Atualiza o estado visual do botão ativo
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        // Remove a classe ativa e estilos primários
        btn.classList.remove('active-filter', 'bg-primary', 'text-white', 'border-primary');
        // Adiciona estilos padrão (branco/cinza)
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-100'); 
    });
    
    const activeBtn = document.getElementById(`filter-${categoryKey.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    if (activeBtn) {
        // Define o estilo do botão ativo
        activeBtn.classList.remove('bg-white', 'text-gray-700', 'border-gray-100');
        activeBtn.classList.add('active-filter', 'bg-primary', 'text-white', 'border-primary');
    }
};

// Expondo a função para ser usada nos botões do HTML
window.filterProducts = filterProducts; 


/**
 * Renderiza as categorias e anexa os event listeners de filtro.
 * @param {Array<string>} rawCategories - Lista de strings de categorias da API.
 */
const renderSupermarketCategories = (rawCategories) => {
    const container = document.getElementById('container-supermercado-categorias');
    if (!container) return;

    // Remove duplicatas e valores vazios, e normaliza para exibição
    const uniqueCategories = [...new Set(rawCategories.filter(Boolean))];

    // 1. Adiciona o botão 'Ver Todos' (padrão ativo)
    let categoriesHtml = `
        <a href="#" onclick="filterProducts('all', event)" id="filter-all"
           class="category-filter-btn flex flex-col items-center justify-center p-4 w-28 h-28 bg-primary text-white rounded-xl shadow-md transition duration-300 ease-in-out transform cursor-pointer shrink-0 border border-primary active-filter">
            <span class="text-3xl font-bold mb-1">🛒</span>
            <span class="text-xs sm:text-sm font-medium text-center line-clamp-2">Ver Todos</span>
        </a>
    `;

    // 2. Adiciona as categorias dinâmicas
    uniqueCategories.forEach(cat => {
        const cleanKey = cat.toLowerCase().replace(/[^a-z0-9]/g, '');
        const friendlyName = normalizeCategoryName(cat);
        
        // Simples ícone genérico ou placeholder para as categorias
        const icon = '📦'; 

        categoriesHtml += `
            <a href="#" onclick="filterProducts('${cat}', event)" id="filter-${cleanKey}"
               class="category-filter-btn flex flex-col items-center justify-center p-4 w-28 h-28 bg-white text-gray-700 rounded-xl shadow-md transition duration-300 ease-in-out transform cursor-pointer shrink-0 border border-gray-100 hover:border-primary">
                <span class="text-3xl font-bold mb-1">${icon}</span>
                <span class="text-xs sm:text-sm font-medium text-center line-clamp-2">${friendlyName}</span>
            </a>
        `;
    });
    
    container.innerHTML = categoriesHtml;
};


/**
 * Carrega os dados do supermercado e seus produtos.
 */
const loadSupermarketData = async () => {
    const supermarketId = getSupermarketIdFromUrl();
    if (!supermarketId) {
        document.getElementById('container-supermercado-produtos').innerHTML = '<div class="p-4 text-center w-full text-red-500 col-span-full">Erro: ID do supermercado não encontrado na URL.</div>';
        return;
    }
    
    const infoNameElement = document.getElementById('info-name');
    const infoDetailsElement = document.getElementById('info-details');
    const infoTimeElement = document.getElementById('info-time');
    const titleElement = document.getElementById('supermarket-title');
    const nameHeaderElement = document.getElementById('supermarket-name');
    const logoElement = document.getElementById('supermarket-logo');
    
    try {
        // 1. Buscar Dados do Supermercado
        const marketResponse = await authFetch(`/empresas/${supermarketId}`);
        currentSupermarket = await marketResponse.json();

        if (currentSupermarket.message) { // Se a API retornar um erro em JSON
            throw new Error(currentSupermarket.message);
        }

        // Atualiza a UI com os dados do mercado
        const marketName = currentSupermarket.nome || 'Supermercado Desconhecido';
        const marketTime = currentSupermarket.tempo_medio_entrega || '45-60 min';
        const marketAddress = currentSupermarket.endereco || 'Endereço não informado';

        infoNameElement.textContent = marketName;
        infoDetailsElement.textContent = marketAddress;
        infoTimeElement.textContent = `Tempo médio: ${marketTime}`;
        titleElement.textContent = marketName + ' - Speed Market';
        nameHeaderElement.textContent = marketName;
        logoElement.src = getFullImage(currentSupermarket.logo || '');
        logoElement.alt = `Logo de ${marketName}`;

        
        // 2. Buscar Produtos do Supermercado
        // Endpoint para buscar produtos filtrados por empresa
        const productsResponse = await authFetch(`/produtos/empresa/${supermarketId}`);
        const productsData = await productsResponse.json();

        // Armazena todos os produtos (para filtragem local)
        allProducts = productsData.produtos || []; 
        
        // Extrai categorias únicas dos produtos
        const rawCategories = allProducts.map(p => p.categoria).filter(Boolean);

        // 3. Renderizar Categorias e Produtos
        renderSupermarketCategories(rawCategories);
        // Inicialmente, renderiza todos os produtos
        renderProductList(allProducts); 
        
    } catch (error) {
        console.error("Erro ao carregar dados do mercado:", error);
        
        const errorMessage = `Erro ao carregar os dados: ${error.message}. Tente recarregar a página.`;
        
        infoNameElement.textContent = 'Erro de Carregamento';
        infoDetailsElement.textContent = errorMessage;
        infoTimeElement.textContent = '';
        titleElement.textContent = 'Erro - Speed Market';
        nameHeaderElement.textContent = 'Erro';
        
        document.getElementById('container-supermercado-categorias').innerHTML = `<div class="p-4 text-red-500">Erro ao carregar categorias.</div>`;
        document.getElementById('container-supermercado-produtos').innerHTML = `<div class="p-4 text-center w-full text-red-500 col-span-full">${errorMessage}</div>`;
    }
};

// ============== INÍCIO DO SCRIPT ==============
document.addEventListener('DOMContentLoaded', () => {
    // Roda a função principal para carregar os dados
    loadSupermarketData();
    // Carrega a contagem inicial do carrinho
    loadCartCount(); 
});