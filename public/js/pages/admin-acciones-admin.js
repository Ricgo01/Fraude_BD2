document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarCatalogos()
})

// ── Datos en memoria para previews ────────────────────────────────────────────
window._alertasCatalogo      = []
window._solicitudesConNotas  = []
window._dispositivosCatalogo = []
window._todasSolicitudes     = []
window._todosEstudiantes     = []

// ── Helpers de selección ──────────────────────────────────────────────────────

function getSelectedValues(containerId) {
  const select = document.getElementById(containerId)
  if (select && select.tagName === 'SELECT') {
    return Array.from(select.selectedOptions).map(o => o.value).filter(Boolean)
  }
  const checkboxes = document.querySelectorAll(`.cb-${containerId}`)
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

function fillCheckboxes(containerId, items, labelFn, emptyMsg, valueFn) {
  if (typeof emptyMsg === 'function') { valueFn = emptyMsg; emptyMsg = null }
  valueFn = valueFn || (item => item.ID)
  const container = document.getElementById(containerId)
  if (!container) return
  if (!items.length) {
    const msg = emptyMsg || 'No hay elementos disponibles en este momento.'
    container.innerHTML = `<p style="color:#6b7280;font-size:0.85em;padding:6px 0;margin:0;">${msg}</p>`
    return
  }
  container.innerHTML = items.map(item => `
    <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;cursor:pointer;font-size:0.875em;line-height:1.4;">
      <input type="checkbox" class="cb-${containerId}" value="${valueFn(item)}" style="margin-top:2px;flex-shrink:0;">
      <span>${labelFn(item)}</span>
    </label>
  `).join('')
}

function showPreview(id, html) {
  const box = document.getElementById(id)
  if (!box) return
  if (html) { box.innerHTML = html; box.style.display = 'block' }
  else { box.style.display = 'none' }
}

// ── Carga de catálogos ────────────────────────────────────────────────────────

async function cargarCatalogos() {
  const results = await Promise.allSettled([
    apiGet('/admin/lista/alertas'),
    apiGet('/admin/lista/solicitudes'),
    apiGet('/admin/lista/estudiantes'),
    apiGet('/admin/lista/dispositivos'),
    apiGet('/admin/revisores'),
    apiGet('/admin/lista/solicitudes/con-notas')
  ])

  const alertas          = results[0].status === 'fulfilled' ? results[0].value.data || [] : []
  const solicitudes      = results[1].status === 'fulfilled' ? results[1].value.data || [] : []
  const estudiantes      = results[2].status === 'fulfilled' ? results[2].value.data || [] : []
  const dispositivos     = results[3].status === 'fulfilled' ? results[3].value.data || [] : []
  const revisores        = results[4].status === 'fulfilled' ? results[4].value.data || [] : []
  const solicitudesConNota = results[5].status === 'fulfilled' ? results[5].value.data || [] : []

  // Guardar en memoria para los previews
  window._alertasCatalogo      = alertas
  window._dispositivosCatalogo = dispositivos
  window._todasSolicitudes     = solicitudes
  window._todosEstudiantes     = estudiantes.filter(e => e.Activo === true || e.Activo === 'true')
  window._solicitudesConNotas  = solicitudesConNota

  const alertasResueltas = alertas.filter(a => a.Resuelta === true || a.Resuelta === 'true')
  const alertasConObs    = alertas.filter(a => a.Observacion && a.Observacion.trim() !== '')
  const dispositivosConIp = dispositivos.filter(d => d.IP_Hash)

  // Etiqueta enriquecida para alertas
  function labelAlerta(a) {
    const nivel      = (a.Nivel_Riesgo || 'sin nivel').toUpperCase()
    const tipo       = traducirTipoAlerta(a.Tipo_Alerta)
    const estudiante = a.Estudiante_Nombre ? ` — ${a.Estudiante_Nombre}` : ''
    const fecha      = formatNeoDate(a.Fecha_Creacion)
    return `[${nivel}] ${tipo}${estudiante} — ${fecha}`
  }

  // Etiqueta enriquecida para solicitudes
  function labelSolicitud(s) {
    const estado     = s.Estado || 'Sin estado'
    const estudiante = s.Estudiante_Nombre || 'Desconocido'
    const beca       = s.Beca_Nombre || 'Sin beca'
    return `[${estado}] ${estudiante} — ${beca} — ${formatMoney(s.Monto_Solicitado)}`
  }

  // ── TAB INVESTIGACIÓN ───────────────────────────────────────────────────────
  fillSelect('obs-alerta-id',    alertas, labelAlerta, 'Selecciona una alerta de la lista')
  fillSelect('riesgo-alerta-id', alertas, labelAlerta, 'Selecciona una alerta de la lista')

  fillCheckboxes('auditar-solicitudes-list', solicitudes, labelSolicitud,
    'No hay solicitudes disponibles.')
  fillCheckboxes('auditar-adjuntas-list', solicitudes, labelSolicitud,
    'No hay solicitudes disponibles.')

  // ── TAB DISCIPLINARIAS ──────────────────────────────────────────────────────
  fillCheckboxes('desactivar-estudiantes-list', window._todosEstudiantes,
    e => `${e.Nombre_Completo || 'Sin nombre'} — ${e.Email || ''} — Promedio: ${e.Promedio || '-'}`,
    'No hay estudiantes activos.')
  fillCheckboxes('estado-alerta-ids-list', alertas, labelAlerta,
    'No hay alertas activas en este momento.')

  // ── TAB CORRECCIONES ────────────────────────────────────────────────────────
  // Borrar nota: solo solicitudes que tienen nota (un solo dropdown)
  const selectNota = document.getElementById('nota-solicitud-id')
  if (selectNota) {
    selectNota.innerHTML = solicitudesConNota.length
      ? [`<option value="">Selecciona una solicitud con nota</option>`]
          .concat(solicitudesConNota.map(s =>
            `<option value="${s.solicitud_id}">[${s.estado}] ${s.estudiante} — ${s.beca}</option>`
          )).join('')
      : `<option value="">No hay solicitudes con notas en este momento</option>`
  }

  fillSelect('alerta-eliminar-id', alertas, labelAlerta, 'Selecciona una alerta de la lista')
  fillCheckboxes('desauditar-adjuntas-list', solicitudes, labelSolicitud,
    'No hay solicitudes auditadas para revertir.')
  fillCheckboxes('relaciones-alerta-list', alertas, labelAlerta,
    'No hay alertas con relaciones activas.')

  // ── TAB MANTENIMIENTO ───────────────────────────────────────────────────────
  fillCheckboxes('alertas-resueltas-list', alertasResueltas, labelAlerta,
    'No hay alertas resueltas pendientes de limpieza.')
  fillCheckboxes('alertas-campo-list', alertasConObs, labelAlerta,
    'No hay alertas con notas en este momento.')

  const selectDispositivo = document.getElementById('dispositivo-id')
  if (selectDispositivo) {
    selectDispositivo.innerHTML = dispositivosConIp.length
      ? [`<option value="">Selecciona un dispositivo de la lista</option>`]
          .concat(dispositivosConIp.map(d =>
            `<option value="${d.ID}">${d.Navegador || 'Navegador'} / ${d.Sistema_Operativo || 'OS'} — IP: ${shortId(d.IP_Hash)}</option>`
          )).join('')
      : `<option value="">No hay dispositivos con IP registrada</option>`
  }
}

// ── Filtros en cliente ────────────────────────────────────────────────────────

function filtrarEstudiantesAdmin() {
  const query = document.getElementById('filtro-estudiantes-admin').value.toLowerCase()
  const filtrados = (window._todosEstudiantes || []).filter(e =>
    (e.Nombre_Completo || e.Email || '').toLowerCase().includes(query)
  )
  fillCheckboxes('desactivar-estudiantes-list', filtrados,
    e => `${e.Nombre_Completo || 'Sin nombre'} — ${e.Email || ''} — Promedio: ${e.Promedio || '-'}`,
    'No se encontraron estudiantes con ese nombre.')
}

function filtrarSolicitudesAuditar() {
  const query = document.getElementById('filtro-solicitudes-auditar').value.toLowerCase()
  const filtrados = (window._todasSolicitudes || []).filter(s =>
    (s.Estudiante_Nombre || '').toLowerCase().includes(query)
  )
  fillCheckboxes('auditar-solicitudes-list', filtrados,
    s => `[${s.Estado || 'Sin estado'}] ${s.Estudiante_Nombre || 'Desconocido'} — ${s.Beca_Nombre || 'Sin beca'} — ${formatMoney(s.Monto_Solicitado)}`,
    'No se encontraron solicitudes con ese nombre.')
}

// ── Funciones de preview al seleccionar ──────────────────────────────────────

function previsualizarAlertaNota() {
  const id = document.getElementById('obs-alerta-id').value
  const alerta = window._alertasCatalogo.find(a => a.ID === id)
  if (!alerta) { showPreview('obs-alerta-preview', null); return }

  const tieneNota = alerta.Observacion && alerta.Observacion.trim() !== ''
  showPreview('obs-alerta-preview', `
    <p class="preview-label">Alerta seleccionada</p>
    <p><strong>Tipo:</strong> ${traducirTipoAlerta(alerta.Tipo_Alerta)}</p>
    <p><strong>Nivel:</strong> ${riskBadge(alerta.Nivel_Riesgo)}</p>
    ${alerta.Estudiante_Nombre ? `<p><strong>Estudiante:</strong> ${alerta.Estudiante_Nombre}</p>` : ''}
    ${tieneNota
      ? `<p><strong>Nota actual:</strong></p><div class="preview-nota-texto">"${alerta.Observacion}"</div>
         <p class="preview-aviso">Si guardas una nueva nota, reemplazará la anterior.</p>`
      : `<p style="color:#059669;font-size:0.85em;">Esta alerta no tiene nota previa.</p>`
    }
  `)
}

function previsualizarAlertaNivel() {
  const id = document.getElementById('riesgo-alerta-id').value
  const alerta = window._alertasCatalogo.find(a => a.ID === id)
  if (!alerta) { showPreview('riesgo-alerta-preview', null); return }

  // Filtrar opciones para no mostrar el nivel actual
  const nivelSelect = document.getElementById('riesgo-alerta-nivel')
  nivelSelect.innerHTML = `<option value="">Selecciona el nuevo nivel</option>`
  ;['bajo', 'medio', 'alto'].forEach(nivel => {
    if (nivel !== alerta.Nivel_Riesgo) {
      const opt = document.createElement('option')
      opt.value = nivel
      opt.textContent = nivel.charAt(0).toUpperCase() + nivel.slice(1)
      nivelSelect.appendChild(opt)
    }
  })

  showPreview('riesgo-alerta-preview', `
    <p class="preview-label">Nivel actual de esta alerta</p>
    <p>${riskBadge(alerta.Nivel_Riesgo)} &nbsp; <span style="color:#6b7280;font-size:0.85em;">Cambia al nuevo nivel seleccionado abajo</span></p>
    ${alerta.Estudiante_Nombre ? `<p><strong>Estudiante:</strong> ${alerta.Estudiante_Nombre}</p>` : ''}
  `)
}

function previsualizarNota() {
  const solicitudId = document.getElementById('nota-solicitud-id').value
  const sol = window._solicitudesConNotas.find(s => s.solicitud_id === solicitudId)
  const btn = document.getElementById('btn-borrar-nota')

  if (!sol) {
    showPreview('nota-preview', null)
    if (btn) btn.disabled = true
    return
  }

  showPreview('nota-preview', `
    <p class="preview-label">Contenido de la nota</p>
    <p><strong>Revisor:</strong> ${sol.revisor_nombre}${sol.revisor_rol ? ` (${sol.revisor_rol})` : ''}</p>
    <div class="preview-nota-texto">"${sol.nota}"</div>
    <p class="preview-aviso">Esta acción no se puede deshacer.</p>
  `)
  if (btn) btn.disabled = false
}

function previsualizarAlertaDetalle() {
  const id = document.getElementById('alerta-eliminar-id').value
  const alerta = window._alertasCatalogo.find(a => a.ID === id)
  if (!alerta) { showPreview('alerta-eliminar-preview', null); return }

  showPreview('alerta-eliminar-preview', `
    <p class="preview-label">Detalle de la alerta a eliminar</p>
    <p><strong>Tipo:</strong> ${traducirTipoAlerta(alerta.Tipo_Alerta)}</p>
    <p><strong>Nivel:</strong> ${riskBadge(alerta.Nivel_Riesgo)}</p>
    <p><strong>Puntaje:</strong> ${alerta.Puntaje_Riesgo || '-'}</p>
    ${alerta.Estudiante_Nombre ? `<p><strong>Estudiante asociado:</strong> ${alerta.Estudiante_Nombre}</p>` : ''}
    <p><strong>Fecha de creación:</strong> ${formatNeoDate(alerta.Fecha_Creacion)}</p>
    ${alerta.Observacion ? `<p><strong>Nota:</strong> "${alerta.Observacion}"</p>` : ''}
    <p class="preview-aviso">Esta acción eliminará la alerta y todas sus relaciones. No se puede deshacer.</p>
  `)
}

function previsualizarDispositivo() {
  const id = document.getElementById('dispositivo-id').value
  const disp = window._dispositivosCatalogo.find(d => d.ID === id)
  if (!disp) { showPreview('dispositivo-preview', null); return }

  showPreview('dispositivo-preview', `
    <p class="preview-label">Dispositivo seleccionado</p>
    <p><strong>Navegador:</strong> ${disp.Navegador || '-'}</p>
    <p><strong>Sistema operativo:</strong> ${disp.Sistema_Operativo || '-'}</p>
    <p><strong>IP Hash:</strong> <span title="${disp.IP_Hash}" style="cursor:help;text-decoration:underline dotted;">${shortId(disp.IP_Hash)}</span></p>
    <p class="preview-aviso">El hash de IP será eliminado permanentemente.</p>
  `)
}

// ── TAB INVESTIGACIÓN — acciones ─────────────────────────────────────────────

async function agregarObservacion() {
  const id    = document.getElementById('obs-alerta-id').value.trim()
  const texto = document.getElementById('obs-alerta-texto').value.trim()
  if (!id)    { mostrarToast('Selecciona una alerta de la lista.', 'warning'); return }
  if (!texto) { mostrarToast('Escribe la nota antes de guardar.', 'warning'); return }
  try {
    await apiPatch(`/admin/alerta/${id}/observacion`, { Observacion: texto })
    mostrarToast('Nota de investigación guardada correctamente.', 'success')
    document.getElementById('obs-alerta-texto').value = ''
    showPreview('obs-alerta-preview', null)
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function actualizarNivelRiesgo() {
  const id    = document.getElementById('riesgo-alerta-id').value.trim()
  const nivel = document.getElementById('riesgo-alerta-nivel').value
  if (!id)    { mostrarToast('Selecciona una alerta de la lista.', 'warning'); return }
  if (!nivel) { mostrarToast('Selecciona el nuevo nivel de gravedad.', 'warning'); return }
  try {
    await apiPatch(`/admin/alerta/${id}/riesgo`, { Nivel_Riesgo: nivel })
    mostrarToast(`Nivel de gravedad actualizado a "${nivel}" correctamente.`, 'success')
    showPreview('riesgo-alerta-preview', null)
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function auditarSolicitudes() {
  const ids = getSelectedValues('auditar-solicitudes-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una solicitud.', 'warning'); return }
  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    mostrarToast(`${ids.length} solicitud(es) marcadas como auditadas.`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function auditarAdjuntas() {
  const ids = getSelectedValues('auditar-adjuntas-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una solicitud.', 'warning'); return }
  try {
    await apiPatch('/admin/adjuntas/auditar', { solicitudIds: ids })
    mostrarToast(`Documentos de ${ids.length} solicitud(es) marcados como verificados.`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

// ── TAB DISCIPLINARIAS — acciones ────────────────────────────────────────────

async function desactivarEstudiantesConfirm() {
  const ids = getSelectedValues('desactivar-estudiantes-list')
  if (!ids.length) { mostrarToast('Selecciona al menos un estudiante.', 'warning'); return }
  if (!confirm(
    `Vas a bloquear ${ids.length} estudiante(s).\n\n` +
    `Los estudiantes bloqueados no podrán hacer nuevas solicitudes ni iniciar sesión.\n\n` +
    `¿Continuar?`
  )) return
  try {
    await apiPatch('/admin/estudiantes/desactivar', { estudianteIds: ids })
    mostrarToast(`${ids.length} estudiante(s) bloqueados correctamente.`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function actualizarEstadoAlertas() {
  const ids    = getSelectedValues('estado-alerta-ids-list')
  const estado = document.getElementById('estado-alerta').value.trim()
  if (!ids.length) { mostrarToast('Selecciona al menos una alerta.', 'warning'); return }
  if (!estado)     { mostrarToast('Selecciona un estado.', 'warning'); return }
  try {
    await apiPatch('/admin/alertas/estado', { alertaIds: ids, Estado_Alerta: estado })
    mostrarToast(`Estado actualizado a "${estado}" en ${ids.length} alerta(s).`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

// ── TAB CORRECCIONES — acciones ──────────────────────────────────────────────

async function eliminarNotaRevisionConfirm() {
  const solicitudId = document.getElementById('nota-solicitud-id').value.trim()
  if (!solicitudId) { mostrarToast('Selecciona una solicitud con nota.', 'warning'); return }

  const sol = window._solicitudesConNotas.find(s => s.solicitud_id === solicitudId)
  if (!sol)  { mostrarToast('No se encontró la información de la nota.', 'error'); return }

  if (!confirm(
    `Vas a borrar la nota de ${sol.revisor_nombre} en la solicitud de ${sol.estudiante}.\n\n` +
    `Nota: "${sol.nota}"\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete(`/admin/solicitud/${sol.solicitud_id}/revisor/${sol.revisor_id}/nota`)
    mostrarToast(`Nota de ${sol.revisor_nombre} borrada correctamente.`, 'success')
    showPreview('nota-preview', null)
    const btn = document.getElementById('btn-borrar-nota')
    if (btn) btn.disabled = true
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function desauditarAdjuntas() {
  const ids = getSelectedValues('desauditar-adjuntas-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una solicitud.', 'warning'); return }
  try {
    await apiPatch('/admin/adjuntas/desauditar', { solicitudIds: ids })
    mostrarToast(`Verificación revertida en ${ids.length} solicitud(es).`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function eliminarAlertaConfirm() {
  const id = document.getElementById('alerta-eliminar-id').value.trim()
  if (!id) { mostrarToast('Selecciona una alerta de la lista.', 'warning'); return }

  const alerta = window._alertasCatalogo.find(a => a.ID === id)
  const desc   = alerta
    ? `Tipo: ${traducirTipoAlerta(alerta.Tipo_Alerta)}${alerta.Estudiante_Nombre ? ` — Estudiante: ${alerta.Estudiante_Nombre}` : ''}`
    : `ID: ${shortId(id)}`

  if (!confirm(
    `Vas a descartar la siguiente alerta:\n${desc}\n\n` +
    `Se eliminará junto con todas sus relaciones.\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete(`/admin/alerta/${id}`)
    mostrarToast('Alerta descartada correctamente.', 'success')
    showPreview('alerta-eliminar-preview', null)
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function eliminarRelacionesAlertasConfirm() {
  const ids = getSelectedValues('relaciones-alerta-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una alerta.', 'warning'); return }
  if (!confirm(
    `Vas a desvincular ${ids.length} alerta(s) de sus solicitudes.\n\n` +
    `Las alertas permanecerán pero sin conexión a ninguna solicitud.\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete('/admin/alertas/relaciones', { alertaIds: ids })
    mostrarToast(`${ids.length} alerta(s) desvinculadas correctamente.`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

// ── TAB MANTENIMIENTO — acciones ─────────────────────────────────────────────

async function eliminarAlertasResueltasConfirm() {
  const ids = getSelectedValues('alertas-resueltas-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una alerta resuelta.', 'warning'); return }
  if (!confirm(
    `Vas a eliminar ${ids.length} alerta(s) resueltas de la base de datos.\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete('/admin/alertas', { alertaIds: ids })
    mostrarToast(`${ids.length} alerta(s) resueltas eliminadas correctamente.`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function eliminarCampoAlertasConfirm() {
  const ids = getSelectedValues('alertas-campo-list')
  if (!ids.length) { mostrarToast('Selecciona al menos una alerta.', 'warning'); return }
  if (!confirm(
    `Vas a limpiar las notas de ${ids.length} alerta(s).\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete('/admin/alertas/campo', { alertaIds: ids })
    mostrarToast(`Notas eliminadas de ${ids.length} alerta(s).`, 'success')
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}

async function eliminarIPHashConfirm() {
  const id = document.getElementById('dispositivo-id').value.trim()
  if (!id) { mostrarToast('Selecciona un dispositivo de la lista.', 'warning'); return }
  if (!confirm(
    `Vas a borrar el hash de IP de este dispositivo por privacidad.\n\n` +
    `Esta acción no se puede deshacer.\n\n¿Continuar?`
  )) return
  try {
    await apiDelete(`/admin/dispositivo/${id}/ip`)
    mostrarToast('Hash de IP eliminado correctamente.', 'success')
    showPreview('dispositivo-preview', null)
    cargarCatalogos()
  } catch (error) { mostrarToast(error.message, 'error') }
}
