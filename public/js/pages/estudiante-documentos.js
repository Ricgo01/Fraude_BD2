let documentoActualId = null
let documentosCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return

  const filter = document.getElementById('documento-filter')
  filter.addEventListener('change', cargarDocumentos)

  cargarSolicitudesSelect()
  cargarDocumentos()
})

async function crearDocumento() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Solicitud_ID: document.getElementById('solicitudId').value.trim(),
    Tipo: document.getElementById('tipo').value.trim(),
    Hash: document.getElementById('hash').value.trim(),
    Palabras_Clave: document.getElementById('palabras').value.trim()
  }

  if (!payload.Solicitud_ID || !payload.Tipo || !payload.Hash) {
    message.innerHTML = '<div class="alert alert-error">Completa todos los campos.</div>'
    return
  }

  try {
    await apiPost('/estudiante/documento', payload)
    message.innerHTML = '<div class="alert alert-success">Documento adjuntado.</div>'
    document.getElementById('documento-form').reset()
    documentoActualId = null
    cargarDocumentos()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function actualizarDocumento() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!documentoActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona un documento para actualizar.</div>'
    return
  }

  const payload = {
    Tipo: document.getElementById('tipo').value.trim(),
    Hash: document.getElementById('hash').value.trim(),
    Palabras_Clave: document.getElementById('palabras').value.trim()
  }

  if (!payload.Tipo || !payload.Hash) {
    message.innerHTML = '<div class="alert alert-error">Completa tipo y hash.</div>'
    return
  }

  try {
    await apiPatch(`/estudiante/documento/${documentoActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Documento actualizado.</div>'
    cargarDocumentos()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarSolicitudesSelect() {
  const select = document.getElementById('solicitudId')
  try {
    const response = await apiGet('/estudiante/solicitudes')
    const solicitudes = response.data || []

    if (!solicitudes.length) {
      select.innerHTML = '<option value="">Sin solicitudes registradas</option>'
      return
    }

    select.innerHTML = ['<option value="">Selecciona una solicitud</option>']
      .concat(solicitudes.map((solicitud) => (
        `<option value="${solicitud.ID}">${solicitud.ID} - ${solicitud.Estado || ''}</option>`
      )))
      .join('')
  } catch (error) {
    select.innerHTML = '<option value="">Error cargando solicitudes</option>'
  }
}

async function cargarDocumentos() {
  const tbody = document.getElementById('documentos-table')
  const filtro = document.getElementById('documento-filter').value
  const query = filtro ? `?Es_Valido=${encodeURIComponent(filtro)}` : ''

  try {
    const response = await apiGet(`/estudiante/documentos${query}`)
    documentosCache = response.data || []

    if (!documentosCache.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay documentos.</td></tr>'
      return
    }

    tbody.innerHTML = documentosCache.map((doc) => `
      <tr>
        <td>${doc.ID || '-'}</td>
        <td>${doc.Tipo || '-'}</td>
        <td>${doc.Es_Valido === true ? 'Si' : doc.Es_Valido === false ? 'No' : '-'}</td>
        <td>${doc.Fecha_Carga || '-'}</td>
        <td>
          <button class="btn btn-secondary" onclick="seleccionarDocumento('${doc.ID}')">Editar</button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando documentos.</td></tr>'
  }
}

function seleccionarDocumento(documentoId) {
  const documento = documentosCache.find((item) => item.ID === documentoId)
  if (!documento) return

  documentoActualId = documento.ID
  document.getElementById('tipo').value = documento.Tipo || ''
  document.getElementById('hash').value = documento.Hash || ''
  document.getElementById('palabras').value = documento.Palabras_Clave || ''
}
