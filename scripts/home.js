// [home.js] - LÓGICA DE RENDERIZAÇÃO E API
// Dependências Globais (devem vir de utils.js): authFetch, formatPrice, getFullImage

let userName = localStorage.getItem('userName') || 'Minha Conta';

// Mocks de ícones para as categorias (usa o enum 'tiposProd' do seu schema.prisma)
const CATEGORY_ICONS = {
    "hortifruti": "https://cdn-icons-png.flaticon.com/512/5346/5346400.png",
    "acougue": "https://cdn-icons-png.flaticon.com/512/1534/1534825.png",
    "padaria": "https://cdn-icons-png.flaticon.com/512/7547/7547106.png",
    "laticinios": "https://cdn-icons-png.flaticon.com/512/3070/3070925.png",
    "bebidas": "https://cdn-icons-png.freepik.com/256/2405/2405451.png",
    "limpeza": "https://cdn-icons-png.freepik.com/512/994/994644.png",
    "frios": "https://cdn-icons-png.flaticon.com/512/869/869664.png",
    "higiene": "https://cdn-icons-png.flaticon.com/512/7575/7575083.png",
};


// ------------------------------------
// Funções de Utilitários Específicas da Home
// ------------------------------------

// Atualiza o nome de usuário no header
const updateUserName = () => {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
};

// Renderiza as categorias (atualmente mockadas/fixas)
const renderCategories = () => {
    const container = document.getElementById('container-categorias');
    if (!container) return;

    // Constrói o array de categorias a partir dos MOCKs
    const categories = Object.keys(CATEGORY_ICONS).map(slug => ({
        nome: slug.charAt(0).toUpperCase() + slug.slice(1), 
        slug: slug,
        img: CATEGORY_ICONS[slug]
    }));

    container.innerHTML = ''; 

    categories.forEach(cat => {
        const element = `
            <a href="supermercados.html?category=${cat.slug}" class="category-card flex flex-col items-center p-3 sm:p-4 bg-white rounded-xl hover:shadow-lg transition duration-200 w-24 flex-shrink-0">
                <img src="${cat.img}" alt="${cat.nome}" class="w-12 h-12 object-contain mb-2">
                <span class="text-xs font-medium text-gray-700 text-center">${cat.nome}</span>
            </a>
        `;
        container.innerHTML += element;
    });
};

// Renderiza os produtos em destaque (puxa da API)
const renderFeaturedProducts = (products) => {
    const container = document.getElementById('container-produtos-destaque');
    if (!container) return;

    container.innerHTML = '';
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Nenhum produto em destaque encontrado na API.</p>';
        return;
    }

    products.forEach(product => {
        // Assume-se que 'product' tem: id, nome, preco, img, categoria (tiposProd)
        const categoryName = product.categoria.charAt(0).toUpperCase() + product.categoria.slice(1);

        const element = `
            <div class="product-card bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition duration-300 flex flex-col">
                <img src="${getFullImage(product.img)}" alt="${product.nome}" class="w-full h-32 object-contain mb-3 rounded-lg" onerror="this.onerror=null;this.src='https://placehold.co/150x150/0A3D62/FFFFFF?text=Produto';">
                <h3 class="text-base font-semibold text-gray-800 line-clamp-2 flex-grow">${product.nome}</h3>
                <p class="text-sm text-gray-500 mt-1 mb-2">${categoryName}</p>
                <div class="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                    <span style="color: var(--color-primary);" class="text-xl font-extrabold">${formatPrice(product.preco)}</span>
                    <button 
                        onclick="addToCartSimple(${product.id}, '${product.nome}', ${product.preco})" 
                        style="background-color: var(--color-primary);" 
                        class="cart-button text-white p-2 rounded-full shadow-md transition duration-200 transform hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += element;
    });
};

// Renderiza os supermercados (puxa da API)
const renderPopularSupermarkets = (supermarkets) => {
    const container = document.getElementById('container-mercados-area');
    if (!container) return;

    container.innerHTML = '';

    if (!supermarkets || supermarkets.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Nenhum supermercado encontrado na API.</p>';
        return;
    }

    supermarkets.forEach(market => {
        // Usando dados mockados/padrão se a API não retornar todos os campos
        // Você deve garantir que a API retorne esses dados ou ajustar o HTML para o que ela retorna (nome, img, id)
        const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1); // Simula um rating
        const minDelivery = 'R$ 5,00';
        const time = '30-45 min';
        
        const element = `
            <a href="supermercados.html?id=${market.id}" class="supermarket-card bg-white p-4 rounded-xl shadow-md border border-gray-100 transition duration-300 hover:border-primary flex flex-col">
                <img src="${getFullImage(market.img)}" alt="${market.nome}" class="w-full h-24 object-contain mb-3 rounded-lg" onerror="this.onerror=null;this.src='https://placehold.co/200x80/0A3D62/FFFFFF?text=Mercado';">
                <div class="flex flex-col flex-grow">
                    <h3 class="text-lg font-bold text-gray-800 line-clamp-1">${market.nome}</h3>
                    <div class="flex justify-between items-center text-sm mt-2">
                        <div class="flex items-center text-yellow-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.691-.921 1.992 0l2.062 6.345a1 1 0 00.95.691h6.666c.969 0 1.369 1.243.588 1.81l-5.385 3.911a1 1 0 00-.364 1.118l2.062 6.345c.3.921-.755 1.688-1.54 1.118l-5.385-3.911a1 1 0 00-1.176 0l-5.385 3.911c-.785.57-.367-.197-.067-1.118l2.062-6.345a1 1 0 00-.364-1.118L1.385 11.773c-.781-.567-.381-1.81.588-1.81h6.666a1 1 0 00.95-.691l2.062-6.345z" /></svg>
                            <span class="font-semibold">${rating}</span>
                        </div>
                        <div class="text-gray-600">
                            Entrega: <span class="font-medium text-gray-800">${minDelivery}</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Tempo médio: <span class="font-medium text-gray-800">${time}</span></p>
                </div>
            </a>
        `;
        container.innerHTML += element;
    });
};

// Simples função de adicionar ao carrinho (idealmente estaria no cart.js)
// Nota: Se você tem um cart.js complexo, use a função 'addToCart' dele.
function addToCartSimple(productId, productName, productPrice) {
    if (typeof addToCart === 'function' && typeof getProductById === 'function') {
        // Se a lógica do cart.js for completa, tente usá-la.
        // Isso requer uma função para buscar o objeto completo do produto e do mercado.
        console.warn('Usando a função complexa do cart.js. A lógica de produto/supermercado completo é necessária.');
        // Exemplo: addToCart(getProductById(productId), getSupermarketForProduct(productId));
        alert('Tentando adicionar ao carrinho com lógica completa (Ver console).');
    } else {
        // Simulação básica. 
        // Garante que a contagem do carrinho é atualizada (updateCartCount deve vir de cart.js)
        if (typeof updateCartCount === 'function') {
            updateCartCount(); 
        } else {
             // Caso updateCartCount não exista, incrementa o contador da Home.
            const cartCountElement = document.getElementById('cart-count');
            if(cartCountElement) {
                cartCountElement.textContent = parseInt(cartCountElement.textContent) + 1;
            }
        }
        alert(`Produto "${productName}" (ID: ${productId}, ${formatPrice(productPrice)}) adicionado ao carrinho (simulação).`);
    }
}


// Lógica de logout
const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');
    // Clear the cart on logout (optional, but recommended)
    localStorage.removeItem('cart'); 
    window.location.href = 'login.html';
};


// ------------------------------------
// LÓGICA PRINCIPAL DE CARREGAMENTO ASÍNCRONO
// ------------------------------------

const loadHomePageData = async () => {
    // 1. Renderiza as categorias (são fixas, renderiza primeiro)
    renderCategories(); 

    // 2. Faz as requisições assíncronas para a API
    try {
        // Rotas baseadas no seu routes.js: /produtos e /empresas
        const [allProducts, allSupermarkets] = await Promise.all([
            // authFetch agora retorna o JSON se for OK (graças à correção em utils.js)
            authFetch('/produtos'), 
            authFetch('/empresas')  
        ]);
        
        // **********************************************
        // LOG DE VERIFICAÇÃO CRUCIAL (Verifique no F12 -> Console)
        // Se estes logs NÃO mostrarem arrays de objetos, a API não tem dados ou a rota está errada.
        console.log('API RESPONSE: Produtos', allProducts);
        console.log('API RESPONSE: Supermercados', allSupermarkets);
        // **********************************************

        // 3. Verifica e Renderiza os dados obtidos da API
        // Trata a possibilidade de a API retornar null ou algo que não seja um array
        const productsArray = Array.isArray(allProducts) ? allProducts : [];
        const supermarketsArray = Array.isArray(allSupermarkets) ? allSupermarkets : [];

        // Renderiza apenas os primeiros produtos para a seção de Destaque
        renderFeaturedProducts(productsArray.slice(0, 8)); 
        renderPopularSupermarkets(supermarketsArray);
        
    } catch (error) {
        // Erros de autenticação (401) já são tratados e redirecionam em utils.js.
        // Outros erros de conexão ou servidor (500) serão logados aqui.
        console.error("ERRO CRÍTICO ao carregar dados da Home:", error);
    }
};

// ------------------------------------
// Inicialização
// ------------------------------------

window.onload = function() {
    // 1. Inicia o carregamento de dados
    loadHomePageData(); 
    
    // 2. Atualiza o nome de usuário
    updateUserName();

    // 3. Configura o evento de logout
    const logoutButton = document.getElementById('botao-sair'); 
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // 4. Se a função 'updateCartCount' existir (de cart.js), chama para atualizar o ícone.
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }

    // 5. Configura o toggle do carrinho se o cart.js não tiver o setup
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (closeCartBtn && typeof toggleCart === 'function') {
        closeCartBtn.addEventListener('click', toggleCart);
    }
};