document.addEventListener('DOMContentLoaded', () => {
    const loginInput = document.getElementById('login');
    const senhaInput = document.getElementById('senha');
    const entrarBtn = document.getElementById('entrar');
    const mensagemErro = document.querySelector('.display');

    const exibirErro = (mensagem) => {
        if (mensagemErro) mensagemErro.textContent = mensagem;
        setTimeout(() => {
            if (mensagemErro) mensagemErro.textContent = '';
        }, 5000);
    };

    if (entrarBtn) entrarBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        const email = loginInput.value;
        const senha = senhaInput.value;

        if (!email || !senha) {
            exibirErro('Preencha o login e a senha.');
            return;
        }

        try {
            // API_URL agora é global, vindo de utils.js (que deve ser carregado no HTML)
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            if (response.ok) {
                const data = await response.json();
                
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userName', data.usuario.nome);
                localStorage.setItem('userEmail', data.usuario.email);
                localStorage.setItem('user', JSON.stringify(data.usuario));
                
                window.location.href = 'home.html';
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Credenciais inválidas' }));
                exibirErro(errorData.message || 'ERRO: Credenciais inválidas.');
            }
        } catch (error) {
            console.error('Erro de Conexão:', error);
            exibirErro('ERRO: Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        }
    });
});