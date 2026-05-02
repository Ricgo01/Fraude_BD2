document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarDisponibles()
})

async function cargarDisponibles() {
    const tbody = document.getElementById('disponibles-table')
    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>'

    try {
        const response = await apiGet('/revisor/solicitudes/disponibles')
        const items = response.data || []

        console.log('disponibles:', JSON.stringify(items.slice(0, 2), null, 2))

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No hay solicitudes disponibles para tomar.</td></tr>'
            return
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td title="${item.solicitud_id}">${shortId(item.solicitud_id)}</td>
                <td>${item.estudiante || '-'}</td>
                <td>${item.beca || '-'}</td>
                <td>${formatMoney(item.monto)}</td>
                <td>${formatNeoDate(item.fecha_envio)}</td>
                <td>
                    <button class="btn btn-primary" onclick="tomarCaso('${item.solicitud_id}')">Tomar Caso</button>
                </td>
            </tr>
        `).join('')
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Error cargando solicitudes: ${error.message}</td></tr>`
    }
}

async function tomarCaso(solicitudId) {
    if (!confirm('¿Deseas tomar este caso? Quedará asignado a tu cola de revisión.')) return
    try {
        await apiPatch(`/revisor/solicitud/${solicitudId}/tomar`)
        mostrarToast('¡Caso tomado exitosamente! Ya aparece en "Mis Casos".', 'success')
        cargarDisponibles()
    } catch (error) {
        mostrarToast(error.message, 'error')
    }
}
