document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarDisponibles()
    cargarPendientes()
})

async function cargarDisponibles() {
    const tbody = document.getElementById('disponibles-table')
    try {
        const response = await apiGet('/revisor/solicitudes/disponibles')
        const items = response.data || []
        
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6">No hay solicitudes disponibles.</td></tr>'
            return
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${item.solicitud_id || '-'}</td>
                <td>${item.estudiante_nombre || '-'}</td>
                <td>${item.beca_nombre || '-'}</td>
                <td>${formatMoney(item.monto_solicitado)}</td>
                <td>${item.fecha_envio || '-'}</td>
                <td><button class="btn btn-primary" onclick="tomarCaso('${item.solicitud_id}')">Tomar Caso</button></td>
            </tr>
        `).join('')
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6">Error cargando solicitudes.</td></tr>'
    }
}

async function cargarPendientes() {
    const tbody = document.getElementById('pendientes-table')
    const riesgo = document.getElementById('riesgo-filter').value
    
    try {
        let url = '/revisor/solicitudes/pendientes'
        if (riesgo) {
            url = `/revisor/solicitudes/riesgo?Nivel_Riesgo=${riesgo}`
        }
        
        const response = await apiGet(url)
        const items = response.data || []
        
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="7">No tienes solicitudes pendientes.</td></tr>'
            return
        }

        tbody.innerHTML = items.map((item) => `
            <tr>
                <td>${item.solicitud_id || '-'}</td>
                <td>${item.estudiante_nombre || '-'}</td>
                <td>${item.beca_nombre || '-'}</td>
                <td>${formatMoney(item.monto_solicitado)}</td>
                <td>${statusBadge(item.estado)}</td>
                <td>${riskBadge(item.riesgo || 'Bajo')}</td>
                <td><a class="btn btn-secondary" href="/revisor/solicitud/${item.solicitud_id}">Evaluar</a></td>
            </tr>
        `).join('')
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7">Error cargando solicitudes.</td></tr>'
    }
}

async function tomarCaso(solicitudId) {
    try {
        await apiPatch(`/revisor/solicitud/${solicitudId}/tomar`)
        mostrarToast('Caso tomado con éxito', 'success')
        cargarDisponibles()
        cargarPendientes()
    } catch (error) {
        mostrarToast(error.message, 'error')
    }
}