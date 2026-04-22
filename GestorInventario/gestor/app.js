// ======== VARIABLES GLOBALES ========
const MAX_CAPACITY = 8;
let inventory = [];

// Elementos del DOM (se inicializan después de DOMContentLoaded)
let resetAllBtn;
let tableBody;
let formMessage;
let usedWeightDisplay;
let availableWeightDisplay;
let capacityBarDisplay;
let capacityPercentDisplay;
let confirmModal;
let confirmBtn;
let cancelBtn;

// Verificar si localStorage está disponible
let localStorageAvailable = false;
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    localStorageAvailable = true;
    console.log('✅ localStorage disponible');
} catch (error) {
    console.error('❌ localStorage NO disponible:', error);
    console.warn('⚠️ Los datos se perderán al recargar la página');
}

// ======== EVENT LISTENERS ========
document.addEventListener('DOMContentLoaded', () => {
    // Asignar elementos del DOM DESPUÉS de que cargue la página
    resetAllBtn = document.getElementById('resetAllBtn');
    tableBody = document.getElementById('tableBody');
    formMessage = document.getElementById('formMessage');
    usedWeightDisplay = document.getElementById('usedWeight');
    availableWeightDisplay = document.getElementById('availableWeight');
    capacityBarDisplay = document.getElementById('capacityBar');
    capacityPercentDisplay = document.getElementById('capacityPercent');
    confirmModal = document.getElementById('confirmModal');
    confirmBtn = document.getElementById('confirmBtn');
    cancelBtn = document.getElementById('cancelBtn');

    // Agregar event listeners
    resetAllBtn.addEventListener('click', () => showConfirmModal('¿Limpiar todo el inventario?', 'Esta acción eliminará todos los artículos registrados.', resetInventory));
    cancelBtn.addEventListener('click', closeConfirmModal);

    // Cargar datos y renderizar
    loadInventoryFromStorage();
    renderInventory();
    updateCapacityDisplay();
    
    console.log('✅ Aplicación iniciada correctamente');
});



// ======== AGREGAR ITEM PREDEFINIDO DIRECTAMENTE ========
function addPresetDirect(name, kilos) {
    console.log(`📝 Agregando: ${name} - ${kilos} kL`);
    
    const usedWeight = getTotalWeight();

    // Verificar límite de capacidad
    if (usedWeight + kilos > MAX_CAPACITY) {
        showMessage(
            `No hay suficiente capacidad. Disponible: ${(MAX_CAPACITY - usedWeight).toFixed(1)} kg`,
            'warning'
        );
        return;
    }

    // Verificar si el artículo ya existe
    const existingItem = inventory.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (existingItem) {
        existingItem.kilos += kilos;
        showMessage(`${name} actualizado (${existingItem.kilos} kg)`, 'success');
    } else {
        inventory.push({
            id: generateId(),
            name,
            kilos
        });
        showMessage(`${name} agregado correctamente`, 'success');
    }

    console.log('📦 Inventario actual:', inventory);
    saveInventoryToStorage();
    renderInventory();
    updateCapacityDisplay();
}

// ======== ELIMINAR ITEM ========
function deleteItem(id) {
    const item = inventory.find(i => i.id === id);
    if (item) {
        showConfirmModal(
            `¿Eliminar "${item.name}"?`,
            `Se eliminará ${item.name} del inventario.`,
            () => {
                inventory = inventory.filter(i => i.id !== id);
                saveInventoryToStorage();
                renderInventory();
                updateCapacityDisplay();
                showMessage(`${item.name} eliminado`, 'success');
            }
        );
    }
}

// ======== RENDERIZAR INVENTARIO ========
function renderInventory() {
    if (inventory.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="3">No hay artículos registrados</td></tr>';
        return;
    }

    tableBody.innerHTML = inventory.map(item => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.kilos.toFixed(1)} kg</td>
            <td>
                <button class="btn btn-delete" onclick="deleteItem('${item.id}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ======== ACTUALIZAR DISPLAY DE CAPACIDAD ========
function updateCapacityDisplay() {
    const usedWeight = getTotalWeight();
    const availableWeight = MAX_CAPACITY - usedWeight;
    const percentage = (usedWeight / MAX_CAPACITY) * 100;

    usedWeightDisplay.textContent = usedWeight.toFixed(1);
    availableWeightDisplay.textContent = availableWeight.toFixed(1);
    capacityPercentDisplay.textContent = percentage.toFixed(0) + '%';

    // Actualizar barra de capacidad
    capacityBarDisplay.style.width = Math.min(percentage, 100) + '%';

    // Cambiar color si está cerca del límite
    if (percentage >= 80) {
        capacityBarDisplay.classList.add('warning');
    } else {
        capacityBarDisplay.classList.remove('warning');
    }
}

// ======== OBTENER PESO TOTAL ========
function getTotalWeight() {
    return inventory.reduce((sum, item) => sum + item.kilos, 0);
}



// ======== LIMPIAR TODO EL INVENTARIO ========
function resetInventory() {
    inventory = [];
    saveInventoryToStorage();
    renderInventory();
    updateCapacityDisplay();
    showMessage('Inventario limpiado completamente', 'success');
    closeConfirmModal();
}

// ======== EXPORTAR DATOS ========
function exportData() {
    if (inventory.length === 0) {
        showMessage('No hay datos para exportar', 'warning');
        return;
    }

    const data = {
        fecha: new Date().toLocaleDateString('es-ES'),
        hora: new Date().toLocaleTimeString('es-ES'),
        capacidadMaxima: MAX_CAPACITY,
        kilosUsados: getTotalWeight().toFixed(1),
        kilosDisponibles: (MAX_CAPACITY - getTotalWeight()).toFixed(1),
        articulos: inventory
    };

    const csvContent = generateCSV(data);
    downloadFile(csvContent, 'inventario.csv');
    showMessage('Datos exportados correctamente', 'success');
}

// ======== GENERAR CSV ========
function generateCSV(data) {
    let csv = 'INVENTARIO - ' + data.fecha + ' ' + data.hora + '\n\n';
    csv += 'CAPACIDAD TOTAL,' + data.capacidadMaxima + ' kL\n';
    csv += 'KILOS USADOS,' + data.kilosUsados + ' kL\n';
    csv += 'KILOS DISPONIBLES,' + data.kilosDisponibles + ' kL\n\n';
    csv += 'ARTÍCULOS\n';
    csv += 'Nombre,Kilos\n';

    data.articulos.forEach(item => {
        csv += `"${item.name}",${item.kilos.toFixed(1)}\n`;
    });

    return csv;
}

// ======== DESCARGAR ARCHIVO ========
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ======== MOSTRAR MENSAJES ========
function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `message ${type}`;

    setTimeout(() => {
        formMessage.classList.remove('success', 'error', 'warning');
    }, 4000);
}

// ======== MODAL DE CONFIRMACIÓN ========
function showConfirmModal(title, message, callback) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    confirmModal.classList.remove('hidden');

    confirmBtn.onclick = () => {
        callback();
    };
}

function closeConfirmModal() {
    confirmModal.classList.add('hidden');
}

// ======== LOCAL STORAGE ========
function saveInventoryToStorage() {
    if (!localStorageAvailable) {
        console.warn('⚠️ localStorage no disponible, datos no guardados');
        return;
    }
    
    try {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        console.log('✅ Inventario guardado:', inventory);
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        showMessage('Error al guardar los datos', 'error');
    }
}

function loadInventoryFromStorage() {
    if (!localStorageAvailable) {
        console.warn('⚠️ localStorage no disponible, no hay datos previos');
        return;
    }
    
    try {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            inventory = JSON.parse(saved);
            console.log('✅ Inventario cargado:', inventory);
        } else {
            console.log('ℹ️ No hay datos previos guardados');
        }
    } catch (error) {
        console.error('❌ Error al cargar:', error);
        showMessage('Error al cargar los datos', 'error');
    }
}

// ======== GENERAR ID ÚNICO ========
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}