document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return

  const dropZone = document.getElementById('drop-zone')
  const fileInput = document.getElementById('csvFile')
  const fileInfo = document.getElementById('file-info')
  const fileNameDisplay = document.getElementById('file-name')
  const btnUpload = document.getElementById('btn-upload')

  // Prevent default drag behaviors
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false)
    document.body.addEventListener(eventName, preventDefaults, false)
  })

  // Highlight drop zone when item is dragged over it
  ;['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false)
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false)
  })

  // Handle dropped files
  dropZone.addEventListener('drop', handleDrop, false)
  
  // Handle click to select
  dropZone.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', handleFiles)

  function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function highlight(e) {
    dropZone.style.backgroundColor = '#e5e7eb'
    dropZone.style.borderColor = '#6b7280'
  }

  function unhighlight(e) {
    dropZone.style.backgroundColor = '#f9fafb'
    dropZone.style.borderColor = '#9ca3af'
  }

  function handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files
    fileInput.files = files // Assign to input
    handleFiles()
  }

  function handleFiles() {
    if (fileInput.files.length) {
      const file = fileInput.files[0]
      if (!file.name.endsWith('.csv')) {
        mostrarToast('Por favor, selecciona un archivo .csv', 'error')
        fileInput.value = ''
        return
      }
      fileNameDisplay.textContent = file.name
      fileInfo.style.display = 'block'
      btnUpload.style.display = 'block'
    }
  }
})

async function subirArchivo() {
  const fileInput = document.getElementById('csvFile')
  const message = document.getElementById('message')
  const fileInfo = document.getElementById('file-info')
  const btnUpload = document.getElementById('btn-upload')

  if (!fileInput.files.length) {
    mostrarToast('Selecciona un archivo CSV.', 'error')
    return
  }

  const formData = new FormData()
  formData.append('archivo', fileInput.files[0])

  btnUpload.disabled = true
  btnUpload.textContent = 'Cargando...'

  try {
    const result = await apiPost('/admin/estudiantes/csv', formData)
    message.innerHTML = `<div class="alert alert-success">${result.message || 'Carga completada.'}</div>`
    
    // Reset
    fileInput.value = ''
    fileInfo.style.display = 'none'
    btnUpload.style.display = 'none'
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  } finally {
    btnUpload.disabled = false
    btnUpload.textContent = 'Cargar Estudiantes CSV'
  }
}
