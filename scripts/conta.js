document.addEventListener('DOMContentLoaded', () => {
    const addressModal = document.getElementById('address-modal');
    const addAddressBtn = document.getElementById('add-new-address-btn');
    const closeAddressModalBtn = document.getElementById('close-address-modal');
    const addressForm = document.getElementById('address-form');
    const addressListDiv = document.getElementById('address-list');
    const modalTitle = document.getElementById('modal-title');
    const addressIdInput = document.getElementById('address-id');
    const editDataBtn = document.getElementById('edit-data-btn');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const zipcode_input = document.getElementById('zipcode');
    const logoutButton = document.querySelector('.action-btn-danger');

    let addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    let selectedAddressId = localStorage.getItem('selectedAddressId') || null;
    let isEditingData = false;

    if (!addressForm || !addressListDiv || !nameInput || !emailInput) {
        return;
    }
    
    // Funções de máscara (maskCEP) vêm de utils.js
    if (zipcode_input) zipcode_input.addEventListener('input', (e) => {
        e.target.value = maskCEP(e.target.value);
    });

    const loadUserData = () => {
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        if (userName) nameInput.value = userName;
        if (userEmail) emailInput.value = userEmail;
    };

    const renderAddresses = () => {
        addressListDiv.innerHTML = '';

        if (addresses.length === 0) {
            addressListDiv.innerHTML = '<p>Nenhum endereço cadastrado.</p>';
            return;
        }

        if (!selectedAddressId && addresses.length > 0) {
            selectedAddressId = addresses[0].id;
            localStorage.setItem('selectedAddressId', selectedAddressId);
        }

        addresses.forEach(address => {
            const isSelected = address.id == selectedAddressId;
            const addressItem = document.createElement('div');
            addressItem.className = `address-item ${isSelected ? 'selected' : ''}`;
            addressItem.innerHTML = `
                <div class="address-details">
                    <p class="address-line">${address.street}, ${address.number} (${address.complement || 'S/C'})</p>
                    <p class="address-line">${address.neighborhood}, ${address.city} - ${address.state}</p>
                    <p class="address-line">${maskCEP(address.zipcode)}</p>
                </div>
                <div class="address-actions">
                    <button class="select-btn" data-id="${address.id}" ${isSelected ? 'disabled' : ''}>${isSelected ? 'Selecionado' : 'Selecionar'}</button>
                    <button class="edit-btn" data-id="${address.id}">Editar</button>
                    <button class="delete-btn" data-id="${address.id}">Excluir</button>
                </div>
            `;
            addressListDiv.appendChild(addressItem);
        });

        addressListDiv.querySelectorAll('.select-btn').forEach(btn => btn.addEventListener('click', (e) => {
            selectedAddressId = e.target.dataset.id;
            localStorage.setItem('selectedAddressId', selectedAddressId);
            renderAddresses();
            // 'updateCartUI' agora é a função global de cart-logic.js
            if (typeof updateCartUI === 'function') updateCartUI(); 
        }));
        
        addressListDiv.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const address = addresses.find(a => a.id === id);
            if (address) openModal(address);
        }));

        addressListDiv.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (confirm('Tem certeza que deseja excluir este endereço?')) {
                addresses = addresses.filter(a => a.id !== id);
                if (selectedAddressId == id) {
                    selectedAddressId = addresses.length > 0 ? addresses[0].id : null;
                    localStorage.removeItem('selectedAddressId');
                    if (selectedAddressId) localStorage.setItem('selectedAddressId', selectedAddressId);
                }
                localStorage.setItem('userAddresses', JSON.stringify(addresses));
                renderAddresses();
                // 'updateCartUI' agora é a função global de cart-logic.js
                if (typeof updateCartUI === 'function') updateCartUI();
            }
        }));
    };

    const openModal = (address = null) => {
        if (!addressModal) return;
        addressForm.reset();
        addressIdInput.value = '';
        modalTitle.textContent = 'Adicionar Novo Endereço';
        
        if (address) {
            modalTitle.textContent = 'Editar Endereço';
            addressIdInput.value = address.id;
            document.getElementById('zipcode').value = maskCEP(address.zipcode); // maskCEP de utils.js
            document.getElementById('street').value = address.street;
            document.getElementById('number').value = address.number;
            document.getElementById('complement').value = address.complement;
            document.getElementById('neighborhood').value = address.neighborhood;
            document.getElementById('city').value = address.city;
            document.getElementById('state').value = address.state;
        }
        addressModal.classList.remove('hidden');
    };

    const closeModal = () => {
        if (addressModal) addressModal.classList.add('hidden');
    };

    const fetchAddressFromCEP = async (cep) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        try {
            // Usando fetch nativo, não 'authFetch', pois é uma API pública
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                document.getElementById('street').value = data.logradouro;
                document.getElementById('neighborhood').value = data.bairro;
                document.getElementById('city').value = data.localidade;
                document.getElementById('state').value = data.uf;
                document.getElementById('number').focus();
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            alert('Não foi possível buscar o CEP.');
        }
    };

    const saveAddress = (event) => {
        event.preventDefault();
        
        const id = addressIdInput.value ? parseInt(addressIdInput.value) : Date.now();
        const zipcode = document.getElementById('zipcode').value.replace(/\D/g, '');
        const street = document.getElementById('street').value.trim();
        const number = document.getElementById('number').value.trim();
        const complement = document.getElementById('complement').value.trim();
        const neighborhood = document.getElementById('neighborhood').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        
        if (!zipcode || !street || !number || !neighborhood || !city || !state) {
            alert('Preencha todos os campos obrigatórios do endereço.');
            return;
        }

        const newAddress = { id, zipcode, street, number, complement, neighborhood, city, state };
        
        const existingIndex = addresses.findIndex(a => a.id === id);
        
        if (existingIndex > -1) {
            addresses[existingIndex] = newAddress;
        } else {
            addresses.push(newAddress);
            if (addresses.length === 1) { 
                selectedAddressId = id;
                localStorage.setItem('selectedAddressId', selectedAddressId);
            }
        }
        
        localStorage.setItem('userAddresses', JSON.stringify(addresses));
        renderAddresses();
        closeModal();
        // 'updateCartUI' agora é a função global de cart-logic.js
        if (typeof updateCartUI === 'function') updateCartUI();
    };

    const toggleEditData = async () => {
        isEditingData = !isEditingData;
        nameInput.disabled = !isEditingData;
        emailInput.disabled = !isEditingData;
        
        if (isEditingData) {
            editDataBtn.textContent = 'Salvar Dados';
            nameInput.focus();
        } else {
            editDataBtn.textContent = 'Editar Dados';
            
            const newName = nameInput.value.trim();
            const newEmail = emailInput.value.trim();

            if (newName && newEmail) {
                try {
                    const user = JSON.parse(localStorage.getItem('user'));
                    const userId = user ? user.id : null;
                    if (!userId) {
                        // 'showFeedback' de utils.js
                        showFeedback('Erro: ID do usuário não encontrado. Faça login novamente.', 'error');
                        return;
                    }
                    
                    // 'authFetch' de utils.js
                    const response = await authFetch(`clientes/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ nome: newName, email: newEmail })
                    });
                    
                    if (response.ok) {
                        localStorage.setItem('userName', newName);
                        localStorage.setItem('userEmail', newEmail);
                        showFeedback('Dados atualizados com sucesso!');
                    } else {
                        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar dados.' }));
                        showFeedback(errorData.message || 'Erro ao salvar dados.', 'error');
                        loadUserData(); 
                    }
                } catch (error) {
                    showFeedback('Não foi possível conectar ao servidor para salvar os dados.', 'error');
                    loadUserData(); 
                }
            } else {
                showFeedback('Nome e Email são obrigatórios.', 'error');
                loadUserData(); 
            }
        }
    };

    if (logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
    
    if (addAddressBtn) addAddressBtn.addEventListener('click', () => openModal());
    if (closeAddressModalBtn) closeAddressModalBtn.addEventListener('click', closeModal);
    if (addressForm) addressForm.addEventListener('submit', saveAddress);
    if (editDataBtn) editDataBtn.addEventListener('click', toggleEditData);
    if (zipcode_input) zipcode_input.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));

    loadUserData();
    renderAddresses();
});