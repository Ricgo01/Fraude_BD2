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
    document.getElementById('max-riesgo').textContent = data.max_puntaje_riesgo || 0
    document.getElementById('min-promedio').textContent = data.min_promedio_estudiantes || 0
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
        <td>${item.fecha_envio || '-'}</td>
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
        <td>${item.Fecha_Carga || '-'}</td>
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

async function agregarObservacion() {
  const id = document.getElementById('obs-alerta-id').value.trim()
  const texto = document.getElementById('obs-alerta-texto').value.trim()
  if (!id || !texto) return

  try {
    await apiPatch(`/admin/alerta/${id}/observacion`, { Observacion: texto })
    showMessage('success', 'Observacion agregada.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function actualizarNivelRiesgo() {
  const id = document.getElementById('riesgo-alerta-id').value.trim()
  const nivel = document.getElementById('riesgo-alerta-nivel').value
  if (!id) return

  try {
    await apiPatch(`/admin/alerta/${id}/riesgo`, { Nivel_Riesgo: nivel })
    showMessage('success', 'Nivel de riesgo actualizado.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function auditarSolicitudes() {
  const ids = getSelectedValues('auditar-solicitudes')
  if (!ids.length) return

  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    showMessage('success', 'Solicitudes auditadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function desactivarEstudiantes() {
  const ids = getSelectedValues('desactivar-estudiantes')
  if (!ids.length) return

  try {
    await apiPatch('/admin/estudiantes/desactivar', { estudianteIds: ids })
    showMessage('success', 'Estudiantes desactivados.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarIPHash() {
  const id = document.getElementById('dispositivo-id').value.trim()
  if (!id) return

  try {
    await apiDelete(`/admin/dispositivo/${id}/ip`)
    showMessage('success', 'IP hash eliminado.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarCampoAlertas() {
  const ids = getSelectedValues('alertas-campo')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas/campo', { alertaIds: ids })
    showMessage('success', 'Campo eliminado en alertas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarAlertasResueltas() {
  const ids = getSelectedValues('alertas-resueltas')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas', { alertaIds: ids })
    showMessage('success', 'Alertas resueltas eliminadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarAlerta() {
  const id = document.getElementById('alerta-eliminar-id').value.trim()
  if (!id) return

  try {
    await apiDelete(`/admin/alerta/${id}`)
    showMessage('success', 'Alerta eliminada.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function auditarAdjuntas() {
  const ids = getSelectedValues('auditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/auditar', { solicitudIds: ids })
    showMessage('success', 'Adjuntas auditadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function desauditarAdjuntas() {
  const ids = getSelectedValues('desauditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/desauditar', { solicitudIds: ids })
    showMessage('success', 'Auditado eliminado en adjuntas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function actualizarEstadoAlertas() {
  const ids = getSelectedValues('estado-alerta-ids')
  const estado = document.getElementById('estado-alerta').value.trim()
  if (!ids.length || !estado) return

  try {
    await apiPatch('/admin/alertas/estado', { alertaIds: ids, Estado_Alerta: estado })
    showMessage('success', 'Estado de alertas actualizado.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarRelacionesAlertas() {
  const ids = getSelectedValues('relaciones-alerta')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas/relaciones', { alertaIds: ids })
    showMessage('success', 'Relaciones eliminadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarNotaRevision() {
  const solicitudId = document.getElementById('nota-solicitud-id').value.trim()
  const revisorId = document.getElementById('nota-revisor-id').value.trim()
  if (!solicitudId || !revisorId) return

  try {
    await apiDelete(`/admin/solicitud/${solicitudId}/revisor/${revisorId}/nota`)
    showMessage('success', 'Nota eliminada.')
  } catch (error) {
    showMessage('error', error.message)
  }
}
