document.addEventListener('DOMContentLoaded', async () => {
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

    // MODIFICADO: URL da API.
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    // Autenticação: inclui token se existir (igual aos outros scripts)
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

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

    if (!categoryName || !productId) {
        document.body.innerHTML = '<h1>Erro: Categoria ou produto não especificado.</h1>';
        return;
    }

    try {
        // MODIFICADO: Busca todos os produtos da categoria e todos os supermercados.
        // Uma API mais otimizada poderia ter um endpoint /produtos/:id
        const [productsResponse, supermarketsResponse] = await Promise.all([
            fetch(`${API_URL}/produtos?categoria=${categoryName}`, { headers }),
            fetch(`${API_URL}/empresas`, { headers })
        ]);

        // Se houver 401/403 -> token inválido
        if (productsResponse.status === 401 || productsResponse.status === 403 || supermarketsResponse.status === 401 || supermarketsResponse.status === 403) {
            console.warn('Token inválido ou sem permissão — limpando e redirecionando para login.');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return;
        }

        let productsData = productsResponse.ok ? await productsResponse.json() : [];
        let supermarketsData = supermarketsResponse.ok ? await supermarketsResponse.json() : [];

        console.info('/produtos?categoria status:', productsResponse.status, '/supermercados status:', supermarketsResponse.status);

        // Se a lista por categoria vier vazia, tenta fetch de todos os produtos como fallback
        if ((!productsData || productsData.length === 0)) {
            console.warn('/produtos?categoria retornou vazio — tentando fallback /produtos (tudo)');
            try {
                const allRes = await fetch(`${API_URL}/produtos`);
                if (allRes.ok) {
                    productsData = await allRes.json();
                    console.info('Fallback /produtos carregado, total:', (productsData || []).length);
                } else {
                    console.warn('Fallback /produtos retornou status', allRes.status);
                }
            } catch (e) {
                console.warn('Erro no fallback /produtos:', e);
            }
        }

        // Se a API não retornar produtos ou supermercados, mantemos arrays vazios (sem fallback local)

        // MODIFICADO: Encontra o produto na lista retornada pela API.
        let product = (productsData || []).find(p => Number(p.id) === Number(productId));

        // Se não encontrar na lista por categoria, tenta buscar direto pelo id (fallback: /produtos/:id)
        if (!product) {
            console.warn('Produto não encontrado na lista por categoria para id:', productIdRaw);
            try {
                const byIdRes = await fetch(`${API_URL}/produtos/${productId}`, { headers });
                if (byIdRes.ok) {
                    product = await byIdRes.json();
                    console.info('Produto carregado via /produtos/:id fallback');
                }
            } catch (e) {
                console.warn('Erro ao tentar buscar produto por id:', e);
            }
        }

        if (!product) {
            // Log IDs disponíveis para ajudar debug
            try {
                const availableIds = (productsData || []).map(p => p.id).slice(0, 50);
                console.info('IDs disponíveis na categoria (exemplo):', availableIds);
            } catch (e) { /* ignore */ }

            productContainer.innerHTML = `<h2>Produto não encontrado</h2><p>Verifique o produto selecionado.</p>`;
            return; // sem lançar, para não tentar renderizar preços
        }

        try { console.debug('comparar product imagem raw=', product.imagem, 'normalized=', getFullImage(product.imagem)); } catch (e) {}
        productContainer.innerHTML = `
            <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
            <h2>${product.nome}</h2>
        `;

        console.debug('supermarketsData (raw):', supermarketsData);
        const supermarketMap = new Map();
        (supermarketsData || []).forEach(store => {
            // normalize key as Number to avoid type mismatch with priceEntry.supermercado_id
            const possibleId = (store.id ?? store._id ?? store.empresaId ?? store.empresa_id ?? store.empresa) || store.id;
            const key = Number(possibleId);
            supermarketMap.set(key, { id: key, nome: store.nome || store.nomeFantasia || store.razaoSocial || store.nomeEmpresa, imagem: store.imagem || store.logo });
        });

        pricesContainer.innerHTML = '';
        console.debug('product.precos:', product.precos);
        (product.precos || [])
            .sort((a, b) => a.preco - b.preco)
            .forEach(priceEntry => {
                const lookupId = Number(priceEntry.supermercado_id);
                const storeDetails = supermarketMap.get(lookupId);
                if (!storeDetails) {
                    console.warn('storeDetails not found for supermercado_id:', priceEntry.supermercado_id, 'lookupId:', lookupId);
                }
                if (storeDetails) {
                    const priceCard = document.createElement('div');
                    priceCard.className = 'price-card';
                    try { console.debug('store id=', storeDetails.id, 'imagem raw=', storeDetails.imagem, 'normalized=', getFullImage(storeDetails.imagem)); } catch (e) {}
                    priceCard.innerHTML = `
                        <img src="${getFullImage(storeDetails.imagem)}" alt="${storeDetails.nome}">
                        <div class="store-info">
                            <h3>${storeDetails.nome}</h3>
                        </div>
                        <div class="price-info">
                            R$ ${priceEntry.preco.toFixed(2).replace('.', ',')}
                        </div>
                    `;
                    priceCard.addEventListener('click', () => {
                        openActionModal(product, storeDetails, priceEntry.preco);
                    });
                    pricesContainer.appendChild(priceCard);
                }
            });

    } catch (error) {
        console.error('Erro ao carregar dados para comparação:', error);
        document.body.innerHTML = '<h1>Erro ao carregar os dados do produto.</h1>';
    }

    function openActionModal(product, store, price) {
        const actionBody = document.getElementById('action-modal-body');
        if (actionBody) {
            actionBody.innerHTML = `
                <img src="${getFullImage(product.imagem)}" alt="${product.nome}">
                <div>
                    <p>Adicionar <strong>${product.nome}</strong></p>
                    <p>do <strong>${store.nome}</strong></p>
                    <p>por <strong>R$ ${price.toFixed(2).replace('.', ',')}</strong>?</p>
                </div>
            `;
        }

        const confirmBtn = document.getElementById('action-modal-confirm');
        if (confirmBtn && confirmBtn.parentNode) {
            // Remove listener antigo para evitar múltiplos cliques
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            newConfirmBtn.addEventListener('click', () => {
                addToCart(product, store);
                actionModal.classList.add('hidden');
            });
        } else {
            // fallback: cria um botão temporário
            const tmpBtn = document.createElement('button');
            tmpBtn.textContent = 'Adicionar';
            tmpBtn.addEventListener('click', () => {
                addToCart(product, store);
                actionModal.classList.add('hidden');
            });
            actionBody && actionBody.appendChild(tmpBtn);
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
});