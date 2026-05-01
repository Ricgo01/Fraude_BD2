document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
})

async function guardarDireccion() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Direccion: document.getElementById('direccion').value.trim(),
    Municipio: document.getElementById('municipio').value.trim(),
    Departamento: document.getElementById('departamento').value.trim(),
    Verificada: document.getElementById('verificada').value === 'true',
    Desde_Fecha: document.getElementById('desdeFecha').value,
    Tipo_Residencia: document.getElementById('tipoResidencia').value.trim()
  }

  try {
    await apiPost('/estudiante/direccion', payload)
    message.innerHTML = '<div class="alert alert-success">Direccion registrada.</div>'
    document.getElementById('direccion-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
