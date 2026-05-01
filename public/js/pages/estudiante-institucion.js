document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
})

async function guardarInstitucion() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Nombre: document.getElementById('nombre').value.trim(),
    Tipo: document.getElementById('tipo').value.trim(),
    Departamento: document.getElementById('departamento').value.trim(),
    Publica: document.getElementById('publica').value === 'true',
    Fecha_Convenio: document.getElementById('fechaConvenio').value,
    Desde_Fecha: document.getElementById('desdeFecha').value,
    Carrera: document.getElementById('carrera').value.trim(),
    Estado_Academico: document.getElementById('estadoAcademico').value.trim()
  }

  try {
    await apiPost('/estudiante/institucion', payload)
    message.innerHTML = '<div class="alert alert-success">Institucion vinculada.</div>'
    document.getElementById('institucion-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
