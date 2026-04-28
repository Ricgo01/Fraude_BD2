document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard()
})

async function cargarDashboard() {
  try {
    const [alertStats, accountStats, pendingAlerts] = await Promise.all([
      apiGet('/api/reports/alerts/stats'),
      apiGet('/api/reports/accounts/stats'),
      apiGet('/api/reports/alerts/pending')
    ])

    const stats = alertStats.data || {}
    const cuentasResumen = accountStats.resumen || {}
    const alertas = pendingAlerts.data || []

    document.getElementById('total-alertas').textContent = formatNumber(stats.total_alertas)
    document.getElementById('alertas-pendientes').textContent = formatNumber(stats.alertas_pendientes)
    document.getElementById('cuentas-compartidas').textContent = formatNumber(cuentasResumen.cuentas_compartidas)
    document.getElementById('riesgo-promedio').textContent = stats.riesgo_promedio || 0

    renderAlertas(alertas)
  } catch (error) {
    console.error(error)
    document.getElementById('message').innerHTML = `
      <div class="alert alert-error">
        No se pudieron cargar los datos. Revisa que Neo4j esté corriendo y que la API funcione.
      </div>
    `
  }
}

function renderAlertas(alertas) {
  const tbody = document.getElementById('alerts-table')

  if (!alertas || alertas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No hay alertas pendientes.</td>
      </tr>
    `
    return
  }

  tbody.innerHTML = alertas.slice(0, 8).map(alerta => `
    <tr>
      <td>${alerta.alerta_id || '-'}</td>
      <td>${alerta.tipo_alerta || '-'}</td>
      <td>${riskBadge(alerta.nivel_riesgo)}</td>
      <td>${alerta.puntaje_riesgo || 0}</td>
      <td>${alerta.solicitud_id || '-'}</td>
      <td>${alerta.fecha_creacion || '-'}</td>
    </tr>
  `).join('')
}

async function ejecutarDeteccion() {
  const confirmar = confirm('¿Deseas ejecutar la detección automática de fraude?')

  if (!confirmar) return

  try {
    const result = await apiPost('/api/reports/fraud/check-all', {})

    document.getElementById('message').innerHTML = `
      <div class="alert alert-success">
        Detección ejecutada correctamente. Alertas creadas: 
        ${result.resumen?.alertas_automáticas_creadas || 0}
      </div>
    `

    await cargarDashboard()
  } catch (error) {
    console.error(error)
    document.getElementById('message').innerHTML = `
      <div class="alert alert-error">
        No se pudo ejecutar la detección automática.
      </div>
    `
  }
}