let referenciaActualId = null
let referenciasCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarReferencias()
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
    referenciaActualId = null
    cargarReferencias()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarReferencias() {
  const tbody = document.getElementById('referencias-table')
  const select = document.getElementById('referencia-select')

  try {
    const response = await apiGet('/estudiante/referencias')
    referenciasCache = response.data || []

    if (!referenciasCache.length) {
      tbody.innerHTML = '<tr><td colspan="4">No hay referencias registradas.</td></tr>'
      select.innerHTML = '<option value="">Sin referencias registradas</option>'
      return
    }

    tbody.innerHTML = referenciasCache.map((ref) => `
      <tr>
        <td>${ref.Nombre || '-'}</td>
        <td>${ref.Telefono || '-'}</td>
        <td>${ref.Relacion || '-'}</td>
        <td>${ref.Verificada ? 'Si' : 'No'}</td>
      </tr>
    `).join('')

    select.innerHTML = ['<option value="">Selecciona una referencia</option>']
      .concat(referenciasCache.map((ref) => (
        `<option value="${ref.ID}">${ref.Nombre || 'Referencia'} - ${ref.Telefono || ''}</option>`
      )))
      .join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error cargando referencias.</td></tr>'
  }
}

function seleccionarReferencia() {
  const select = document.getElementById('referencia-select')
  const selectedId = select.value
  if (!selectedId) return

  const referencia = referenciasCache.find((item) => item.ID === selectedId)
  if (!referencia) return

  referenciaActualId = referencia.ID
  document.getElementById('nombre').value = referencia.Nombre || ''
  document.getElementById('telefono').value = referencia.Telefono || ''
  document.getElementById('relacion').value = referencia.Relacion || ''
  document.getElementById('verificada').value = referencia.Verificada ? 'true' : 'false'
  document.getElementById('tipoAval').value = referencia.Tipo_Aval || ''
}

async function actualizarReferencia() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!referenciaActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona una referencia para actualizar.</div>'
    return
  }

  const payload = {
    Nombre: document.getElementById('nombre').value.trim(),
    Telefono: document.getElementById('telefono').value.trim(),
    Relacion: document.getElementById('relacion').value.trim(),
    Verificada: document.getElementById('verificada').value === 'true',
    Tipo_Aval: document.getElementById('tipoAval').value.trim()
  }

  try {
    await apiPatch(`/estudiante/referencia/${referenciaActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Referencia actualizada.</div>'
    cargarReferencias()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
