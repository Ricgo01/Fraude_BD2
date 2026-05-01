document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return

    const filter = document.getElementById('riesgo-filter')
    filter.addEventListener('change', cargarSolicitudes)

    cargarSolicitudes()
})

async function cargarSolicitudes() {
    const tbody = document.getElementById('requests-table')
    const nivelRiesgo = document.getElementById('riesgo-filter').value

    try {
        const url = nivelRiesgo
            ? `/revisor/solicitudes/riesgo?Nivel_Riesgo=${encodeURIComponent(nivelRiesgo)}`
            : '/revisor/solicitudes/pendientes'

        const response = await apiGet(url)
        const solicitudes = response.data || []

        if (!solicitudes.length) {
            tbody.innerHTML = '<tr><td colspan="7">No hay solicitudes.</td></tr>'
            return
        }

        tbody.innerHTML = solicitudes.map((solicitud) => {
            const id = solicitud.solicitud_id
            const estudiante = solicitud.estudiante_nombre || '-'
            const beca = solicitud.beca_nombre || '-'
            const monto = formatMoney(solicitud.monto_solicitado)
            const estado = statusBadge(solicitud.estado)
            const riesgo = solicitud.nivel_riesgo ? riskBadge(solicitud.nivel_riesgo) : '-'

            return `
                <tr>
                    <td>${id}</td>
                    <td>${estudiante}</td>
                    <td>${beca}</td>
                    <td>${monto}</td>
                    <td>${estado}</td>
                    <td>${riesgo}</td>
                    <td><a class="btn btn-secondary" href="/revisor/solicitud/${id}">Ver</a></td>
                </tr>
            `
        }).join('')
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7">Error cargando solicitudes.</td></tr>'
    }
}