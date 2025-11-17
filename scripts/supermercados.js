// Clean, focused supermercado page script
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const storesGrid = document.querySelector('.stores-grid');
    const categoriesStrip = document.getElementById('container-supermercado-categorias');
    const productsGrid = document.getElementById('container-supermercado-produtos');
    const marketNameEl = document.getElementById('detail-market-name');

    const makeKey = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]/g, '');
    // No-op debug function to avoid runtime errors in production
    const updateDebug = () => {};

    // Render marketplace list
    async function renderMarketList() {
        try {
            const marketsRes = await authFetch('/empresas');
            const markets = Array.isArray(marketsRes) ? marketsRes : (marketsRes && marketsRes.empresas) ? marketsRes.empresas : [];
            // if API returned no markets, try local mock `supermercados.json`
            if (!storesGrid) return;
            if (markets.length === 0) {
                try {
                    const mockRes = await fetch('../mockups/supermercados.json').then(r => r.json()).catch(() => null);
                    if (mockRes) {
                        const arr = mockRes.supermercado || mockRes.supermercados || Object.values(mockRes).find(v=>Array.isArray(v)) || [];
                        if (Array.isArray(arr) && arr.length>0) markets.push(...arr);
                    }
                } catch (e) { /* ignore */ }
            }
            if (markets.length === 0) {
                storesGrid.innerHTML = '<p class="empty-state">Nenhum supermercado disponível.</p>';
                return;
            }
            storesGrid.innerHTML = markets.map(m => {
                const nome = m.nome || m.name || 'Supermercado';
                const img = (typeof getFullImage === 'function') ? getFullImage(m.img || m.imagem || m.logo || '') : (m.img || m.imagem || '');
                const endereco = m.endereco || m.address || '';
                return `
                    <a href="supermercados.html?id=${m.id}" class="store-card">
                        <div class="store-card-inner">
                            <img src="${img}" alt="${nome}" class="store-thumb" onerror="this.onerror=null;this.src='https://placehold.co/200x80/0A3D62/FFFFFF?text=Mercado';">
                            <div class="store-meta">
                                <h3>${nome}</h3>
                                <p class="store-address">${endereco}</p>
                            </div>
                        </div>
                    </a>`;
            }).join('');
        } catch (e) {
            console.error('Erro ao carregar lista de supermercados:', e);
            if (storesGrid) storesGrid.innerHTML = '<p class="empty-state">Erro ao carregar supermercados.</p>';
        }
    }

    // Render detail view for a given market id
    async function renderMarketDetail(marketId) {
        try {
            // show/hide views
            listView.classList.add('hidden');
            detailView.classList.remove('hidden');

            const market = await authFetch(`/empresas/${marketId}`);
            const allProducts = await authFetch('/produtos') || [];

            // set market header (name only for now; count will be set after products are determined)
            const marketName = market.nome || market.name || 'Supermercado';
            if (marketNameEl) marketNameEl.textContent = marketName;

            // filter products belonging to this market
            const productsSource = Array.isArray(allProducts) ? allProducts : (allProducts.items || []);
            const products = [];

            productsSource.forEach(p => {
                // normalize possible id fields
                const candidates = [p.supermercado_id, p.empresaId, p.empresa_id, p.empresa, p.supermarket_id, p.supermarketId, p.empresaId].map(c => (c == null ? null : String(c)));
                let matched = candidates.includes(String(marketId));

                // if not matched yet, check 'precos' array (mockups use preco entries keyed by supermercado_id)
                if (!matched && Array.isArray(p.precos)) {
                    const found = p.precos.find(entry => {
                        const key = entry.supermercado_id ?? entry.empresa_id ?? entry.supermarket_id ?? entry.id ?? entry.supermercadoId;
                        return String(key) === String(marketId);
                    });
                    if (found) {
                        matched = true;
                        // store price for this market on the product object for rendering
                        p._priceForMarket = found.preco ?? found.preco_cheio ?? found.price ?? found.valor;
                    }
                }

                // If matched by id fields and there's a top-level preco, use it as fallback price
                if (matched && p._priceForMarket == null) {
                    p._priceForMarket = p.preco ?? p.price ?? p.preco_cheio ?? p.valor ?? null;
                }

                // Additional fallback: match by market name if still not matched
                if (!matched) {
                    const marketName = (market.nome || market.name || '').toString().toLowerCase();
                    const productMarketName = (p.supermercado_nome || p.empresa_nome || p.empresaNome || p.nome_mercado || p.mercado || '').toString().toLowerCase();
                    if (marketName && productMarketName && productMarketName.includes(marketName)) {
                        matched = true;
                        p._priceForMarket = p.preco ?? p.price ?? p._priceForMarket ?? null;
                    }
                }

                if (matched) products.push(p);
                // no-op: product preprocessing complete
            });

            // if API returned no products for this market, try local mockups as a second option
            if ((!products || products.length === 0)) {
                try {
                    const mockFiles = ['acougue.json','bebidas.json','frios.json','higiene.json','hortifruti.json','laticinios.json','limpeza.json','padaria.json'];
                    const mockPromises = mockFiles.map(f => fetch(`../mockups/${f}`).then(r => r.json()).catch(() => null));
                    const mockResults = await Promise.all(mockPromises);
                    const flattened = [];
                    mockResults.forEach(res => {
                        if (!res) return;
                        const arr = Object.values(res).find(v => Array.isArray(v));
                        if (Array.isArray(arr)) flattened.push(...arr);
                    });

                    const mockMatched = [];
                    flattened.forEach(p => {
                        let matched = false;
                        const candidates = [p.supermercado_id, p.empresaId, p.empresa_id, p.empresa, p.supermarket_id, p.supermarketId].map(c => (c==null?null:String(c)));
                        if (candidates.includes(String(marketId))) matched = true;
                        if (!matched && Array.isArray(p.precos)) {
                            const found = p.precos.find(entry => String(entry.supermercado_id) === String(marketId));
                            if (found) {
                                matched = true;
                                p._priceForMarket = found.preco ?? found.preco_cheio ?? found.price ?? found.valor ?? null;
                            }
                        }
                        if (matched) {
                            // ensure product has an id and nome fields consistent with API
                            mockMatched.push(p);
                        }
                    });

                    if (mockMatched.length > 0) {
                        // use mockMatched as products
                        products.splice(0, products.length, ...mockMatched);
                        console.warn('Nenhum produto da API; carregando produtos de mock local como fallback.');
                    }
                } catch (err) {
                    // ignore mock load errors silently
                }
            }

            // after product matching (and optional mock fallback) update header with product count
            if (marketNameEl) marketNameEl.textContent = `${marketName} · ${products.length} produto${products.length !== 1 ? 's' : ''}`;

            // categories

            const uniqueCats = [...new Set(products.map(p => p.categoria).filter(Boolean))];

            // Build category chips with a default 'Todos' option
            const chips = [];
            chips.push(`<button class="category-chip active" data-key="all">Todos</button>`);
            uniqueCats.forEach(c => {
                const key = makeKey(c);
                const name = c.charAt(0).toUpperCase() + c.slice(1);
                chips.push(`<button class="category-chip" data-key="${key}">${name}</button>`);
            });

            categoriesStrip.innerHTML = chips.join('') || '<p class="empty-state">Sem categorias</p>';

            // render products (all by default)
            renderProductsGrid(products);

            // attach category filter handlers
            categoriesStrip.querySelectorAll('.category-chip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const key = e.currentTarget.dataset.key;
                    // toggle active state
                    categoriesStrip.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');

                    if (key === 'all') {
                        renderProductsGrid(products);
                    } else {
                        const filtered = products.filter(p => makeKey(p.categoria) === key);
                        renderProductsGrid(filtered);
                    }
                });
            });

        } catch (e) {
            console.error('Erro ao carregar detalhe do mercado:', e);
            detailView.querySelector('.products-grid').innerHTML = '<p class="empty-state">Erro ao carregar produtos.</p>';
        }
    }

    function renderProductsGrid(products) {
        if (!productsGrid) return;
        if (!products || products.length === 0) {
            productsGrid.innerHTML = '<p class="empty-state">Nenhum produto encontrado nesta categoria.</p>';
            return;
        }
        productsGrid.innerHTML = products.map(p => {
            const img = (typeof getFullImage === 'function') ? getFullImage(p.img || p.imagem || '') : (p.img || p.imagem || '');
            const price = (p._priceForMarket != null) ? p._priceForMarket : ((p.preco != null) ? p.preco : (p.preco_cheio || 0));
            const cat = p.categoria ? (p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1)) : '';
            return `
                <div class="product-card">
                    <img src="${img}" alt="${p.nome}" onerror="this.onerror=null;this.src='https://placehold.co/180x180/F2E9D8/D92353?text=Produto';">
                    <div class="product-info">
                        <h4>${p.nome}</h4>
                        ${cat ? `<div class="product-subtitle">${cat}</div>` : ''}
                        <div class="product-row">
                            <span class="price">${typeof formatPrice === 'function' ? formatPrice(price) : 'R$ ' + Number(price).toFixed(2)}</span>
                            <a href="comparar.html?category=${encodeURIComponent(p.categoria||'')}&productId=${p.id}" class="compare-link">Comparar</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Initial routing
    if (id) {
        renderMarketDetail(id);
    } else {
        renderMarketList();
    }
});