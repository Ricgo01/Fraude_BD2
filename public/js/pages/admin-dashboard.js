document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard()
})

async function cargarDashboard() {
  const message = document.getElementById('message')

  const results = await Promise.allSettled([
    apiGet('/api/reports/alerts/stats'),
    apiGet('/api/reports/accounts/stats'),
    apiGet('/api/reports/alerts/pending')
  ])

  const alertStatsResult = results[0]
  const accountStatsResult = results[1]
  const pendingAlertsResult = results[2]

  // Alertas
  if (alertStatsResult.status === 'fulfilled') {
    const stats = alertStatsResult.value.data || {}

    document.getElementById('total-alertas').textContent = formatNumber(stats.total_alertas)
    document.getElementById('alertas-pendientes').textContent = formatNumber(stats.alertas_pendientes)
    document.getElementById('riesgo-promedio').textContent = stats.riesgo_promedio || 0
  } else {
    console.error('Error cargando estadísticas de alertas:', alertStatsResult.reason)

    document.getElementById('total-alertas').textContent = '0'
    document.getElementById('alertas-pendientes').textContent = '0'
    document.getElementById('riesgo-promedio').textContent = '0'
  }

  // Cuentas
  if (accountStatsResult.status === 'fulfilled') {
    const cuentasResumen = accountStatsResult.value.resumen || {}

    document.getElementById('cuentas-compartidas').textContent =
      formatNumber(cuentasResumen.cuentas_compartidas)
  } else {
    console.error('Error cargando estadísticas de cuentas:', accountStatsResult.reason)

    document.getElementById('cuentas-compartidas').textContent = '0'

    message.innerHTML += `
      <div class="alert alert-error">
        No se pudieron cargar las estadísticas de cuentas. Revisa el endpoint 
        /api/reports/accounts/stats.
      </div>
    `
  }

  // Alertas pendientes
  if (pendingAlertsResult.status === 'fulfilled') {
    const alertas = pendingAlertsResult.value.data || []
    renderAlertas(alertas)
  } else {
    console.error('Error cargando alertas pendientes:', pendingAlertsResult.reason)

    document.getElementById('alerts-table').innerHTML = `
      <tr>
        <td colspan="6">No se pudieron cargar las alertas pendientes.</td>
      </tr>
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
      <td>${traducirTipoAlerta(alerta.tipo_alerta)}</td>
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