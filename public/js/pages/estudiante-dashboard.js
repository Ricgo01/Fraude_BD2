document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarResumen()
})

async function cargarResumen() {
  const solicitudesTable = document.getElementById('solicitudes-table')

  try {
    const [solicitudesResponse, documentosResponse] = await Promise.all([
      apiGet('/estudiante/solicitudes'),
      apiGet('/estudiante/documentos')
    ])

    const solicitudes = solicitudesResponse.data || []
    const documentos = documentosResponse.data || []

    document.getElementById('total-solicitudes').textContent = formatNumber(solicitudes.length)
    document.getElementById('solicitudes-pendientes').textContent = formatNumber(
      solicitudes.filter(s => String(s.Estado).toLowerCase().includes('pend')).length
    )
    document.getElementById('solicitudes-aprobadas').textContent = formatNumber(
      solicitudes.filter(s => String(s.Estado).toLowerCase().includes('aprob')).length
    )
    document.getElementById('total-documentos').textContent = formatNumber(documentos.length)

    if (!solicitudes.length) {
      solicitudesTable.innerHTML = '<tr><td colspan="5">No hay solicitudes registradas.</td></tr>'
      return
    }

    solicitudesTable.innerHTML = solicitudes.slice(0, 5).map((solicitud) => `
      <tr>
        <td>${solicitud.ID || '-'}</td>
        <td>${formatMoney(solicitud.Monto_Solicitado)}</td>
        <td>${statusBadge(solicitud.Estado)}</td>
        <td>${solicitud.Fecha_Envio || '-'}</td>
        <td>
          <a class="btn btn-secondary" href="/estudiante/solicitudes/${solicitud.ID}">Ver</a>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    solicitudesTable.innerHTML = '<tr><td colspan="5">Error cargando solicitudes.</td></tr>'
  }
}
