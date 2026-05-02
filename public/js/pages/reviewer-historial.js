document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarHistorial()
})

async function cargarHistorial() {
    const tbody = document.getElementById('historial-table')
    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>'

    const estadoFilter = document.getElementById('estado-filter').value

    try {
        const response = await apiGet('/revisor/solicitudes/historial')
        let items = response.data || []

        if (estadoFilter) {
            items = items.filter(i => i.estado === estadoFilter)
        }

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#6b7280;">No hay solicitudes resueltas con ese filtro.</td></tr>'
            return
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td title="${item.solicitud_id}">${shortId(item.solicitud_id)}</td>
                <td>${item.estudiante_nombre || '-'}</td>
                <td>${item.beca_nombre || '-'}</td>
                <td>${formatMoney(item.monto_solicitado)}</td>
                <td>${statusBadge(item.estado)}</td>
                <td>${formatNeoDate(item.fecha_resolucion)}</td>
                <td>
                    <a class="btn btn-secondary" href="/revisor/solicitud/${item.solicitud_id}">Ver detalle</a>
                </td>
            </tr>
        `).join('')
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Error cargando historial: ${error.message}</td></tr>`
    }
}
