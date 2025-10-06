const emailInput = document.getElementById('login');
const senhaInput = document.getElementById('senha');
const btnEntrar = document.getElementById('entrar');
const displayErro = document.querySelector('.display');

btnEntrar.addEventListener('click', async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!email || !senha) {
        exibirErro('Preencha o e-mail e a senha para continuar.');
        return;
    }

    try {
        const response = await fetch('https://tcc-senai-tawny.vercel.app/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            const data = await response.json();
            const token = data.token;

            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', data.usuario.role); 
            
            alert(`Login de ${data.usuario.nome} funcionou!`);
            
            window.location.href = 'home.html';

        } else {
            const errorData = await response.json();
            exibirErro(errorData.message || 'ERRO: E-mail ou Senha incorretos.');
        }
    } catch (error) {
        exibirErro('ERRO: Não foi possível conectar ao servidor.');
    }
});

function exibirErro(mensagem) {
    if (displayErro) {
        displayErro.textContent = mensagem;
        displayErro.style.color = 'red';
    }
}   