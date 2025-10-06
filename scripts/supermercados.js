document.addEventListener('DOMContentLoaded', async () => {
    const container = document.querySelector('.supermarkets-container');
    const genericModalOverlay = document.getElementById('generic-modal-overlay');
    let allData = {};

    // Mantém a mesma URL usada em home.js
    const API_URL = 'https://tcc-senai-tawny.vercel.app';

    // Helper: normaliza src de imagem — aceita URLs absolutos ou caminhos relativos retornados pela API
    const getFullImage = (src) => {
        const placeholder = 'https://via.placeholder.com/100?text=Sem+Imagem';
        if (!src) return placeholder;
        try {
            if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) return src;
            if (/^\/\//.test(src)) return window.location.protocol + src;
            // caminho relativo vindo do backend, por exemplo '/uploads/..' -> prefixar com API_URL
            if (src.startsWith('/')) return API_URL.replace(/\/$/, '') + src;
            // outros caminhos (ex: 'uploads/..')
            return API_URL.replace(/\/$/, '') + '/' + src.replace(/^\//, '');
        } catch (e) {
            return placeholder;
        }
    };

    // Verifica autenticação (mesma lógica do home.js)
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        // Busca empresas (supermercados) com header de auth
        const empresasRes = await fetch(`${API_URL}/empresas`, { headers });

        // Verifica /empresas primeiro; se der erro, tratar (401/403 => limpar token e redirecionar)
        if (!empresasRes.ok) {
            if (empresasRes.status === 401 || empresasRes.status === 403) {
                console.warn('Token inválido ou sem permissão ao buscar /empresas, redirecionando para login. Status:', empresasRes.status);
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                return;
            }
            const empBody = await empresasRes.text().catch(() => '');
            console.error('Erro ao buscar /empresas', { status: empresasRes.status, body: empBody });
            throw new Error('Erro ao buscar supermercados. Verifique o console para detalhes.');
        }

        // Tenta buscar categorias com header (alguns servidores exigem auth, outros não).
        // Se retornar 404 (rota não encontrada) ou outro erro específico, tentamos sem header como fallback.
        let categoriasRes = await fetch(`${API_URL}/categorias`, { headers });
        if (categoriasRes.status === 404) {
            console.warn('/categorias retornou 404 com header; tentando sem Authorization (fallback público).');
            try {
                const categoriasPublic = await fetch(`${API_URL}/categorias`);
                categoriasRes = categoriasPublic;
            } catch (e) {
                console.error('Falha ao tentar buscar /categorias sem header:', e);
            }
        }

        // Se /categorias não estiver OK, não tentamos fallback local; apenas usamos array vazio
        let categoriesFromMock = false;
        if (!categoriasRes.ok) {
            console.warn('/categorias não disponível (status:', categoriasRes.status, '), sem fallback local');
            allData.categorias = [];
        }

        // Parse seguro da resposta de /empresas
        try {
            allData.supermercados = await empresasRes.json();
        } catch (e) {
            console.error('Falha ao parsear JSON de /empresas:', e);
            allData.supermercados = [];
        }

        // Se categorias não vieram do mock e o fetch foi OK, parsear normalmente
        if (!categoriesFromMock) {
            try {
                allData.categorias = categoriasRes.ok ? await categoriasRes.json() : [];
            } catch (e) {
                console.error('Falha ao parsear JSON de /categorias:', e);
                allData.categorias = [];
            }
        }

        if (!allData.supermercados || allData.supermercados.length === 0) {
            container.innerHTML = '<p>Nenhum supermercado encontrado.</p>';
            return;
        }

        // Normaliza campos (img / imagem, endereco / address) e monta o HTML
        container.innerHTML = allData.supermercados.map(store => {
            const imgSrcRaw = store.img || store.imagem || null;
            try { console.debug('supermercado id=', store.id, 'imagem raw=', imgSrcRaw, 'normalized=', getFullImage(imgSrcRaw)); } catch (e) {}
            const imgSrc = getFullImage(imgSrcRaw);
            const nome = store.nome || store.name || 'Supermercado';
            const endereco = store.endereco || store.address || '';
            return `
            <div class="store-item" data-store-id="${store.id}">
                <img src="${imgSrc}" alt="${nome}">
                <div class="store-info">
                    <h3>${nome}</h3>
                    <p>${endereco}</p>
                </div>
            </div>`;
        }).join('');

        // Delegação de evento para abrir modal da loja
        container.querySelectorAll('.store-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const storeId = parseInt(e.currentTarget.dataset.storeId);
                showStoreCategoriesModal(storeId);
            });
        });

    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
        container.innerHTML = '<p>Não foi possível carregar os supermercados. Faça login novamente.</p>';
    }

    const showStoreCategoriesModal = (storeId) => {
        const store = (allData.supermercados || []).find(s => s.id === storeId);
        if (!store) return;

    const storeImg = getFullImage(store.img || store.imagem || null);
    try { console.debug('modal store id=', store.id, 'imagem raw=', store.img || store.imagem, 'normalized=', storeImg); } catch (e) {}
        const storeName = store.nome || store.name || 'Supermercado';

        genericModalOverlay.classList.remove('hidden');
        genericModalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <img src="${storeImg}" alt="${storeName}" class="modal-logo">
                    <h2 class="modal-title">${storeName}</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-categories">
                        ${ (allData.categorias || []).map(cat => {
                            const catKey = cat.chave || cat.key || (cat.nome ? cat.nome.toLowerCase() : '');
                            const catImg = getFullImage(cat.imagem || cat.img || null);
                            try { console.debug('categoria=', cat.nome || cat.chave, 'imagem raw=', cat.imagem || cat.img, 'normalized=', catImg); } catch (e) {}
                            const catNome = cat.nome || cat.name || catKey;
                            return `
                            <div class="card-item" onclick="window.location.href='produtos.html?category=${catKey}&storeId=${store.id}'">
                                <img src="${catImg}" alt="${catNome}">
                                <h3>${catNome}</h3>
                            </div>`;
                        }).join('') }
                    </div>
                </div>
            </div>`;

        const closeBtn = genericModalOverlay.querySelector('.close-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => genericModalOverlay.classList.add('hidden'));
    };
});