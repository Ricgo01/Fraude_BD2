document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarCatalogos()
})

function getSelectedValues(selectId) {
  const select = document.getElementById(selectId)
  if (select && select.tagName === 'SELECT') {
    return Array.from(select.selectedOptions)
      .map(option => option.value)
      .filter(Boolean)
  }
  // Checkboxes
  const checkboxes = document.querySelectorAll(`.cb-${selectId}`)
  if (checkboxes.length > 0) {
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value)
  }
  return []
}

function fillSelect(selectId, items, labelFn, placeholder) {
  const select = document.getElementById(selectId)
  if (!select) return

  const options = (placeholder ? [`<option value="">${placeholder}</option>`] : [])
    .concat(items.map(item => `<option value="${item.ID}">${labelFn(item)}</option>`))

  select.innerHTML = options.join('')
}

function fillCheckboxes(containerId, items, labelFn, valueFn = item => item.ID) {
  const container = document.getElementById(containerId)
  if (!container) return
  if (!items.length) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No hay opciones disponibles.</p>'
    return
  }
  container.innerHTML = items.map(item => `
    <label style="display: block; margin-bottom: 5px; cursor: pointer;">
      <input type="checkbox" class="cb-${containerId}" value="${valueFn(item)}">
      ${labelFn(item)}
    </label>
  `).join('')
}

function shortId(id) {
  if (!id) return '-';
  return id.substring(0, 8) + '...';
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
  const estudiantesActivos = estudiantes.filter(e => e.Activo === true || e.Activo === 'true')
  const dispositivosConIp = dispositivos.filter(d => d.IP_Hash)
  const alertasConObs = alertas.filter(a => a.Observacion && a.Observacion.trim() !== '')

  fillSelect('nota-revisor-id', revisores, (r) => `${r.Nombre || 'Revisor'} - ${shortId(r.ID)}`, 'Selecciona un revisor')

  fillSelect('obs-alerta-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`, 'Selecciona una alerta')
  fillSelect('riesgo-alerta-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`, 'Selecciona una alerta')
  fillSelect('alerta-eliminar-id', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`, 'Selecciona una alerta')

  fillCheckboxes('alertas-campo-list', alertasConObs, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`)
  fillCheckboxes('estado-alerta-ids-list', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${shortId(a.ID)}`)
  fillCheckboxes('relaciones-alerta-list', alertas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`)
  fillCheckboxes('alertas-resueltas-list', alertasResueltas, (a) => `${a.Tipo_Alerta || 'Alerta'} - ${a.Nivel_Riesgo || 'Nivel'} - ${shortId(a.ID)}`)

  fillSelect('auditar-solicitudes', solicitudes, (s) => `${shortId(s.ID)} - ${s.Estado || 'Sin estado'}`)
  fillSelect('auditar-adjuntas', solicitudes, (s) => `${shortId(s.ID)} - ${s.Estado || 'Sin estado'}`)
  fillSelect('desauditar-adjuntas', solicitudes, (s) => `${shortId(s.ID)} - ${s.Estado || 'Sin estado'}`)
  fillSelect('nota-solicitud-id', solicitudes, (s) => `${shortId(s.ID)} - ${s.Estado || 'Sin estado'}`, 'Selecciona una solicitud')

  window.todosEstudiantes = estudiantesActivos;
  fillCheckboxes('desactivar-estudiantes-list', estudiantesActivos, (e) => `${e.Nombre_Completo || e.Email || 'Estudiante'} - ${shortId(e.ID)}`)
  fillSelect('dispositivo-id', dispositivosConIp, (d) => `${d.Navegador || 'Browser'} - ${d.Sistema_Operativo || 'OS'} - ${shortId(d.IP_Hash)}`, 'Selecciona un dispositivo')
}

function filtrarEstudiantesAdmin() {
  const query = document.getElementById('filtro-estudiantes-admin').value.toLowerCase()
  const filtrados = (window.todosEstudiantes || []).filter(e => {
    const nombre = (e.Nombre_Completo || e.Email || '').toLowerCase()
    return nombre.includes(query)
  })
  fillCheckboxes('desactivar-estudiantes-list', filtrados, (e) => `${e.Nombre_Completo || e.Email || 'Estudiante'} - ${shortId(e.ID)}`)
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
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function actualizarNivelRiesgo() {
  const id = document.getElementById('riesgo-alerta-id').value.trim()
  const nivel = document.getElementById('riesgo-alerta-nivel').value
  if (!id || !nivel) return

  try {
    await apiPatch(`/admin/alerta/${id}/riesgo`, { Nivel_Riesgo: nivel })
    mostrarToast('Nivel de riesgo actualizado', 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function auditarSolicitudes() {
  const ids = getSelectedValues('auditar-solicitudes')
  if (!ids.length) return

  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    mostrarToast(`${ids.length} solicitudes auditadas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function desactivarEstudiantesConfirm() {
  const ids = getSelectedValues('desactivar-estudiantes-list')
  if (!ids.length) return
  if (!confirm(`¿Estás seguro de desactivar ${ids.length} estudiantes? Esta acción no se puede deshacer.`)) return;

  try {
    await apiPatch('/admin/estudiantes/desactivar', { estudianteIds: ids })
    mostrarToast(`${ids.length} estudiantes desactivados`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarIPHashConfirm() {
  const id = document.getElementById('dispositivo-id').value.trim()
  if (!id) return
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

  try {
    await apiDelete(`/admin/dispositivo/${id}/ip`)
    mostrarToast('IP hash eliminado', 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarCampoAlertasConfirm() {
  const ids = getSelectedValues('alertas-campo-list')
  if (!ids.length) return
  if (!confirm(`¿Estás seguro de eliminar el campo observación de ${ids.length} alertas? Esta acción no se puede deshacer.`)) return;

  try {
    await apiDelete('/admin/alertas/campo', { alertaIds: ids })
    mostrarToast(`Campo eliminado en ${ids.length} alertas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarAlertasResueltasConfirm() {
  const ids = getSelectedValues('alertas-resueltas-list')
  if (!ids.length) return
  if (!confirm(`¿Estás seguro de eliminar ${ids.length} alertas resueltas? Esta acción no se puede deshacer.`)) return;

  try {
    await apiDelete('/admin/alertas', { alertaIds: ids })
    mostrarToast(`${ids.length} alertas resueltas eliminadas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarAlertaConfirm() {
  const id = document.getElementById('alerta-eliminar-id').value.trim()
  if (!id) return
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

  try {
    await apiDelete(`/admin/alerta/${id}`)
    mostrarToast('Alerta eliminada', 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function auditarAdjuntas() {
  const ids = getSelectedValues('auditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/auditar', { solicitudIds: ids })
    mostrarToast(`${ids.length} adjuntas auditadas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function desauditarAdjuntas() {
  const ids = getSelectedValues('desauditar-adjuntas')
  if (!ids.length) return

  try {
    await apiPatch('/admin/adjuntas/desauditar', { solicitudIds: ids })
    mostrarToast(`Auditado eliminado en ${ids.length} adjuntas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function actualizarEstadoAlertas() {
  const ids = getSelectedValues('estado-alerta-ids-list')
  const estado = document.getElementById('estado-alerta').value.trim()
  if (!ids.length || !estado) return

  try {
    await apiPatch('/admin/alertas/estado', { alertaIds: ids, Estado_Alerta: estado })
    mostrarToast(`Estado de ${ids.length} alertas actualizado`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarRelacionesAlertasConfirm() {
  const ids = getSelectedValues('relaciones-alerta-list')
  if (!ids.length) return
  if (!confirm(`¿Estás seguro de eliminar ${ids.length} relaciones? Esta acción no se puede deshacer.`)) return;

  try {
    await apiDelete('/admin/alertas/relaciones', { alertaIds: ids })
    mostrarToast(`${ids.length} relaciones eliminadas`, 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarNotaRevisionConfirm() {
  const solicitudId = document.getElementById('nota-solicitud-id').value.trim()
  const revisorId = document.getElementById('nota-revisor-id').value.trim()
  if (!solicitudId || !revisorId) return
  if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

  try {
    await apiDelete(`/admin/solicitud/${solicitudId}/revisor/${revisorId}/nota`)
    mostrarToast('Nota eliminada', 'success')
    cargarCatalogos()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}
