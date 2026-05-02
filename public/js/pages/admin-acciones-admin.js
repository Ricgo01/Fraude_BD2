document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
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

async function agregarObservacion() {
  const id = document.getElementById('obs-alerta-id').value.trim()
  const texto = document.getElementById('obs-alerta-texto').value.trim()
  if (!id || !texto) return

  try {
    await apiPatch(`/admin/alerta/${id}/observacion`, { Observacion: texto })
    mostrarToast('Observacion agregada', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function actualizarNivelRiesgo() {
  const id = document.getElementById('riesgo-alerta-id').value.trim()
  const nivel = document.getElementById('riesgo-alerta-nivel').value
  if (!id) return

  try {
    await apiPatch(`/admin/alerta/${id}/riesgo`, { Nivel_Riesgo: nivel })
    mostrarToast('Nivel de riesgo actualizado', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function auditarSolicitudes() {
  const ids = getSelectedValues('auditar-solicitudes')
  if (!ids.length) return

  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    mostrarToast('Solicitudes auditadas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function desactivarEstudiantesConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const ids = getSelectedValues('desactivar-estudiantes')
  if (!ids.length) return

  try {
    await apiPatch('/admin/estudiantes/desactivar', { estudianteIds: ids })
    mostrarToast('Estudiantes desactivados', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarIPHashConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const id = document.getElementById('dispositivo-id').value.trim()
  if (!id) return

  try {
    await apiDelete(`/admin/dispositivo/${id}/ip`)
    mostrarToast('IP hash eliminado', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarCampoAlertasConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const ids = getSelectedValues('alertas-campo')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas/campo', { alertaIds: ids })
    mostrarToast('Campo eliminado en alertas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarAlertasResueltasConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const ids = getSelectedValues('alertas-resueltas')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas', { alertaIds: ids })
    mostrarToast('Alertas resueltas eliminadas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarAlertaConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const id = document.getElementById('alerta-eliminar-id').value.trim()
  if (!id) return

  try {
    await apiDelete(`/admin/alerta/${id}`)
    mostrarToast('Alerta eliminada', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function auditarAdjuntas() {
  const ids = getSelectedValues('auditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/auditar', { solicitudIds: ids })
    mostrarToast('Adjuntas auditadas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function desauditarAdjuntas() {
  const ids = getSelectedValues('desauditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/desauditar', { solicitudIds: ids })
    mostrarToast('Auditado eliminado en adjuntas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function actualizarEstadoAlertas() {
  const ids = getSelectedValues('estado-alerta-ids')
  const estado = document.getElementById('estado-alerta').value.trim()
  if (!ids.length || !estado) return

  try {
    await apiPatch('/admin/alertas/estado', { alertaIds: ids, Estado_Alerta: estado })
    mostrarToast('Estado de alertas actualizado', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarRelacionesAlertasConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const ids = getSelectedValues('relaciones-alerta')
  if (!ids.length) return

  try {
    await apiDelete('/admin/alertas/relaciones', { alertaIds: ids })
    mostrarToast('Relaciones eliminadas', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarNotaRevisionConfirm() {
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;
  const solicitudId = document.getElementById('nota-solicitud-id').value.trim()
  const revisorId = document.getElementById('nota-revisor-id').value.trim()
  if (!solicitudId || !revisorId) return

  try {
    await apiDelete(`/admin/solicitud/${solicitudId}/revisor/${revisorId}/nota`)
    mostrarToast('Nota eliminada', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}
