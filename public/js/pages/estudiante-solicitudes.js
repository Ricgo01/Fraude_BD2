document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return

  const filter = document.getElementById('estado-filter')
  filter.addEventListener('change', cargarSolicitudes)

  cargarSolicitudes()
})

async function cargarSolicitudes() {
  const tbody = document.getElementById('solicitudes-table')
  const estado = document.getElementById('estado-filter').value
  const query = estado ? `?Estado=${encodeURIComponent(estado)}` : ''

  try {
    const response = await apiGet(`/estudiante/solicitudes${query}`)
    const solicitudes = response.data || []

    if (!solicitudes.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay solicitudes.</td></tr>'
      return
    }

    tbody.innerHTML = solicitudes.map((solicitud) => `
      <tr>
        <td>${solicitud.ID || '-'}</td>
        <td>${formatMoney(solicitud.Monto_Solicitado)}</td>
        <td>${statusBadge(solicitud.Estado)}</td>
        <td>${solicitud.Fecha_Envio || '-'}</td>
        <td><a class="btn btn-secondary" href="/estudiante/solicitudes/${solicitud.ID}">Ver</a></td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando solicitudes.</td></tr>'
  }
}
