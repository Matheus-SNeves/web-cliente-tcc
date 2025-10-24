// scripts/utils.js

const API_URL = 'https://tcc-senai-tawny.vercel.app';

const getFullImage = (src) => {
    const placeholder = 'https://via.placeholder.com/100?text=Sem+Imagem';
    if (!src) return placeholder;
    try {
        if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) return src;
        if (/^\/\//.test(src)) return window.location.protocol + src;
        // Garante que o API_URL não tenha barra dupla com o src
        if (src.startsWith('/')) return API_URL.replace(/\/$/, '') + src; 
        return API_URL.replace(/\/$/, '') + '/' + src.replace(/^\//, '');
    } catch (e) {
        return placeholder;
    }
};

const mask = (value, pattern) => {
    let i = 0;
    const v = value.toString().replace(/\D/g, '');
    return pattern.replace(/#/g, () => v[i++] || '');
};

const maskCPF = (value) => mask(value, '###.###.###-##');

const maskPhone = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 10) return mask(cleanValue, '(##) #####-####');
    return mask(cleanValue, '(##) ####-####');
};

const maskCardNumber = (value) => mask(value, '#### #### #### ####');

// Função de fetch com autenticação e tratamento de erro 401/403
const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // CRÍTICO: Concatenação correta: API_URL / endpoint
    const url = `${API_URL}/${endpoint}`; 
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('user');
            // Redireciona para login em caso de token inválido
            window.location.href = 'login.html'; 
            throw new Error('Unauthorized'); 
        }

        return response;

    } catch (error) {
        console.error('Erro de conexão em authFetch:', error);
        throw error;
    }
};

const showFeedback = (message, type = 'success') => {
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.innerHTML = `
        .feedback-popup {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 5000;
            font-size: 14px;
            animation: fadeInOut 2.5s forwards;
            min-width: 250px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .feedback-popup.success {
            background-color: #4CAF50;
        }
        .feedback-popup.error {
            background-color: #F44336;
        }
        @keyframes fadeInOut {
            0% { opacity: 0; bottom: 0px; }
            20% { opacity: 1; bottom: 20px; }
            80% { opacity: 1; bottom: 20px; }
            100% { opacity: 0; bottom: 40px; }
        }
        `;
        document.head.appendChild(style);
    }

    const popup = document.createElement('div');
    popup.className = `feedback-popup ${type}`;
    popup.textContent = message;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 2500);
};