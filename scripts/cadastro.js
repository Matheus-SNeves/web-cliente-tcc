const nomeInput = document.getElementById('nome');
const cpfInput = document.getElementById('cpf');
const telefoneInput = document.getElementById('telefone'); 
const emailInput = document.getElementById('email');       
const senhaInput = document.getElementById('senha');
const btnCadastrar = document.getElementById('cadastro'); 
const displayErro = document.querySelector('.display');

const exibirErro = (mensagem) => {
    displayErro.textContent = mensagem;
    setTimeout(() => {
        displayErro.textContent = '';
    }, 5000);
};

// Funções maskCPF e maskPhone são globais de utils.js
if (cpfInput) cpfInput.addEventListener('input', (e) => {
    e.target.value = maskCPF(e.target.value);
});

if (telefoneInput) telefoneInput.addEventListener('input', (e) => {
    e.target.value = maskPhone(e.target.value);
});


if (btnCadastrar) btnCadastrar.addEventListener('click', async (event) => {
    event.preventDefault();

    const nome = nomeInput.value;
    const cpf = cpfInput.value.replace(/\D/g, ''); 
    const telefone = telefoneInput.value.replace(/\D/g, '');
    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!nome || !cpf || !telefone || !email || !senha) {
        exibirErro('Preencha todos os campos corretamente');
        return;
    }
    
    if (cpf.length !== 11) {
        exibirErro('ERRO: CPF inválido. Deve conter 11 dígitos.');
        return;
    }

    try {
        // API_URL é global de utils.js
        const response = await fetch(`${API_URL}/cadastro-cliente`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, cpf, telefone, email, senha}) 
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Usuário ${data.nome} cadastrado com sucesso!`);
            window.location.href = 'login.html';

        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            exibirErro(errorData.message || 'ERRO: Falha ao cadastrar. Verifique os dados.');
        }

    } catch (error) {
        console.error('ERRO de Conexão:', error);
        exibirErro('ERRO: Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    }
});