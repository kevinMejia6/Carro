/**
 * ========================================
 * APLICACIÓN DE AHORROS PARA COMPRAR UN CARRO
 * ========================================
 * Esta aplicación permite gestionar el ahorro para la compra de un vehículo
 * utilizando localStorage para persistencia de datos.
 * 
 * Autor: Desarrollador Frontend
 * Versión: 1.0.0
 */

// ========================================
// CONSTANTES Y CONFIGURACIÓN
// ========================================

const STORAGE_KEYS = {
    GOAL: 'carSavings_goal',
    SAVINGS: 'carSavings_list',
    IMAGES: 'carSavings_images'
};

// ========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ========================================

let appState = {
    goal: null,
    savings: [],
    images: [],
    mainImage: null
};

// ========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos desde localStorage
    loadData();
    
    // Verificar si existe configuración
    if (appState.goal) {
        showDashboard();
    } else {
        showSetup();
    }
    
    // Establecer fecha actual por defecto en el formulario
    document.getElementById('savingsDate').valueAsDate = new Date();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Actualizar dashboard
    updateDashboard();
});

// ========================================
// FUNCIONES DE PERSISTENCIA (LOCALSTORAGE)
// ========================================

/**
 * Carga todos los datos desde localStorage
 */
function loadData() {
    try {
        // Cargar meta
        const goalData = localStorage.getItem(STORAGE_KEYS.GOAL);
        if (goalData) {
            appState.goal = JSON.parse(goalData);
        }
        
        // Cargar ahorros
        const savingsData = localStorage.getItem(STORAGE_KEYS.SAVINGS);
        if (savingsData) {
            appState.savings = JSON.parse(savingsData);
        }
        
        // Cargar imágenes
        const imagesData = localStorage.getItem(STORAGE_KEYS.IMAGES);
        if (imagesData) {
            appState.images = JSON.parse(imagesData);
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error', 'No se pudieron cargar los datos guardados', 'danger');
    }
}

/**
 * Guarda la meta en localStorage
 */
function saveGoal() {
    try {
        localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(appState.goal));
        showToast('Éxito', 'Meta guardada correctamente', 'success');
    } catch (error) {
        console.error('Error guardando meta:', error);
        showToast('Error', 'No se pudo guardar la meta', 'danger');
    }
}

/**
 * Guarda la lista de ahorros en localStorage
 */
function saveSavings() {
    try {
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(appState.savings));
    } catch (error) {
        console.error('Error guardando ahorros:', error);
        showToast('Error', 'No se pudo guardar el ahorro', 'danger');
    }
}

/**
 * Guarda las imágenes en localStorage
 */
function saveImages() {
    try {
        localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(appState.images));
    } catch (error) {
        console.error('Error guardando imágenes:', error);
        showToast('Error', 'No se pudo guardar la imagen', 'danger');
    }
}

/**
 * Reinicia todos los datos
 */
function resetAllData() {
    if (!confirm('¿Estás seguro de que deseas reiniciar todos los datos? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        localStorage.removeItem(STORAGE_KEYS.GOAL);
        localStorage.removeItem(STORAGE_KEYS.SAVINGS);
        localStorage.removeItem(STORAGE_KEYS.IMAGES);
        
        appState = {
            goal: null,
            savings: [],
            images: [],
            mainImage: null
        };
        
        showToast('Información', 'Todos los datos han sido reiniciados', 'info');
        
        // Recargar la página
        setTimeout(() => {
            location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error reiniciando datos:', error);
        showToast('Error', 'No se pudo reiniciar los datos', 'danger');
    }
}

// ========================================
// GESTIÓN DE LA INTERFAZ
// ========================================

/**
 * Muestra la sección de configuración inicial
 */
function showSetup() {
    document.getElementById('setupSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

/**
 * Muestra el dashboard principal
 */
function showDashboard() {
    document.getElementById('setupSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

/**
 * Actualiza todo el dashboard con los datos actuales
 */
function updateDashboard() {
    if (!appState.goal) return;
    
    // Actualizar información del carro
    document.getElementById('carNameDisplay').textContent = appState.goal.name;
    document.getElementById('carDescriptionDisplay').textContent = appState.goal.description || 'Sin descripción';
    document.getElementById('carGoalDisplay').textContent = formatCurrency(appState.goal.amount);
    
    // Calcular totales
    const totalSaved = calculateTotalSaved();
    const remaining = appState.goal.amount - totalSaved;
    const progress = calculateProgress();
    
    // Actualizar tarjetas de resumen
    document.getElementById('summaryGoal').textContent = formatCurrency(appState.goal.amount);
    document.getElementById('summarySaved').textContent = formatCurrency(totalSaved);
    document.getElementById('summaryRemaining').textContent = formatCurrency(remaining);
    document.getElementById('summaryProgress').textContent = progress + '%';
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', progress);
    document.getElementById('progressText').textContent = progress + '%';
    
    // Actualizar textos de progreso
    document.getElementById('progressSavedText').textContent = formatCurrency(totalSaved) + ' ahorrado';
    document.getElementById('progressGoalText').textContent = formatCurrency(appState.goal.amount) + ' meta';
    
    // Cambiar estilo de barra según progreso
    progressBar.classList.remove('critical', 'completed');
    if (progress >= 100) {
        progressBar.classList.add('completed');
        document.getElementById('congratulationsMessage').classList.remove('d-none');
    } else if (progress >= 80) {
        progressBar.classList.add('critical');
        document.getElementById('congratulationsMessage').classList.add('d-none');
    } else {
        document.getElementById('congratulationsMessage').classList.add('d-none');
    }
    
    // Actualizar estadísticas
    updateStatistics(totalSaved);
    
    // Actualizar historial
    updateHistory();
    
    // Actualizar galería de imágenes
    updateImageGallery();
}

/**
 * Actualiza las estadísticas del dashboard
 */
function updateStatistics(totalSaved) {
    const contributions = appState.savings.length;
    
    // Promedio por aporte
    const avgSavings = contributions > 0 ? totalSaved / contributions : 0;
    document.getElementById('avgSavings').textContent = formatCurrency(avgSavings);
    
    // Mayor aporte
    const maxSavings = contributions > 0 ? Math.max(...appState.savings.map(s => s.amount)) : 0;
    document.getElementById('maxSavings').textContent = formatCurrency(maxSavings);
    
    // Último ahorro
    const sortedSavings = [...appState.savings].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortedSavings.length > 0) {
        const lastSavings = sortedSavings[0];
        document.getElementById('lastSavings').textContent = formatCurrency(lastSavings.amount);
        document.getElementById('lastSavingsDate').textContent = formatDate(lastSavings.date);
    } else {
        document.getElementById('lastSavings').textContent = '$0';
        document.getElementById('lastSavingsDate').textContent = '-';
    }
    
    // Contador de aportes
    document.getElementById('contributionsCount').textContent = contributions;
    
    // Estimación de tiempo
    updateTimeEstimate(totalSaved, avgSavings);
}

/**
 * Calcula la estimación de tiempo para completar la meta
 */
function updateTimeEstimate(totalSaved, avgSavings) {
    const remaining = appState.goal.amount - totalSaved;
    
    if (remaining <= 0) {
        document.getElementById('timeEstimate').textContent = '¡Meta completada!';
        document.getElementById('timeEstimateDetail').textContent = 'Felicidades por alcanzar tu objetivo';
        return;
    }
    
    if (avgSavings <= 0 || appState.savings.length === 0) {
        document.getElementById('timeEstimate').textContent = 'Sin datos';
        document.getElementById('timeEstimateDetail').textContent = 'Agrega ahorros para ver la estimación';
        return;
    }
    
    // Calcular días restantes basados en el promedio
    const daysRemaining = Math.ceil(remaining / avgSavings);
    
    if (daysRemaining <= 30) {
        document.getElementById('timeEstimate').textContent = daysRemaining + ' días';
        document.getElementById('timeEstimateDetail').textContent = '¡Estás muy cerca!';
    } else if (daysRemaining <= 365) {
        const months = Math.ceil(daysRemaining / 30);
        document.getElementById('timeEstimate').textContent = months + ' mes(es)';
        document.getElementById('timeEstimateDetail').textContent = 'Mantén el ritmo de ahorro';
    } else {
        const years = Math.ceil(daysRemaining / 365);
        document.getElementById('timeEstimate').textContent = years + ' año(s)';
        document.getElementById('timeEstimateDetail').textContent = 'La constancia es clave';
    }
}

/**
 * Actualiza el historial de ahorros en la tabla
 */
function updateHistory() {
    const tableBody = document.getElementById('savingsTableBody');
    const cardsContainer = document.getElementById('savingsCards');
    const noSavingsMessage = document.getElementById('noSavingsMessage');
    const historyCount = document.getElementById('historyCount');
    
    // Ordenar ahorros por fecha (más reciente primero)
    const sortedSavings = [...appState.savings].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    historyCount.textContent = sortedSavings.length + ' registros';
    
    if (sortedSavings.length === 0) {
        tableBody.innerHTML = '';
        cardsContainer.innerHTML = '';
        noSavingsMessage.classList.remove('d-none');
        return;
    }
    
    noSavingsMessage.classList.add('d-none');
    
    // Actualizar tabla
    tableBody.innerHTML = sortedSavings.map((savings, index) => `
        <tr class="fade-in" style="animation-delay: ${index * 0.05}s">
            <td>${index + 1}</td>
            <td>${formatDate(savings.date)}</td>
            <td><strong class="text-success">${formatCurrency(savings.amount)}</strong></td>
            <td>${savings.note || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm action-btn" onclick="editSavings('${savings.id}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm action-btn" onclick="deleteSavings('${savings.id}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Actualizar cards para móvil
    cardsContainer.innerHTML = sortedSavings.map((savings, index) => `
        <div class="card savings-card fade-in" style="animation-delay: ${index * 0.05}s">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="savings-amount">${formatCurrency(savings.amount)}</span>
                        <p class="savings-date mb-1"><i class="bi bi-calendar-event me-1"></i>${formatDate(savings.date)}</p>
                        <small class="text-muted">${savings.note || 'Sin nota'}</small>
                    </div>
                    <div>
                        <button class="btn btn-warning btn-sm action-btn" onclick="editSavings('${savings.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm action-btn" onclick="deleteSavings('${savings.id}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Actualiza la galería de imágenes
 */
function updateImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const gallery = document.getElementById('imagesGallery');
    
    if (appState.images.length === 0) {
        mainImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"%3E%3Crect fill="%23e9ecef" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" fill="%236c757d" text-anchor="middle" dy=".3em"%3ENo hay fotos agregadas%3C/text%3E%3C/svg%3E';
        gallery.innerHTML = '<p class="text-muted text-center w-100">No hay fotos agregadas</p>';
        return;
    }
    
    // Mostrar imagen principal
    const mainImgData = appState.mainImage 
        ? appState.images.find(img => img.id === appState.mainImage)
        : appState.images[0];
    
    if (mainImgData) {
        mainImage.src = mainImgData.data;
    }
    
    // Actualizar galería
    gallery.innerHTML = appState.images.map(img => `
        <div class="col-4 col-md-3 image-thumbnail ${appState.mainImage === img.id ? 'main' : ''}">
            <img src="${img.data}" alt="Foto del carro" onclick="setMainImage('${img.id}')">
            <button class="delete-btn" onclick="deleteImage('${img.id}')" title="Eliminar">
                <i class="bi bi-x"></i>
            </button>
            ${appState.mainImage !== img.id ? `<button class="set-main-btn" onclick="setMainImage('${img.id}')">Principal</button>` : ''}
        </div>
    `).join('');
}

// ========================================
// GESTIÓN DE LA META
// ========================================

/**
 * Configura el formulario de configuración inicial
 */
document.getElementById('setupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('carName').value.trim();
    const amount = parseFloat(document.getElementById('carGoal').value);
    const description = document.getElementById('carDescription').value.trim();
    const imagesInput = document.getElementById('carImages');
    
    // Validaciones
    if (!name) {
        showToast('Error', 'Por favor ingresa el nombre del carro', 'danger');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Error', 'Por favor ingresa un monto válido mayor a 0', 'danger');
        return;
    }
    
    // Crear meta
    appState.goal = {
        name,
        amount,
        description,
        createdAt: new Date().toISOString()
    };
    
    // Procesar imágenes si hay
    if (imagesInput.files.length > 0) {
        await processImages(imagesInput.files);
    }
    
    // Guardar
    saveGoal();
    saveImages();
    
    // Mostrar dashboard
    showDashboard();
    updateDashboard();
    
    // Limpiar formulario
    this.reset();
    document.getElementById('savingsDate').valueAsDate = new Date();
    
    showToast('Éxito', 'Meta configurada correctamente', 'success');
});

/**
 * Configura el formulario de edición de meta
 */
document.getElementById('saveGoalEdit').addEventListener('click', function() {
    const name = document.getElementById('editCarName').value.trim();
    const amount = parseFloat(document.getElementById('editCarGoal').value);
    const description = document.getElementById('editCarDescription').value.trim();
    
    // Validaciones
    if (!name) {
        showToast('Error', 'El nombre del carro es obligatorio', 'danger');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Error', 'El monto debe ser mayor a 0', 'danger');
        return;
    }
    
    // Actualizar meta
    appState.goal = {
        ...appState.goal,
        name,
        amount,
        description
    };
    
    saveGoal();
    updateDashboard();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
    modal.hide();
    
    showToast('Éxito', 'Meta actualizada correctamente', 'success');
});

/**
 * Prepara el modal de edición con los datos actuales
 */
function prepareEditGoalModal() {
    if (!appState.goal) return;
    
    document.getElementById('editCarName').value = appState.goal.name;
    document.getElementById('editCarGoal').value = appState.goal.amount;
    document.getElementById('editCarDescription').value = appState.goal.description || '';
}

// ========================================
// GESTIÓN DE AHORROS
// ========================================

/**
 * Configura el formulario de nuevo ahorro
 */
document.getElementById('savingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('savingsAmount').value);
    const date = document.getElementById('savingsDate').value;
    const note = document.getElementById('savingsNote').value.trim();
    
    // Validaciones
    if (isNaN(amount) || amount <= 0) {
        showToast('Error', 'Por favor ingresa un monto válido mayor a 0', 'danger');
        return;
    }
    
    if (!date) {
        showToast('Error', 'Por favor selecciona una fecha', 'danger');
        return;
    }
    
    // Crear nuevo ahorro
    const savings = {
        id: generateId(),
        amount,
        date,
        note,
        createdAt: new Date().toISOString()
    };
    
    appState.savings.push(savings);
    saveSavings();
    updateDashboard();
    
    // Limpiar formulario
    this.reset();
    document.getElementById('savingsDate').valueAsDate = new Date();
    
    showToast('Éxito', 'Ahorro registrado correctamente', 'success');
});

/**
 * Prepara el modal de edición de ahorro
 */
function editSavings(id) {
    const savings = appState.savings.find(s => s.id === id);
    if (!savings) return;
    
    document.getElementById('editSavingsId').value = savings.id;
    document.getElementById('editSavingsAmount').value = savings.amount;
    document.getElementById('editSavingsDate').value = savings.date;
    document.getElementById('editSavingsNote').value = savings.note || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editSavingsModal'));
    modal.show();
}

/**
 * Guarda los cambios de un ahorro editado
 */
document.getElementById('saveSavingsEdit').addEventListener('click', function() {
    const id = document.getElementById('editSavingsId').value;
    const amount = parseFloat(document.getElementById('editSavingsAmount').value);
    const date = document.getElementById('editSavingsDate').value;
    const note = document.getElementById('editSavingsNote').value.trim();
    
    // Validaciones
    if (isNaN(amount) || amount <= 0) {
        showToast('Error', 'El monto debe ser mayor a 0', 'danger');
        return;
    }
    
    if (!date) {
        showToast('Error', 'Por favor selecciona una fecha', 'danger');
        return;
    }
    
    // Actualizar ahorro
    const index = appState.savings.findIndex(s => s.id === id);
    if (index === -1) return;
    
    appState.savings[index] = {
        ...appState.savings[index],
        amount,
        date,
        note
    };
    
    saveSavings();
    updateDashboard();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editSavingsModal'));
    modal.hide();
    
    showToast('Éxito', 'Ahorro actualizado correctamente', 'success');
});

/**
 * Elimina un ahorro con confirmación
 */
function deleteSavings(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        return;
    }
    
    appState.savings = appState.savings.filter(s => s.id !== id);
    saveSavings();
    updateDashboard();
    
    showToast('Información', 'Ahorro eliminado correctamente', 'info');
}

// ========================================
// GESTIÓN DE IMÁGENES
// ========================================

/**
 * Procesa y guarda imágenes desde un input de archivo
 */
async function processImages(files) {
    for (let i = 0; i < files.length; i++) {
        try {
            const imageData = await readFileAsBase64(files[i]);
            const img = {
                id: generateId(),
                data: imageData,
                name: files[i].name,
                uploadedAt: new Date().toISOString()
            };
            appState.images.push(img);
            
            // Si es la primera imagen, establecerla como principal
            if (!appState.mainImage) {
                appState.mainImage = img.id;
            }
        } catch (error) {
            console.error('Error procesando imagen:', error);
            showToast('Error', `No se pudo procesar la imagen ${files[i].name}`, 'danger');
        }
    }
}

/**
 * Lee un archivo como Base64
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Configura el formulario para agregar nueva imagen
 */
document.getElementById('saveImageBtn').addEventListener('click', async function() {
    const imageInput = document.getElementById('newImage');
    
    if (!imageInput.files || imageInput.files.length === 0) {
        showToast('Error', 'Por favor selecciona una imagen', 'danger');
        return;
    }
    
    await processImages(imageInput.files);
    saveImages();
    updateDashboard();
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addImageModal'));
    modal.hide();
    
    // Limpiar formulario
    imageInput.value = '';
    
    showToast('Éxito', 'Imagen agregada correctamente', 'success');
});

/**
 * Establece una imagen como principal
 */
function setMainImage(id) {
    appState.mainImage = id;
    saveImages();
    updateDashboard();
    showToast('Información', 'Imagen principal actualizada', 'info');
}

/**
 * Elimina una imagen
 */
function deleteImage(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
    }
    
    // Si es la imagen principal, quitar el principal
    if (appState.mainImage === id) {
        appState.mainImage = null;
    }
    
    appState.images = appState.images.filter(img => img.id !== id);
    saveImages();
    updateDashboard();
    
    showToast('Información', 'Imagen eliminada correctamente', 'info');
}

// ========================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Botón de reiniciar datos
    document.getElementById('resetDataBtn').addEventListener('click', resetAllData);
    
    // Preparar modal de edición de meta
    document.getElementById('editGoalModal').addEventListener('show.bs.modal', prepareEditGoalModal);
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Genera un ID único
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatea una cantidad como moneda
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Formatea una fecha
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

/**
 * Calcula el total ahorrado
 */
function calculateTotalSaved() {
    return appState.savings.reduce((sum, s) => sum + s.amount, 0);
}

/**
 * Calcula el porcentaje de progreso
 */
function calculateProgress() {
    if (!appState.goal || appState.goal.amount === 0) return 0;
    const totalSaved = calculateTotalSaved();
    const progress = (totalSaved / appState.goal.amount) * 100;
    return Math.min(Math.round(progress * 100) / 100, 100);
}

/**
 * Muestra una notificación toast
 */
function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Configurar colores según tipo
    const header = toast.querySelector('.toast-header');
    header.className = 'toast-header';
    
    if (type === 'success') {
        header.classList.add('bg-success', 'text-white');
    } else if (type === 'danger') {
        header.classList.add('bg-danger', 'text-white');
    } else if (type === 'warning') {
        header.classList.add('bg-warning');
    } else if (type === 'info') {
        header.classList.add('bg-info', 'text-white');
    }
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// ========================================
// FUNCIONES DE ESTADÍSTICAS
// ========================================

/**
 * Calcula el ahorro por mes
 */
function getSavingsByMonth() {
    const savingsByMonth = {};
    
    appState.savings.forEach(savings => {
        const date = new Date(savings.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!savingsByMonth[monthKey]) {
            savingsByMonth[monthKey] = 0;
        }
        
        savingsByMonth[monthKey] += savings.amount;
    });
    
    return savingsByMonth;
}

/**
 * Obtiene el ahorro del mes actual
 */
function getCurrentMonthSavings() {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const monthKey = `${currentYear}-${currentMonth}`;
    
    const savingsByMonth = getSavingsByMonth();
    return savingsByMonth[monthKey] || 0;
}

// ========================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ========================================

// Hacer funciones disponibles globalmente para los onclick en HTML
window.editSavings = editSavings;
window.deleteSavings = deleteSavings;
window.setMainImage = setMainImage;
window.deleteImage = deleteImage;
