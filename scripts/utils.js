const API_URL = 'https://tcc-senai-tawny.vercel.app';

const getAuthToken = () => localStorage.getItem('authToken');

const formatPrice = (price) => {
    // Garante que o valor é um número antes de formatar
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numericPrice);
};

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

/**
 * Realiza um fetch com o token de autenticação (JWT)
 * Se a API retornar 401, redireciona o usuário para a página de login.
 * @param {string} endpoint - O caminho da API (ex: '/produtos').
 * @param {object} options - Opções de fetch.
 * @returns {Promise<any>} Os dados JSON da API em caso de sucesso.
 */
const authFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        throw new Error('Usuário não autenticado.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    // === CORREÇÃO CRUCIAL: PEGAR O JSON EM CASO DE SUCESSO (200-299) ===
    if (response.ok) {
        try {
            // Tenta retornar o corpo como JSON
            return await response.json();
        } catch (e) {
            // Caso a resposta seja OK, mas não tenha corpo (ex: 204 No Content)
            return null;
        }
    }
    // ==================================================================

    // Se não for OK e nem 401, trata o erro
    const errorText = await response.text().catch(() => 'Erro sem corpo de resposta.');
    let errorMessage = `Erro na requisição: ${response.status} - ${errorText}`;
    throw new Error(errorMessage);
};