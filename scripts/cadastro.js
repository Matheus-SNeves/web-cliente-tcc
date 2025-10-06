const nomeInput = document.getElementById('nome');
const cpfInput = document.getElementById('cpf');
const telefoneInput = document.getElementById('telefone'); 
const emailInput = document.getElementById('email');       
const senhaInput = document.getElementById('senha');
const btnCadastrar = document.getElementById('cadastro'); 
const displayErro = document.querySelector('.display');

btnCadastrar.addEventListener('click', async (event) => {
    event.preventDefault();

    const nome = nomeInput.value;
    const cpf = cpfInput.value;
    const telefone = telefoneInput.value; // Valor do telefone
    const email = emailInput.value;
    const senha = senhaInput.value;

    if (!nome || !cpf || !telefone || !email || !senha) {
        exibirErro('Preencha todos os campos corretamente');
        return;
    }
        console.log({ nome, cpf, telefone, email, senha });


    try {
        const response = await fetch('https://tcc-senai-tawny.vercel.app/cadastro-cliente', {
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
            const errorData = await response.json();
            exibirErro(errorData.message || 'ERRO: Falha ao cadastrar. Verifique os dados.');
        }
        if (cpf != 14){
            exibirErro('ERRO: CPF inválido. Deve conter 14 dígitos.');
        }


    } catch (error) {
        exibirErro('ERRO: Não foi possível conectar ao servidor para realizar o cadastro.');
    }
});

function exibirErro(mensagem) {
    if (displayErro) {
        displayErro.textContent = mensagem;
        displayErro.style.color = 'red';
    }
}