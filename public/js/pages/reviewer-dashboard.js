document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarKPIs()
    cargarUrgentes()
})

async function cargarKPIs() {
    try {
        const [disponiblesRes, misCasosRes, altoRiesgoRes] = await Promise.allSettled([
            apiGet('/revisor/solicitudes/disponibles'),
            apiGet('/revisor/solicitudes/pendientes'),
            apiGet('/revisor/solicitudes/riesgo?Nivel_Riesgo=alto')
        ])

        if (disponiblesRes.status === 'fulfilled') {
            document.getElementById('kpi-disponibles').textContent =
                formatNumber((disponiblesRes.value.data || []).length)
        }
        if (misCasosRes.status === 'fulfilled') {
            document.getElementById('kpi-mis-casos').textContent =
                formatNumber((misCasosRes.value.data || []).length)
        }
        if (altoRiesgoRes.status === 'fulfilled') {
            document.getElementById('kpi-alto-riesgo').textContent =
                formatNumber((altoRiesgoRes.value.data || []).length)
        }
    } catch (error) {
        console.error('Error cargando KPIs:', error)
    }
}

async function cargarUrgentes() {
    const tbody = document.getElementById('urgentes-table')
    try {
        const response = await apiGet('/revisor/solicitudes/riesgo?Nivel_Riesgo=alto')
        const items = (response.data || []).slice(0, 5)

        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No tienes casos de alto riesgo. ✅</td></tr>'
            return
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td title="${item.solicitud_id}">${shortId(item.solicitud_id)}</td>
                <td>${item.estudiante_nombre || '-'}</td>
                <td>${item.beca_nombre || '-'}</td>
                <td>${formatMoney(item.monto_solicitado)}</td>
                <td>${statusBadge(item.estado)}</td>
                <td>
                    <a class="btn btn-primary" href="/revisor/solicitud/${item.solicitud_id}" style="background: #ef4444;">⚡ Atender</a>
                </td>
            </tr>
        `).join('')
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#6b7280;">No hay casos de alto riesgo o aún no tienes casos asignados.</td></tr>`
    }
}