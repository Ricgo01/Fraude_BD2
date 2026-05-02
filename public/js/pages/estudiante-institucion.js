let institucionActualId = null
let institucionesCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarInstituciones()
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
    institucionActualId = null
    cargarInstituciones()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarInstituciones() {
  const tbody = document.getElementById('instituciones-table')
  const select = document.getElementById('institucion-select')

  try {
    const response = await apiGet('/estudiante/instituciones')
    institucionesCache = response.data || []

    if (!institucionesCache.length) {
      tbody.innerHTML = '<tr><td colspan="4">No hay instituciones registradas.</td></tr>'
      select.innerHTML = '<option value="">Sin instituciones registradas</option>'
      return
    }

    tbody.innerHTML = institucionesCache.map((institucion) => `
      <tr>
        <td>${institucion.Nombre || '-'}</td>
        <td>${institucion.Tipo || '-'}</td>
        <td>${institucion.Departamento || '-'}</td>
        <td>${institucion.Publica ? 'Si' : 'No'}</td>
      </tr>
    `).join('')

    select.innerHTML = ['<option value="">Selecciona una institucion</option>']
      .concat(institucionesCache.map((institucion) => (
        `<option value="${institucion.ID}">${institucion.Nombre || 'Institucion'} - ${institucion.Departamento || ''}</option>`
      )))
      .join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error cargando instituciones.</td></tr>'
  }
}

function seleccionarInstitucion() {
  const select = document.getElementById('institucion-select')
  const selectedId = select.value
  if (!selectedId) return

  const institucion = institucionesCache.find((item) => item.ID === selectedId)
  if (!institucion) return

  institucionActualId = institucion.ID
  document.getElementById('nombre').value = institucion.Nombre || ''
  document.getElementById('tipo').value = institucion.Tipo || ''
  document.getElementById('departamento').value = institucion.Departamento || ''
  document.getElementById('publica').value = institucion.Publica ? 'true' : 'false'
  document.getElementById('fechaConvenio').value = institucion.Fecha_Convenio || ''
  document.getElementById('desdeFecha').value = institucion.Desde_Fecha || ''
  document.getElementById('carrera').value = institucion.Carrera || ''
  document.getElementById('estadoAcademico').value = institucion.Estado_Academico || ''
}

async function actualizarInstitucion() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!institucionActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona una institucion para actualizar.</div>'
    return
  }

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
    await apiPatch(`/estudiante/institucion/${institucionActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Institucion actualizada.</div>'
    cargarInstituciones()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
