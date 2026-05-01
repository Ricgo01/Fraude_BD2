document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return

  const form = document.getElementById('csv-form')
  const message = document.getElementById('message')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    message.innerHTML = ''

    const fileInput = document.getElementById('csvFile')
    if (!fileInput.files.length) {
      message.innerHTML = '<div class="alert alert-error">Selecciona un archivo CSV.</div>'
      return
    }

    const formData = new FormData()
    formData.append('archivo', fileInput.files[0])

    try {
      const result = await apiPost('/admin/estudiantes/csv', formData)
      message.innerHTML = `<div class="alert alert-success">${result.message || 'Carga completada.'}</div>`
      form.reset()
    } catch (error) {
      message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
    }
  })
})
