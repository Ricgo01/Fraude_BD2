document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarDashboardRevisor()
})

async function cargarDashboardRevisor() {
    const message = document.getElementById('message')
    const pendientesTable = document.getElementById('pendientes-table')

    const results = await Promise.allSettled([
        apiGet('/revisor/solicitudes/pendientes/count'),
        apiGet('/revisor/solicitudes/riesgo?Nivel_Riesgo=alto'),
        apiGet('/revisor/solicitudes/riesgo?Nivel_Riesgo=medio'),
        apiGet('/revisor/solicitudes/riesgo?Nivel_Riesgo=bajo'),
        apiGet('/revisor/solicitudes/pendientes')
    ])

    const pendingCountResult = results[0]
    const altoResult = results[1]
    const medioResult = results[2]
    const bajoResult = results[3]
    const pendientesResult = results[4]

    if (pendingCountResult.status === 'fulfilled') {
        document.getElementById('pendientes-count').textContent =
            formatNumber(pendingCountResult.value.data?.total_pendientes || 0)
    } else {
        document.getElementById('pendientes-count').textContent = '0'
    }

    document.getElementById('riesgo-alto-count').textContent =
        altoResult.status === 'fulfilled'
            ? formatNumber((altoResult.value.data || []).length)
            : '0'
    document.getElementById('riesgo-medio-count').textContent =
        medioResult.status === 'fulfilled'
            ? formatNumber((medioResult.value.data || []).length)
            : '0'
    document.getElementById('riesgo-bajo-count').textContent =
        bajoResult.status === 'fulfilled'
            ? formatNumber((bajoResult.value.data || []).length)
            : '0'

    if (pendientesResult.status === 'fulfilled') {
        const pendientes = pendientesResult.value.data || []
        renderPendientes(pendientes)
    } else {
        pendientesTable.innerHTML = '<tr><td colspan="6">No se pudieron cargar las solicitudes.</td></tr>'
        message.innerHTML = `
            <div class="alert alert-error">
                Error cargando dashboard del revisor.
            </div>
        `
    }
}

function renderPendientes(items) {
    const tbody = document.getElementById('pendientes-table')

    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="6">No hay solicitudes pendientes.</td></tr>'
        return
    }

    tbody.innerHTML = items.map((item) => `
        <tr>
            <td>${item.solicitud_id || '-'}</td>
            <td>${item.estudiante_nombre || '-'}</td>
            <td>${item.beca_nombre || '-'}</td>
            <td>${formatMoney(item.monto_solicitado)}</td>
            <td>${item.fecha_envio || '-'}</td>
            <td><a class="btn btn-secondary" href="/revisor/solicitud/${item.solicitud_id}">Ver</a></td>
        </tr>
    `).join('')
}