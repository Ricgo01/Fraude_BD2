let dispositivoActualId = null
let dispositivosCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarDispositivos()
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
    dispositivoActualId = null
    cargarDispositivos()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarDispositivos() {
  const tbody = document.getElementById('dispositivos-table')
  const select = document.getElementById('dispositivo-select')

  try {
    const response = await apiGet('/estudiante/dispositivos')
    dispositivosCache = response.data || []

    if (!dispositivosCache.length) {
      tbody.innerHTML = '<tr><td colspan="3">No hay dispositivos registrados.</td></tr>'
      select.innerHTML = '<option value="">Sin dispositivos registrados</option>'
      return
    }

    tbody.innerHTML = dispositivosCache.map((dispositivo) => `
      <tr>
        <td>${dispositivo.Navegador || '-'}</td>
        <td>${dispositivo.Sistema_Operativo || '-'}</td>
        <td>${dispositivo.Activo ? 'Si' : 'No'}</td>
      </tr>
    `).join('')

    select.innerHTML = ['<option value="">Selecciona un dispositivo</option>']
      .concat(dispositivosCache.map((dispositivo) => (
        `<option value="${dispositivo.ID}">${dispositivo.Navegador || 'Dispositivo'} - ${dispositivo.Sistema_Operativo || ''}</option>`
      )))
      .join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="3">Error cargando dispositivos.</td></tr>'
  }
}

function seleccionarDispositivo() {
  const select = document.getElementById('dispositivo-select')
  const selectedId = select.value
  if (!selectedId) return

  const dispositivo = dispositivosCache.find((item) => item.ID === selectedId)
  if (!dispositivo) return

  dispositivoActualId = dispositivo.ID
  document.getElementById('navegador').value = dispositivo.Navegador || ''
  document.getElementById('sistema').value = dispositivo.Sistema_Operativo || ''
}

async function actualizarDispositivo() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!dispositivoActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona un dispositivo para actualizar.</div>'
    return
  }

  const payload = {
    Navegador: document.getElementById('navegador').value.trim(),
    Sistema_Operativo: document.getElementById('sistema').value.trim()
  }

  try {
    await apiPatch(`/estudiante/dispositivo/${dispositivoActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Dispositivo actualizado.</div>'
    cargarDispositivos()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
