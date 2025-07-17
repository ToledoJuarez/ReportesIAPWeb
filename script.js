// --- DOM Elements ---
const showFormBtn = document.getElementById('showFormBtn');
const showReportsBtn = document.getElementById('showReportsBtn');
const formView = document.getElementById('formView');
const reportsView = document.getElementById('reportsView');
const reportForm = document.getElementById('reportForm');
const enviarReporteBtn = document.getElementById('enviarReporteBtn');
const limpiarFormBtn = document.getElementById('limpiarFormBtn');

const tipoReporteInput = document.getElementById('tipoReporte');
const numeroPosteInput = document.getElementById('numeroPoste');
const posteReferenciaInput = document.getElementById('posteReferencia');
const coordenadasInput = document.getElementById('coordenadas');
const observacionesInput = document.getElementById('observaciones');
const fotoMapsInput = document.getElementById('fotoMaps');
const fotoCampoInput = document.getElementById('fotoCampo');
const fotoMapsPreview = document.getElementById('fotoMapsPreview');
const fotoCampoPreview = document.getElementById('fotoCampoPreview');

const buscadorInput = document.getElementById('buscador');
const buscarReporteBtn = document.getElementById('buscarReporteBtn');
const reportsTableBody = document.querySelector('#reportsTable tbody');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeButton = document.querySelector('.close-button');

const fotoMapsFileNameDisplay = document.getElementById('fotoMapsFileName');
const fotoCampoFileNameDisplay = document.getElementById('fotoCampoFileName');
// --- Global Variables ---
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby45fKB7H9j6qN7FLCNKfE116pmulepjIVKGAVyvU-WCMd-E1PmdjvH4kE6QkzlXBYL/exec'; // ¡IMPORTANTE: Reemplaza con tu URL!

let currentFotoMapsFile = null;
let currentFotoCampoFile = null;

// --- Funciones Auxiliares ---

// Función para convertir archivo a Base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Solo la parte base64
        reader.onerror = error => reject(error);
    });
}

// Función para previsualizar imágenes
function previewImage(input, previewElement) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Previsualización">`;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        previewElement.innerHTML = ''; // Limpiar si no hay archivo
    }
}

// Modifica la función clearForm para limpiar también el nombre del archivo
function clearForm() {
    reportForm.reset();
    fotoMapsPreview.innerHTML = '';
    fotoCampoPreview.innerHTML = '';
    fotoMapsFileNameDisplay.textContent = ''; // Limpiar nombre de archivo
    fotoCampoFileNameDisplay.textContent = ''; // Limpiar nombre de archivo
    currentFotoMapsFile = null;
    currentFotoCampoFile = null;
    checkFormValidity();
}

// // Función para limpiar el formulario
// function clearForm() {
//     reportForm.reset();
//     fotoMapsPreview.innerHTML = '';
//     fotoCampoPreview.innerHTML = '';
//     currentFotoMapsFile = null;
//     currentFotoCampoFile = null;
//     checkFormValidity(); // Reevaluar la validez después de limpiar
// }


// Función para validar el formulario
function checkFormValidity() {
    const isNumeroPosteFilled = numeroPosteInput.value.trim() !== '';
    const isPosteReferenciaFilled = posteReferenciaInput.value.trim() !== '';
    const isFotoMapsFilled = fotoMapsInput.files.length > 0;
    const isFotoCampoFilled = fotoCampoInput.files.length > 0;
    const isTipoReporteSelected = tipoReporteInput.value !== '';

    // "Numero poste o Poste referencia deben estar lleno para poder enviar datos"
    // "Foto maps solo cargar imagen"
    // "Foto campo puede cargar imagen o tomar una foto"
    // Ambos campos de foto son required, así que también se incluyen en la validación.
    const isAnyPosteFieldFilled = isNumeroPosteFilled || isPosteReferenciaFilled;

    enviarReporteBtn.disabled = !(isAnyPosteFieldFilled && isFotoMapsFilled && isFotoCampoFilled && isTipoReporteSelected);
}


// --- Event Listeners ---

// Cambiar de vista
showFormBtn.addEventListener('click', () => {
    formView.classList.add('active');
    reportsView.classList.remove('active');
    showFormBtn.classList.add('active');
    showReportsBtn.classList.remove('active');
});

showReportsBtn.addEventListener('click', async () => {
    formView.classList.remove('active');
    reportsView.classList.add('active');
    showFormBtn.classList.remove('active');
    showReportsBtn.classList.add('active');
    await loadReports(); // Cargar los reportes al cambiar a esta vista
});

// Previsualizar fotos al seleccionarlas
fotoMapsInput.addEventListener('change', (event) => {
    currentFotoMapsFile = event.target.files[0];
    previewImage(fotoMapsInput, fotoMapsPreview);
    checkFormValidity();
});

fotoCampoInput.addEventListener('change', (event) => {
    currentFotoCampoFile = event.target.files[0];
    previewImage(fotoCampoInput, fotoCampoPreview);
    checkFormValidity();
});

// Validar formulario en tiempo real
tipoReporteInput.addEventListener('input', checkFormValidity);
numeroPosteInput.addEventListener('input', checkFormValidity);
posteReferenciaInput.addEventListener('input', checkFormValidity);


// Limpiar formulario
limpiarFormBtn.addEventListener('click', clearForm);

// Enviar reporte
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    enviarReporteBtn.disabled = true;
    enviarReporteBtn.textContent = 'Enviando...';
    enviarReporteBtn.style.backgroundColor = '#ffc107';

    try {
        // Comprimir imágenes antes de convertirlas a Base64
        const compressedMapsBlob = currentFotoMapsFile ? await compressImage(currentFotoMapsFile) : null;
        const compressedCampoBlob = currentFotoCampoFile ? await compressImage(currentFotoCampoFile) : null;

        // Convertir a Base64
        const fotoMapsBase64 = compressedMapsBlob ? await blobToBase64(compressedMapsBlob) : '';
        const fotoCampoBase64 = compressedCampoBlob ? await blobToBase64(compressedCampoBlob) : '';

        const formData = new FormData();
        formData.append('accion', 'guardarReporte');
        formData.append('TIPO_REPORTE', tipoReporteInput.value);
        formData.append('NUMERO_POSTE', numeroPosteInput.value);
        formData.append('POSTE_REFERENCIA', posteReferenciaInput.value);
        formData.append('COORDENADAS', coordenadasInput.value);
        formData.append('OBSERVACIONES', observacionesInput.value);
        formData.append('FOTO_MAPS', fotoMapsBase64);
        formData.append('FOTO_CAMPO', fotoCampoBase64);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            alert('¡Reporte enviado con éxito!');
            clearForm();
        } else {
            alert('Error al enviar el reporte: ' + (result.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al enviar el reporte:', error);
        alert('Hubo un problema de conexión o un error inesperado al enviar el reporte.');
    } finally {
        enviarReporteBtn.disabled = false;
        enviarReporteBtn.textContent = 'Enviar Reporte';
        enviarReporteBtn.style.backgroundColor = '#28a745';
    }
});

// Función auxiliar para convertir Blob a Base64
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result.split(',')[1]);
    });
}


// Actualizar el nombre del archivo en la interfaz
fotoMapsInput.addEventListener('change', (event) => {
    currentFotoMapsFile = event.target.files[0];
    previewImage(fotoMapsInput, fotoMapsPreview);
    checkFormValidity();
    // Nuevo: Mostrar el nombre del archivo
    fotoMapsFileNameDisplay.textContent = currentFotoMapsFile ? currentFotoMapsFile.name : '';
});

fotoCampoInput.addEventListener('change', (event) => {
    currentFotoCampoFile = event.target.files[0];
    previewImage(fotoCampoInput, fotoCampoPreview);
    checkFormValidity();
    // Nuevo: Mostrar el nombre del archivo
    fotoCampoFileNameDisplay.textContent = currentFotoCampoFile ? currentFotoCampoFile.name : '';
});


// Cargar y mostrar reportes
async function loadReports(query = '') {
    reportsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Cargando reportes...</td></tr>';
    buscarReporteBtn.disabled = true;
    buscarReporteBtn.textContent = 'Buscando...';
    buscarReporteBtn.style.backgroundColor = '#ffc107';

    try {
        const url = new URL(SCRIPT_URL);
        url.searchParams.append('accion', 'obtenerReportes');
        if (query) {
            url.searchParams.append('query', query);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        reportsTableBody.innerHTML = '';

        if (data.success && data.reportes.length > 0) {
            data.reportes.sort((a, b) => new Date(b.FECHA) - new Date(a.FECHA));

            data.reportes.forEach(reporte => {
                const row = reportsTableBody.insertRow();
                row.insertCell().textContent = reporte.FECHA || '';
                row.insertCell().textContent = reporte.TIPO_REPORTE || '';
                row.insertCell().textContent = reporte.NUMERO_POSTE || '';
                row.insertCell().textContent = reporte.POSTE_REFERENCIA || '';
                row.insertCell().textContent = reporte.COORDENADAS || '';
                row.insertCell().textContent = reporte.OBSERVACIONES || '';
                
                // Celda para Foto Maps (ahora es URL)
                const fotoMapsCell = row.insertCell();
                if (reporte.FOTO_MAPS && reporte.FOTO_MAPS.startsWith('http')) {
                    const linkMaps = document.createElement('a');
                    linkMaps.href = reporte.FOTO_MAPS;
                    linkMaps.target = '_blank';
                    linkMaps.textContent = 'Ver Foto';
                    linkMaps.classList.add('btn', 'btn-primary', 'btn-sm');
                    fotoMapsCell.appendChild(linkMaps);
                } else if (reporte.FOTO_MAPS) {
                    // Manejo de legacy (Base64)
                    const imgMaps = document.createElement('img');
                    imgMaps.src = `data:image/jpeg;base64,${reporte.FOTO_MAPS}`;
                    imgMaps.classList.add('thumbnail');
                    imgMaps.alt = 'Foto Maps';
                    imgMaps.addEventListener('click', () => openImageModal(imgMaps.src));
                    fotoMapsCell.appendChild(imgMaps);
                } else {
                    fotoMapsCell.textContent = 'N/A';
                }

                // Celda para Foto Campo (ahora es URL)
                const fotoCampoCell = row.insertCell();
                if (reporte.FOTO_CAMPO && reporte.FOTO_CAMPO.startsWith('http')) {
                    const linkCampo = document.createElement('a');
                    linkCampo.href = reporte.FOTO_CAMPO;
                    linkCampo.target = '_blank';
                    linkCampo.textContent = 'Ver Foto';
                    linkCampo.classList.add('btn', 'btn-primary', 'btn-sm');
                    fotoCampoCell.appendChild(linkCampo);
                } else if (reporte.FOTO_CAMPO) {
                    // Manejo de legacy (Base64)
                    const imgCampo = document.createElement('img');
                    imgCampo.src = `data:image/jpeg;base64,${reporte.FOTO_CAMPO}`;
                    imgCampo.classList.add('thumbnail');
                    imgCampo.alt = 'Foto Campo';
                    imgCampo.addEventListener('click', () => openImageModal(imgCampo.src));
                    fotoCampoCell.appendChild(imgCampo);
                } else {
                    fotoCampoCell.textContent = 'N/A';
                }
            });
        } else {
            reportsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No hay reportes para mostrar.</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar los reportes:', error);
        reportsTableBody.innerHTML = '<tr><td colspan="8" style="color: red; text-align: center;">Error al cargar los reportes. Inténtalo de nuevo más tarde.</td></tr>';
    } finally {
        buscarReporteBtn.disabled = false;
        buscarReporteBtn.textContent = 'Buscar Reporte';
        buscarReporteBtn.style.backgroundColor = '#17a2b8';
    }
}

// Búsqueda de reportes
buscarReporteBtn.addEventListener('click', () => {
    const query = buscadorInput.value.trim();
    loadReports(query);
});

// Modal de imágenes
function openImageModal(imageUrl) {
    modalImage.src = imageUrl;
    imageModal.style.display = 'block';
}

closeButton.addEventListener('click', () => {
    imageModal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera de la imagen
window.addEventListener('click', (event) => {
    if (event.target === imageModal) {
        imageModal.style.display = 'none';
    }
});

// Inicializar: Validar formulario al cargar la página por primera vez
document.addEventListener('DOMContentLoaded', () => {
    checkFormValidity();
});

// Función para comprimir imágenes antes de enviarlas
async function compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensionar manteniendo proporciones (max 800px en el lado mayor)
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a JPEG con calidad ajustable
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
        };
    });
}
