document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
})

async function guardarReferencia() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Nombre: document.getElementById('nombre').value.trim(),
    Telefono: document.getElementById('telefono').value.trim(),
    Relacion: document.getElementById('relacion').value.trim(),
    Verificada: document.getElementById('verificada').value === 'true',
    Tipo_Aval: document.getElementById('tipoAval').value.trim()
  }

  try {
    await apiPost('/estudiante/referencia', payload)
    message.innerHTML = '<div class="alert alert-success">Referencia registrada.</div>'
    document.getElementById('referencia-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
