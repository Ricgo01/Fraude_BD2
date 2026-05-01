document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarAgregaciones()
  cargarSolicitudesEstados()
  cargarDocumentosInvalidos()
  cargarPagosFallidos()
  cargarCuentasStats()
})

function parseIds(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
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
    tbody.innerHTML = '<tr><td colspan="5">Ingresa un ID de revisor.</td></tr>'
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
  const ids = parseIds(document.getElementById('auditar-solicitudes').value)
  if (!ids.length) return

  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    showMessage('success', 'Solicitudes auditadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function desactivarEstudiantes() {
  const ids = parseIds(document.getElementById('desactivar-estudiantes').value)
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
  const ids = parseIds(document.getElementById('alertas-campo').value)
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas/campo', { alertaIds: ids })
    showMessage('success', 'Campo eliminado en alertas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function eliminarAlertasResueltas() {
  const ids = parseIds(document.getElementById('alertas-resueltas').value)
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
  const ids = parseIds(document.getElementById('auditar-adjuntas').value)
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/auditar', { solicitudIds: ids })
    showMessage('success', 'Adjuntas auditadas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function desauditarAdjuntas() {
  const ids = parseIds(document.getElementById('desauditar-adjuntas').value)
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/desauditar', { solicitudIds: ids })
    showMessage('success', 'Auditado eliminado en adjuntas.')
  } catch (error) {
    showMessage('error', error.message)
  }
}

async function actualizarEstadoAlertas() {
  const ids = parseIds(document.getElementById('estado-alerta-ids').value)
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
  const ids = parseIds(document.getElementById('relaciones-alerta').value)
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
