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
    const userName = localStorage.getItem('userName');
    const zipcode_input = document.getElementById('zipcode');

    if (!addressForm || !addressListDiv) {
        console.error('Elementos de endereço não encontrados na página.');
        return;
    }

    let addresses = JSON.parse(localStorage.getItem('userAddresses')) || [];
    let selectedAddressId = localStorage.getItem('selectedAddressId') || null;
    let isEditingData = false;

    const logoutButton = document.querySelector('.action-btn-danger');
    if (logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAddresses');
        localStorage.removeItem('selectedAddressId');
        window.location.href = 'login.html';
    });
    
    
    if (userName && nameInput) {
        nameInput.value = userName;
    }

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
            addressItem.dataset.id = address.id;

            addressItem.innerHTML = `
                <input type="radio" name="selected-address" class="address-item-radio" ${isSelected ? 'checked' : ''}>
                <div class="address-item-content">
                    <p><strong>${address.street || ''}, ${address.number || ''}</strong></p>
                    <p>${address.neighborhood || ''}, ${address.city || ''} - ${address.state || ''}</p>
                    <p>${address.zipcode || ''}</p>
                </div>
                <div class="address-actions">
                    <button class="edit-btn"><i class="fa-solid fa-pencil"></i></button>
                    <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            addressListDiv.appendChild(addressItem);
        });

        addressListDiv.querySelectorAll('.address-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const action = e.target.closest('button');

                if (action?.classList.contains('edit-btn')) {
                    handleEditAddress(id);
                } else if (action?.classList.contains('delete-btn')) {
                    handleDeleteAddress(id);
                } else {
                    setSelectedAddress(id);
                }
            });
        });
    };

    const setSelectedAddress = (id) => {
        selectedAddressId = id;
        localStorage.setItem('selectedAddressId', id);
        renderAddresses();
    };

    const openModal = (address = null) => {
        addressForm.reset();
        if (address) {
            modalTitle.textContent = 'Editar Endereço';
            addressIdInput.value = address.id;
            document.getElementById('zipcode').value = address.zipcode;
            document.getElementById('street').value = address.street;
            document.getElementById('number').value = address.number;
            document.getElementById('complement').value = address.complement;
            document.getElementById('neighborhood').value = address.neighborhood;
            document.getElementById('city').value = address.city;
            document.getElementById('state').value = address.state;
        } else {
            modalTitle.textContent = 'Adicionar Endereço';
            addressIdInput.value = '';
        }
        addressModal.classList.remove('hidden');
    };

    const closeModal = () => {
        addressModal.classList.add('hidden');
    };

    const saveAddress = (e) => {
        e.preventDefault();
        const formData = new FormData(addressForm);
        const address = {
            id: addressIdInput.value || Date.now().toString(),
            zipcode: formData.get('zipcode'),
            street: formData.get('street'),
            number: formData.get('number'),
            complement: formData.get('complement'),
            neighborhood: formData.get('neighborhood'),
            city: formData.get('city'),
            state: formData.get('state'),
        };

        if (addressIdInput.value) {
            addresses = addresses.map(addr => addr.id == address.id ? address : addr);
        } else {
            addresses.push(address);
            setSelectedAddress(address.id);
        }

        localStorage.setItem('userAddresses', JSON.stringify(addresses));
        renderAddresses();
        closeModal();
    };

    const handleEditAddress = (id) => {
        const addressToEdit = addresses.find(addr => addr.id == id);
        openModal(addressToEdit);
    };

    const handleDeleteAddress = (id) => {
        if (confirm('Tem certeza que deseja excluir este endereço?')) {
            addresses = addresses.filter(addr => addr.id != id);
            if (selectedAddressId == id) {
                selectedAddressId = null;
                localStorage.removeItem('selectedAddressId');
            }
            localStorage.setItem('userAddresses', JSON.stringify(addresses));
            renderAddresses();
        }
    };

    const toggleEditData = () => {
        isEditingData = !isEditingData;
        nameInput.disabled = !isEditingData;
        emailInput.disabled = !isEditingData;
        editDataBtn.textContent = isEditingData ? 'Salvar Alterações' : 'Editar Dados';
        if (isEditingData) {
            nameInput.focus();
        }
    };

    const fetchAddressFromCEP = async (cep) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        try {
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

    

    if (addAddressBtn) addAddressBtn.addEventListener('click', () => openModal());
    if (closeAddressModalBtn) closeAddressModalBtn.addEventListener('click', closeModal);
    if (addressForm) addressForm.addEventListener('submit', saveAddress);
    if (editDataBtn) editDataBtn.addEventListener('click', toggleEditData);
    if (zipcode_input) zipcode_input.addEventListener('blur', (e) => fetchAddressFromCEP(e.target.value));

    renderAddresses();
});