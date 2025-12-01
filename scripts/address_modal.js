// scripts/address_modal.js

// Assume que API_URL está definido em config.js e é global
// Assume que a máscara de CEP (maskCEP) pode ser importada ou implementada
const VIACEP_URL = 'https://viacep.com.br/ws/';

// --- Elementos Comuns ---
const addressModal = document.getElementById('address-modal');
const addressLink = document.getElementById('address-link');
const closeAddressModalBtn = document.getElementById('close-address-modal-btn');
const addressErrorMessage = document.getElementById('address-error-message');

// --- Elementos de Exibição de Endereço Atual ---
const currentAddressDisplay = document.getElementById('current-address-display');
const addrRuaCidade = document.getElementById('addr-rua-cidade');
const addrCep = document.getElementById('addr-cep');
const addrComplemento = document.getElementById('addr-complemento');
const changeAddressBtn = document.getElementById('change-address-btn');

// --- Elementos do Formulário de Troca ---
const addressForm = document.getElementById('address-form');
const cepInput = document.getElementById('cep-input');
const searchCepBtn = document.getElementById('search-cep-btn');
const ruaInput = document.getElementById('rua-input');
const numeroInput = document.getElementById('numero-input');
const complementoInput = document.getElementById('complemento-input');
const bairroInput = document.getElementById('bairro-input');
const cidadeInput = document.getElementById('cidade-input');
const estadoInput = document.getElementById('estado-input');
const cancelChangeBtn = document.getElementById('cancel-address-change-btn');


// --- Variáveis de Endereço ---
const ENDERECO_MOCK_DEFAULT = {
    cep: "01001-000",
    rua: "Av. Paulista",
    numero: "1230",
    complemento: "Apto 101",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP"
};

// ----------------------------------------------------
// 1. FUNÇÕES DE UTILIDADE E ESTADO
// ----------------------------------------------------

function exibirErro(mensagem) {
    if (addressErrorMessage) {
        addressErrorMessage.textContent = mensagem;
        addressErrorMessage.classList.remove('hidden');
    }
    setTimeout(() => {
        if (addressErrorMessage) addressErrorMessage.classList.add('hidden');
    }, 5000);
}

function loadSavedAddress() {
    // Tenta carregar o endereço do localStorage
    const savedAddressJson = localStorage.getItem('userAddressData');
    if (savedAddressJson) {
        return JSON.parse(savedAddressJson);
    }
    
    // Se não houver, retorna um mock (ou null se preferir)
    return ENDERECO_MOCK_DEFAULT; 
}

function saveAddress(addressData) {
    localStorage.setItem('userAddressData', JSON.stringify(addressData));
    updateLocationDisplay(addressData);
}

function updateLocationDisplay(addressData = null) {
    const userLocationElement = document.getElementById('user-location');
    if (!userLocationElement) return;

    if (!addressData) {
        addressData = loadSavedAddress();
    }
    
    if (addressData) {
        // Exibe um resumo no cabeçalho
        userLocationElement.textContent = `${addressData.rua}, ${addressData.numero} - ${addressData.cidade}`;
        
        // Atualiza o display no modal
        if (addrRuaCidade) addrRuaCidade.textContent = `${addressData.rua}, ${addressData.numero} - ${addressData.bairro}, ${addressData.cidade}/${addressData.estado}`;
        if (addrCep) addrCep.textContent = `CEP: ${addressData.cep}`;
        if (addrComplemento) {
            addrComplemento.textContent = addressData.complemento ? `Complemento: ${addressData.complemento}` : '';
            addrComplemento.classList.toggle('hidden', !addressData.complemento);
        }

    } else {
        userLocationElement.textContent = 'Adicionar Endereço';
        if (addrRuaCidade) addrRuaCidade.textContent = 'Nenhum endereço cadastrado.';
        if (addrCep) addrCep.textContent = '';
    }
}

// Alterna entre a visualização de endereço e o formulário de troca
function toggleFormView(showForm) {
    if (!currentAddressDisplay || !addressForm) return;

    if (showForm) {
        currentAddressDisplay.classList.add('hidden');
        addressForm.classList.remove('hidden');
    } else {
        currentAddressDisplay.classList.remove('hidden');
        addressForm.classList.add('hidden');
        // Limpa o formulário ao voltar
        addressForm.reset(); 
    }
}

// ----------------------------------------------------
// 2. FUNÇÕES DO VIACEP
// ----------------------------------------------------

// Máscara simples para CEP (apenas dígitos e formatação)
function maskCEP(value) {
    value = value.replace(/\D/g, ""); // Remove tudo que não for dígito
    value = value.replace(/^(\d{5})(\d)/, "$1-$2"); // Coloca o hífen
    return value;
}

async function searchCepHandler() {
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        exibirErro('CEP inválido. Deve conter 8 dígitos.');
        return;
    }
    
    // Limpar campos que serão preenchidos
    ruaInput.value = '';
    bairroInput.value = '';
    cidadeInput.value = '';
    estadoInput.value = '';
    
    exibirErro('Buscando CEP...');

    try {
        const response = await fetch(`${VIACEP_URL}${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            exibirErro('CEP não encontrado. Preencha os campos manualmente.');
            return;
        }

        exibirErro(''); // Limpa a mensagem
        
        // Preenche os campos
        ruaInput.value = data.logradouro || '';
        bairroInput.value = data.bairro || '';
        cidadeInput.value = data.localidade || '';
        estadoInput.value = data.uf || '';
        
        // Foca no campo de número
        numeroInput.focus();

    } catch (error) {
        console.error('Erro ao buscar ViaCEP:', error);
        exibirErro('Erro na conexão com o serviço de CEP.');
    }
}


// ----------------------------------------------------
// 3. FUNÇÕES DO MODAL
// ----------------------------------------------------

function openAddressModal() {
    if (!addressModal) return;
    updateLocationDisplay(); // Garante que o display atual está correto
    toggleFormView(false); // Sempre começa mostrando o endereço atual
    addressModal.classList.remove('hidden');
}

function closeAddressModal() {
    if (!addressModal) return;
    addressModal.classList.add('hidden');
    addressForm.reset();
}

function handleAddressFormSubmit(event) {
    event.preventDefault();
    
    // 1. Coletar dados
    const newAddressData = {
        cep: cepInput.value.trim(),
        rua: ruaInput.value.trim(),
        numero: numeroInput.value.trim(),
        complemento: complementoInput.value.trim(),
        bairro: bairroInput.value.trim(),
        cidade: cidadeInput.value.trim(),
        estado: estadoInput.value.trim(),
    };
    
    if (!newAddressData.rua || !newAddressData.numero || !newAddressData.cidade) {
        exibirErro('Preencha os campos obrigatórios (CEP, Rua, Número, Cidade, Estado).');
        return;
    }
    
    // 2. Salvar no localStorage
    saveAddress(newAddressData);

    // 3. (Opcional) Enviar para API de Perfil aqui
    // Ex: sendAddressToAPI(newAddressData); 

    // 4. Fechar e confirmar
    alert('Endereço atualizado com sucesso!');
    closeAddressModal();
}


// ----------------------------------------------------
// 4. INICIALIZAÇÃO E LISTENERS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inicializa o display do endereço no header
    updateLocationDisplay(); 
    
    // 2. Listeners do Modal
    if (addressLink) addressLink.addEventListener('click', (e) => {
        e.preventDefault();
        openAddressModal();
    });
    
    if (closeAddressModalBtn) closeAddressModalBtn.addEventListener('click', closeAddressModal);
    
    if (addressModal) {
        addressModal.addEventListener('click', (e) => {
            if (e.target === addressModal) {
                closeAddressModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !addressModal.classList.contains('hidden')) {
                closeAddressModal();
            }
        });
    }

    // 3. Listeners de Troca de Endereço (Modal)
    if (changeAddressBtn) changeAddressBtn.addEventListener('click', () => toggleFormView(true));
    if (cancelChangeBtn) cancelChangeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleFormView(false);
    });

    // 4. Listeners do Formulário de Troca (ViaCEP)
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            e.target.value = maskCEP(e.target.value);
        });
        // Busca CEP automaticamente quando 8 dígitos são digitados
        cepInput.addEventListener('keyup', (e) => {
            if (e.target.value.replace(/\D/g, '').length === 8) {
                searchCepHandler();
            }
        });
    }
    
    if (searchCepBtn) searchCepBtn.addEventListener('click', searchCepHandler);
    if (addressForm) addressForm.addEventListener('submit', handleAddressFormSubmit);
});