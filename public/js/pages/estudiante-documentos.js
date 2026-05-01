document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return

  const filter = document.getElementById('documento-filter')
  filter.addEventListener('change', cargarDocumentos)

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
    cargarDocumentos()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarDocumentos() {
  const tbody = document.getElementById('documentos-table')
  const filtro = document.getElementById('documento-filter').value
  const query = filtro ? `?Es_Valido=${encodeURIComponent(filtro)}` : ''

  try {
    const response = await apiGet(`/estudiante/documentos${query}`)
    const documentos = response.data || []

    if (!documentos.length) {
      tbody.innerHTML = '<tr><td colspan="4">No hay documentos.</td></tr>'
      return
    }

    tbody.innerHTML = documentos.map((doc) => `
      <tr>
        <td>${doc.ID || '-'}</td>
        <td>${doc.Tipo || '-'}</td>
        <td>${doc.Es_Valido === true ? 'Si' : doc.Es_Valido === false ? 'No' : '-'}</td>
        <td>${doc.Fecha_Carga || '-'}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error cargando documentos.</td></tr>'
  }
}
