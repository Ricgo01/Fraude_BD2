document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
})

async function guardarDispositivo() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Navegador: document.getElementById('navegador').value.trim(),
    Sistema_Operativo: document.getElementById('sistema').value.trim()
  }

  try {
    await apiPost('/estudiante/dispositivo', payload)
    message.innerHTML = '<div class="alert alert-success">Dispositivo registrado.</div>'
    document.getElementById('dispositivo-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
