document.addEventListener('DOMContentLoaded', () => {
  cargarAlertas()
})

async function cargarAlertas() {
  const tbody = document.getElementById('alerts-table')
  const message = document.getElementById('message')

  try {
    message.innerHTML = ''

    const response = await apiGet('/api/reports/alerts/pending')
    const alertas = response.data || []

    if (alertas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">No hay alertas pendientes.</td>
        </tr>
      `
      return
    }

    tbody.innerHTML = alertas.map(alerta => `
      <tr>
        <td>${alerta.alerta_id || '-'}</td>
        <td>${traducirTipoAlerta(alerta.tipo_alerta)}</td>
        <td>${riskBadge(alerta.nivel_riesgo)}</td>
        <td>${alerta.puntaje_riesgo || 0}</td>
        <td>${alerta.solicitud_id || '-'}</td>
        <td>${alerta.solicitud_estado || '-'}</td>
        <td>${alerta.fecha_creacion || '-'}</td>
        <td>
          <button class="btn btn-secondary" onclick="resolverAlerta('${alerta.alerta_id}')">
            Resolver
          </button>
        </td>
      </tr>
    `).join('')

  } catch (error) {
    console.error(error)

    tbody.innerHTML = `
      <tr>
        <td colspan="8">No se pudieron cargar las alertas.</td>
      </tr>
    `

    message.innerHTML = `
      <div class="alert alert-error">
        Error cargando alertas. Revisa conexión con Neo4j o el endpoint de alertas.
      </div>
    `
  }
}

async function resolverAlerta(alertId) {
  const descripcion = prompt('Escribe la justificación o resolución de esta alerta:')

  if (!descripcion) {
    return
  }

  try {
    await apiPut(`/api/reports/alerts/${alertId}/resolve`, {
      descripcion_resolucion: descripcion
    })

    document.getElementById('message').innerHTML = `
      <div class="alert alert-success">
        Alerta marcada como resuelta correctamente.
      </div>
    `

    await cargarAlertas()

  } catch (error) {
    console.error(error)

    document.getElementById('message').innerHTML = `
      <div class="alert alert-error">
        No se pudo resolver la alerta.
      </div>
    `
  }
}

function traducirTipoAlerta(tipo) {
  const tipos = {
    SHARED_ACCOUNT: 'Cuenta compartida',
    REUSED_DOCUMENT: 'Documento reutilizado',
    FRAUD_NETWORK: 'Red de fraude'
  }

  return tipos[tipo] || tipo || '-'
}