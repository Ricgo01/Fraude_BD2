document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarMisCasos()
})

let todosLosCasos = []

async function cargarMisCasos() {
    const tbody = document.getElementById('mis-casos-table')
    tbody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>'

    const estadoFilter = document.getElementById('estado-filter').value
    const riesgoFilter = document.getElementById('riesgo-filter').value

    try {
        let response
        if (riesgoFilter) {
            // Filtrar por riesgo usa el endpoint específico
            response = await apiGet(`/revisor/solicitudes/riesgo?Nivel_Riesgo=${encodeURIComponent(riesgoFilter)}`)
        } else {
            response = await apiGet('/revisor/solicitudes/pendientes')
        }

        let items = response.data || []
        console.log('mis-casos:', JSON.stringify(items.slice(0, 2), null, 2))

        // Filtro de estado adicional en cliente
        if (estadoFilter) {
            items = items.filter(i => i.estado === estadoFilter)
        }

        // Dedup por solicitud_id (bug 3)
        const seen = new Set()
        items = items.filter(i => {
            if (seen.has(i.solicitud_id)) return false
            seen.add(i.solicitud_id)
            return true
        })

        todosLosCasos = items

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#6b7280;">No tienes casos activos con ese filtro.</td></tr>'
            return
        }

        tbody.innerHTML = items.map(item => {
            const esActivo = ['Pendiente', 'En revisión'].includes(item.estado)
            const accion = esActivo
                ? `<a class="btn btn-primary" href="/revisor/solicitud/${item.solicitud_id}">Evaluar</a>`
                : `<a class="btn btn-secondary" href="/revisor/solicitud/${item.solicitud_id}">Ver detalle</a>`

            return `
            <tr>
                <td title="${item.solicitud_id}">${shortId(item.solicitud_id)}</td>
                <td>${item.estudiante_nombre || '-'}</td>
                <td>${item.beca_nombre || '-'}</td>
                <td>${formatMoney(item.monto_solicitado)}</td>
                <td>${statusBadge(item.estado)}</td>
                <td>${item.nivel_riesgo ? riskBadge(item.nivel_riesgo) : '-'}</td>
                <td>${formatNeoDate(item.fecha_envio)}</td>
                <td>${accion}</td>
            </tr>`
        }).join('')
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8">Error cargando casos: ${error.message}</td></tr>`
    }
}
