document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarAlertasPendientes()
  cargarCuentasCompartidas()
  cargarDocumentosReutilizados()
  cargarRedFraude()
})

async function cargarCuentasCompartidas() {
  const tbody = document.getElementById('shared-accounts-table')
  try {
    const response = await apiGet('/api/reports/fraud/shared-accounts')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay cuentas compartidas.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.cuenta_id || '-'}</td>
        <td>${item.banco || '-'}</td>
        <td>
          <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
            ${(item.estudiantes || []).map(e => `<li>${e.nombre || e.id}</li>`).join('')}
          </ul>
        </td>
        <td>${formatNumber(item.solicitudes ? item.solicitudes.length : 0)}</td>
        <td>${riskBadge(item.riesgo)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando cuentas compartidas.</td></tr>'
  }
}

async function cargarDocumentosReutilizados() {
  const tbody = document.getElementById('reused-documents-table')
  try {
    const response = await apiGet('/api/reports/fraud/reused-documents')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay documentos reutilizados.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.hash || '-'}</td>
        <td>
          <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
            ${(item.estudiantes || []).map(e => `<li>${e.nombre || e.id}</li>`).join('')}
          </ul>
        </td>
        <td>${formatNumber(item.documentos ? item.documentos.length : 0)}</td>
        <td>${formatNumber(item.solicitudes ? item.solicitudes.length : 0)}</td>
        <td>${riskBadge(item.riesgo)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando documentos reutilizados.</td></tr>'
  }
}

async function cargarRedFraude() {
  const tbody = document.getElementById('fraud-network-table')
  try {
    const response = await apiGet('/api/reports/fraud/network')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay redes detectadas.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.cuenta_id || '-'}</td>
        <td>${item.dispositivo_id || '-'}</td>
        <td>
          <ul style="margin: 0; padding-left: 20px; font-size: 0.9em;">
            ${(item.estudiantes || []).map(e => `<li>${e.nombre || e.id}</li>`).join('')}
          </ul>
        </td>
        <td>${formatNumber(item.solicitudes ? item.solicitudes.length : 0)}</td>
        <td>${riskBadge(item.riesgo)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando redes de fraude.</td></tr>'
  }
}

async function ejecutarDeteccion() {
  const message = document.getElementById('message')
  const confirmar = confirm('Deseas ejecutar la deteccion automatica?')
  if (!confirmar) return

  try {
    const result = await apiPost('/api/reports/fraud/check-all', {})
    const created = result.resumen
      ? result.resumen['alertas_autom\u00e1ticas_creadas'] || 0
      : 0
    message.innerHTML = `
      <div class="alert alert-success">
        Deteccion completada. Alertas creadas: ${created}
      </div>
    `
    cargarCuentasCompartidas()
    cargarDocumentosReutilizados()
    cargarRedFraude()
    cargarAlertasPendientes()
  } catch (error) {
    message.innerHTML = `
      <div class="alert alert-error">${error.message}</div>
    `
  }
}

async function cargarAlertasPendientes() {
  const tbody = document.getElementById('alerts-table')
  try {
    const response = await apiGet('/api/reports/alerts/pending')
    const alertas = response.data || []
    
    if (!alertas.length) {
      tbody.innerHTML = '<tr><td colspan="6">No hay alertas pendientes en el inbox.</td></tr>'
      return
    }

    tbody.innerHTML = alertas.map(alerta => `
      <tr>
        <td>${alerta.alerta_id || '-'}</td>
        <td>${traducirTipoAlerta(alerta.tipo_alerta)}</td>
        <td>${riskBadge(alerta.nivel_riesgo)}</td>
        <td>${alerta.puntaje_riesgo || 0}</td>
        <td><a href="/admin/alertas">${alerta.solicitud_id || '-'}</a></td>
        <td>${alerta.fecha_creacion || '-'}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6">Error cargando inbox de alertas.</td></tr>'
  }
}
