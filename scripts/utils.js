const API_URL = 'https://tcc-senai-tawny.vercel.app';

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
const maskCardExpiry = (value) => mask(value, '##/##');
const maskCVV = (value) => mask(value, '###');
const maskCEP = (value) => mask(value, '#####-###');

const authFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            alert('Sessão expirada ou acesso negado. Faça login novamente.');
            const currentPage = window.location.pathname.split('/').pop();
            const redirectTo = (currentPage === 'login.html' || currentPage === 'cadastro.html') ? 'index.html' : 'login.html';
            window.location.href = redirectTo; 
            throw new Error('Unauthorized');
        }

        return response;
    } catch (error) {
        console.error('Erro em authFetch:', error);
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
            100% { opacity: 0; bottom: 0px; }
        }`;
        document.head.appendChild(style);
    }

    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `feedback-popup ${type}`;
    feedbackDiv.textContent = message;

    document.body.appendChild(feedbackDiv);

    setTimeout(() => {
        feedbackDiv.remove();
    }, 2500);
};