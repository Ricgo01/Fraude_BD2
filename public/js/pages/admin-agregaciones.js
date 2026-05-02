document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarAgregaciones()
  cargarSolicitudesEstados()
  cargarDocumentosInvalidos()
  cargarPagosFallidos()
  cargarCuentasStats()
  cargarCatalogos()
})

function getSelectedValues(selectId) {
  const select = document.getElementById(selectId)
  if (!select) return []
  return Array.from(select.selectedOptions)
    .map(option => option.value)
    .filter(Boolean)
}

function fillSelect(selectId, items, labelFn, placeholder) {
  const select = document.getElementById(selectId)
  if (!select) return

  const options = (placeholder ? [`<option value="">${placeholder}</option>`] : [])
    .concat(items.map(item => `<option value="${item.ID}">${labelFn(item)}</option>`))

  select.innerHTML = options.join('')
}

async function cargarCatalogos() {
  const results = await Promise.allSettled([
    apiGet('/admin/lista/alertas'),
    apiGet('/admin/lista/solicitudes'),
    apiGet('/admin/lista/estudiantes'),
    apiGet('/admin/lista/dispositivos'),
    apiGet('/admin/revisores')
  ])

  const alertas = results[0].status === 'fulfilled' ? results[0].value.data || [] : []
  const solicitudes = results[1].status === 'fulfilled' ? results[1].value.data || [] : []
  const estudiantes = results[2].status === 'fulfilled' ? results[2].value.data || [] : []
  const dispositivos = results[3].status === 'fulfilled' ? results[3].value.data || [] : []
  const revisores = results[4].status === 'fulfilled' ? results[4].value.data || [] : []

  const alertasResueltas = alertas.filter(alerta => alerta.Resuelta === true || alerta.Resuelta === 'true')

  fillSelect('pendiente-revisor-id', revisores, (r) => `${r.Nombre || 'Revisor'} - ${r.ID}`, 'Selecciona un revisor')
  fillSelect('nota-revisor-id', revisores, (r) => `${r.Nombre || 'Revisor'} - ${r.ID}`, 'Selecciona un revisor')

  fillSelect('obs-alerta-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`, 'Selecciona una alerta')
  fillSelect('riesgo-alerta-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`, 'Selecciona una alerta')
  fillSelect('alerta-eliminar-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`, 'Selecciona una alerta')

  fillSelect('alertas-campo', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`)
  fillSelect('estado-alerta-ids', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`)
  fillSelect('relaciones-alerta', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`)
  fillSelect('alertas-resueltas', alertasResueltas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.ID}`)

  fillSelect('auditar-solicitudes', solicitudes, (s) => `${s.ID} - ${s.Estado || 'Sin estado'}`)
  fillSelect('auditar-adjuntas', solicitudes, (s) => `${s.ID} - ${s.Estado || 'Sin estado'}`)
  fillSelect('desauditar-adjuntas', solicitudes, (s) => `${s.ID} - ${s.Estado || 'Sin estado'}`)
  fillSelect('nota-solicitud-id', solicitudes, (s) => `${s.ID} - ${s.Estado || 'Sin estado'}`, 'Selecciona una solicitud')

  fillSelect('desactivar-estudiantes', estudiantes, (e) => `${e.Nombre_Completo || e.Email || 'Estudiante'} - ${e.ID}`)
  fillSelect('dispositivo-id', dispositivos, (d) => `${d.Navegador || 'Dispositivo'} - ${d.ID}`, 'Selecciona un dispositivo')
}

function showMessage(type, text) {
  const message = document.getElementById('message')
  if (!message) return
  message.innerHTML = `<div class="alert alert-${type}">${text}</div>`
}

async function cargarAgregaciones() {
  try {
    const response = await apiGet('/admin/agregaciones')
    const data = response.data || {}
    document.getElementById('max-riesgo').textContent = formatNumber(data.max_puntaje_riesgo)
    document.getElementById('min-promedio').textContent = formatNumber(data.min_promedio_estudiantes)
    document.getElementById('sum-depositos').textContent = formatMoney(data.sum_depositos_total || 0)
    document.getElementById('doc-rel').textContent = formatNumber((data.documentos_por_solicitud || []).length)
  } catch (error) {
    showMessage('error', 'Error cargando agregaciones.')
  }
}

async function cargarSolicitudesEstados() {
  const tbody = document.getElementById('solicitudes-estado-table')
  try {
    const response = await apiGet('/admin/solicitudes/estados')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="2">Sin datos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.estado || '-'}</td>
        <td>${formatNumber(item.total)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="2">Error cargando estados.</td></tr>'
  }
}

async function cargarPendientesRevisor() {
  const reviewerId = document.getElementById('pendiente-revisor-id').value.trim()
  const tbody = document.getElementById('pendientes-revisor-table')

  if (!reviewerId) {
    tbody.innerHTML = '<tr><td colspan="5">Selecciona un revisor.</td></tr>'
    return
  }

  try {
    const response = await apiGet(`/api/reports/pending?reviewerId=${encodeURIComponent(reviewerId)}`)
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5">Sin solicitudes pendientes.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.solicitud_id || '-'}</td>
        <td>${item.estudiante_nombre || '-'}</td>
        <td>${formatMoney(item.monto_solicitado)}</td>
        <td>${formatNeoDate(item.fecha_envio)}</td>
        <td>${item.estado || '-'}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error consultando pendientes.</td></tr>'
  }
}

async function cargarDocumentosInvalidos() {
  const tbody = document.getElementById('documentos-invalidos-table')
  try {
    const response = await apiGet('/admin/documentos/invalidos')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="3">Sin documentos invalidos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.ID || '-'}</td>
        <td>${item.Tipo || '-'}</td>
        <td>${formatNeoDate(item.Fecha_Carga)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="3">Error cargando documentos.</td></tr>'
  }
}

async function cargarPagosFallidos() {
  const tbody = document.getElementById('pagos-fallidos-table')
  try {
    const response = await apiGet('/admin/pagos/fallidos')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="3">Sin pagos fallidos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.ID || '-'}</td>
        <td>${formatMoney(item.Monto)}</td>
        <td>${formatNumber(item.Intentos)}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="3">Error cargando pagos.</td></tr>'
  }
}

async function cargarCuentasStats() {
  const tbody = document.getElementById('cuentas-table')
  try {
    const response = await apiGet('/api/reports/accounts/stats')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4">Sin datos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.cuenta_id || '-'}</td>
        <td>${item.banco || '-'}</td>
        <td>${formatNumber(item.numero_estudiantes)}</td>
        <td>${item.es_compartida ? 'Si' : 'No'}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error cargando cuentas.</td></tr>'
  }
}

