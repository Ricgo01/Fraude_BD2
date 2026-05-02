let direccionActualId = null
let direccionesCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarDirecciones()
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
    direccionActualId = null
    cargarDirecciones()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarDirecciones() {
  const tbody = document.getElementById('direcciones-table')
  const select = document.getElementById('direccion-select')

  try {
    const response = await apiGet('/estudiante/direcciones')
    direccionesCache = response.data || []

    if (!direccionesCache.length) {
      tbody.innerHTML = '<tr><td colspan="4">No hay direcciones registradas.</td></tr>'
      select.innerHTML = '<option value="">Sin direcciones registradas</option>'
      return
    }

    tbody.innerHTML = direccionesCache.map((direccion) => `
      <tr>
        <td>${direccion.Direccion || '-'}</td>
        <td>${direccion.Municipio || '-'}</td>
        <td>${direccion.Departamento || '-'}</td>
        <td>${direccion.Verificada ? 'Si' : 'No'}</td>
      </tr>
    `).join('')

    select.innerHTML = ['<option value="">Selecciona una direccion</option>']
      .concat(direccionesCache.map((direccion) => (
        `<option value="${direccion.ID}">${direccion.Direccion || 'Direccion'} - ${direccion.Municipio || ''}</option>`
      )))
      .join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error cargando direcciones.</td></tr>'
  }
}

function seleccionarDireccion() {
  const select = document.getElementById('direccion-select')
  const selectedId = select.value
  if (!selectedId) return

  const direccion = direccionesCache.find((item) => item.ID === selectedId)
  if (!direccion) return

  direccionActualId = direccion.ID
  document.getElementById('direccion').value = direccion.Direccion || ''
  document.getElementById('municipio').value = direccion.Municipio || ''
  document.getElementById('departamento').value = direccion.Departamento || ''
  document.getElementById('verificada').value = direccion.Verificada ? 'true' : 'false'
  document.getElementById('desdeFecha').value = direccion.Desde_Fecha || ''
  document.getElementById('tipoResidencia').value = direccion.Tipo_Residencia || ''
}

async function actualizarDireccion() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!direccionActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona una direccion para actualizar.</div>'
    return
  }

  const payload = {
    Direccion: document.getElementById('direccion').value.trim(),
    Municipio: document.getElementById('municipio').value.trim(),
    Departamento: document.getElementById('departamento').value.trim(),
    Verificada: document.getElementById('verificada').value === 'true',
    Desde_Fecha: document.getElementById('desdeFecha').value,
    Tipo_Residencia: document.getElementById('tipoResidencia').value.trim()
  }

  try {
    await apiPatch(`/estudiante/direccion/${direccionActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Direccion actualizada.</div>'
    cargarDirecciones()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
