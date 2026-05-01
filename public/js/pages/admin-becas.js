document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarBecasStats()
})

async function crearBeca() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Nombre_Beca: document.getElementById('nombreBeca').value.trim(),
    Categoria: document.getElementById('categoria').value.trim(),
    Monto_Max: document.getElementById('montoMax').value,
    Renovable: document.getElementById('renovable').value === 'true',
    Fecha_Inicio: document.getElementById('fechaInicio').value
  }

  try {
    await apiPost('/admin/beca', payload)
    message.innerHTML = '<div class="alert alert-success">Beca creada correctamente.</div>'
    cargarBecasStats()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarBecasStats() {
  const tbody = document.getElementById('becas-table')
  try {
    const response = await apiGet('/api/reports/scholarships/stats')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7">No hay datos disponibles.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.beca_id || '-'}</td>
        <td>${item.nombre_beca || '-'}</td>
        <td>${item.categoria || '-'}</td>
        <td>${formatNumber(item.numero_solicitudes)}</td>
        <td>${formatMoney(item.monto_promedio)}</td>
        <td>${formatMoney(item.monto_minimo_solicitado)}</td>
        <td>${formatMoney(item.monto_maximo_solicitado)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7">Error cargando estadisticas.</td></tr>'
  }
}

async function filtrarEstudiantes() {
  const becaId = document.getElementById('becaFiltroId').value.trim()
  const tbody = document.getElementById('estudiantes-table')

  if (!becaId) {
    tbody.innerHTML = '<tr><td colspan="4">Ingresa un ID de beca.</td></tr>'
    return
  }

  try {
    const response = await apiGet(`/admin/estudiantes/promedio/${becaId}`)
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4">Sin resultados.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.ID || '-'}</td>
        <td>${item.Nombre_Completo || '-'}</td>
        <td>${item.Email || '-'}</td>
        <td>${item.Promedio || 0}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error consultando estudiantes.</td></tr>'
  }
}
