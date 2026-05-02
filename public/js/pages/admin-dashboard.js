document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarDashboard()
  cargarPagosFallidos()
  cargarBecasSelect()
})

async function cargarBecasSelect() {
  const select = document.getElementById('beca-id-select')
  try {
    const response = await apiGet('/admin/lista/becas')
    const becas = response.data || []
    if (becas.length === 0) {
      select.innerHTML = '<option value="">Sin becas</option>'
      return
    }
    select.innerHTML = '<option value="">Selecciona una beca</option>' + becas.map(b => `<option value="${b.id}">${b.nombre} (${b.id})</option>`).join('')
  } catch (error) {
    select.innerHTML = '<option value="">Error cargando</option>'
  }
}

async function cargarDashboard() {
  const message = document.getElementById('message')

  const results = await Promise.allSettled([
    apiGet('/api/alerts/stats'),
    apiGet('/api/reports/accounts/stats')
  ])

  const alertStatsResult = results[0]
  const accountStatsResult = results[1]

  // Alertas
  if (alertStatsResult.status === 'fulfilled') {
    const stats = alertStatsResult.value.data || {}
    document.getElementById('total-alertas').textContent = formatNumber(stats.total_alertas)
    document.getElementById('alertas-pendientes').textContent = formatNumber(stats.alertas_pendientes)
    document.getElementById('riesgo-promedio').textContent = stats.riesgo_promedio || 0
  } else {
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
    document.getElementById('cuentas-compartidas').textContent = '0'
  }
}

async function cargarPromediosBajos() {
  const select = document.getElementById('beca-id-select')
  const becaId = select.value.trim()
  const tbody = document.getElementById('promedios-table')

  if (!becaId) {
    mostrarToast('Selecciona una beca primero', 'warning')
    return
  }

  tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>'

  try {
    const response = await apiGet(`/admin/estudiantes/promedio/${becaId}`)
    const items = response.data || []
    
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="3">No se encontraron estudiantes sospechosos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item.id || '-'}</td>
        <td>${item.nombre || '-'}</td>
        <td style="color: #ef4444; font-weight: bold;">${item.promedio || 0}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`
  }
}

async function cargarPagosFallidos() {
  const tbody = document.getElementById('pagos-table')
  tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>'

  try {
    const response = await apiGet('/admin/pagos/fallidos')
    const items = response.data || []
    
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="3">No hay pagos fallidos en bucle.</td></tr>'
      return
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item.ID || item.estudiante_id || '-'}</td>
        <td>${item.nombre || '-'}</td>
        <td style="color: #ef4444; font-weight: bold;">${item.Intentos || 0}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`
  }
}