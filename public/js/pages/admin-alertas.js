document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarAlertas()
})

let alertaSeleccionada = null
let _revisorInfoActual  = null
let _senalarRevisor     = false

async function cargarAlertas() {
  const tbody = document.getElementById('alerts-table')
  const message = document.getElementById('message')

  try {
    message.innerHTML = ''
    // Usar /lista/alertas para obtener TODAS, no solo las de nivel alto
    const response = await apiGet('/admin/lista/alertas')
    const alertas = (response.data || []).filter(a => !a.Resuelta)

    if (alertas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">No hay alertas activas.</td></tr>`
      return
    }

    tbody.innerHTML = alertas.map(alerta => `
      <tr>
        <td title="${alerta.ID}">${shortId(alerta.ID)}</td>
        <td>${traducirTipoAlerta(alerta.Tipo_Alerta)}</td>
        <td>${riskBadge(alerta.Nivel_Riesgo)}</td>
        <td>${alerta.Puntaje_Riesgo || 0}</td>
        <td title="${alerta.Solicitud_ID || ''}">${alerta.Solicitud_ID ? shortId(alerta.Solicitud_ID) : '-'}</td>
        <td>${alerta.Solicitud_Estado ? statusBadge(alerta.Solicitud_Estado) : '-'}</td>
        <td>${formatNeoDate(alerta.Fecha_Creacion)}</td>
        <td>
          <button class="btn btn-secondary" onclick="abrirModalAlerta('${alerta.ID}', '${alerta.Tipo_Alerta}', '${alerta.Solicitud_ID || ''}', '${alerta.Nivel_Riesgo}', '${alerta.Observacion || ''}')">Gestionar</button>
        </td>
      </tr>
    `).join('')

  } catch (error) {
    console.error(error)
    tbody.innerHTML = `<tr><td colspan="8">No se pudieron cargar las alertas. Intenta actualizar.</td></tr>`
  }
}

// === MODAL GESTIONAR ALERTA ===
function abrirModalAlerta(id, tipo, solicitud, riesgo, observacion) {
  alertaSeleccionada = id
  document.getElementById('modal-alerta-id').textContent = id
  document.getElementById('modal-alerta-tipo').textContent = traducirTipoAlerta(tipo)
  document.getElementById('modal-alerta-solicitud').textContent = solicitud
  document.getElementById('modal-alerta-riesgo').value = riesgo || 'Alto'
  document.getElementById('modal-alerta-observacion').value = observacion === 'undefined' || !observacion ? '' : observacion
  document.getElementById('modal-alerta').style.display = 'flex'
}

function cerrarModalAlerta() {
  document.getElementById('modal-alerta').style.display = 'none'
  alertaSeleccionada = null
}

async function actualizarRiesgoAlerta() {
  const riesgo = document.getElementById('modal-alerta-riesgo').value
  try {
    await apiPatch(`/admin/alerta/${alertaSeleccionada}/riesgo`, { Nivel_Riesgo: riesgo })
    mostrarToast('Nivel de riesgo actualizado', 'success')
    cargarAlertas()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function agregarObservacion() {
  const obs = document.getElementById('modal-alerta-observacion').value.trim()
  try {
    await apiPatch(`/admin/alerta/${alertaSeleccionada}/observacion`, { Observacion: obs })
    mostrarToast('Observación guardada', 'success')
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarAlerta() {
  if (!confirm('¿Seguro que deseas eliminar esta alerta como Falsa Alarma?')) return
  try {
    await apiDelete(`/admin/alerta/${alertaSeleccionada}`)
    mostrarToast('Alerta eliminada', 'success')
    cerrarModalAlerta()
    cargarAlertas()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function resolverAlerta() {
  try {
    // Usando el endpoint de resolver del backend actual
    await apiPut(`/api/reports/alerts/${alertaSeleccionada}/resolve`, { descripcion_resolucion: 'Resuelta desde Modal' })
    mostrarToast('Alerta Resuelta', 'success')
    cerrarModalAlerta()
    cargarAlertas()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function eliminarTodasAlertas() {
  const confirmar = window.confirm(
    '⚠️ Esto eliminará TODAS las alertas del sistema.\n\n' +
    'Esta acción es para demos académicas.\n\n' +
    '¿Continuar?'
  );
  if (!confirmar) return;

  try {
    const r = await fetch('/admin/alertas/todas', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await r.json();

    if (data.success) {
      mostrarToast(data.message, 'success');
      cargarAlertas();
    } else {
      mostrarToast(data.message, 'error');
    }
  } catch (e) {
    mostrarToast('Error al eliminar alertas', 'error');
  }
}

// === MODAL CREAR ALERTA MANUAL ===
async function abrirModalCrearAlerta() {
  document.getElementById('modal-crear-alerta').style.display = 'flex'

  const selectSol = document.getElementById('nueva-alerta-solicitud')
  selectSol.innerHTML = '<option value="">Cargando solicitudes...</option>'

  try {
    const response  = await apiGet('/admin/solicitudes')
    const solicitudes = response.data || []
    selectSol.innerHTML = '<option value="">Selecciona una solicitud</option>' +
      solicitudes.map(s => `<option value="${s.solicitud_id}">[${s.estado || 'Sin estado'}] ${s.estudiante || 'Estudiante'} — ${s.beca || 'Sin beca'}</option>`).join('')
  } catch (_) {
    selectSol.innerHTML = '<option value="">Error cargando solicitudes</option>'
  }
}

function cerrarModalCrearAlerta() {
  document.getElementById('modal-crear-alerta').style.display = 'none'
  _revisorInfoActual = null
  _senalarRevisor    = false
  document.getElementById('revisor-info-block').style.display = 'none'
}

async function onSolicitudChange(solicitudId) {
  _revisorInfoActual = null
  _senalarRevisor    = false
  document.getElementById('revisor-info-block').style.display = 'none'

  if (!solicitudId) return

  try {
    const response = await apiGet(`/admin/solicitud/${solicitudId}/revisor`)
    if (response.success && response.data) {
      _revisorInfoActual = response.data

      const rev      = response.data
      const fecha    = formatNeoDate(rev.fecha_resolucion)
      const decision = rev.decision
        ? `Decision: ${rev.decision}${fecha ? ' — ' + fecha : ''}`
        : 'Sin decision registrada'

      document.getElementById('revisor-info-nombre').textContent   = `${rev.nombre} (${rev.rol || 'Revisor'})`
      document.getElementById('revisor-info-email').textContent    = rev.email || ''
      document.getElementById('revisor-info-decision').textContent = decision

      actualizarBotonesSeñalar()
      document.getElementById('revisor-info-block').style.display = 'block'
    }
  } catch (_) {}
}

function senalarRevisorSi() {
  _senalarRevisor = true
  actualizarBotonesSeñalar()
}

function senalarRevisorNo() {
  _senalarRevisor = false
  actualizarBotonesSeñalar()
}

function actualizarBotonesSeñalar() {
  const btnSi = document.getElementById('btn-senalar-si')
  const btnNo = document.getElementById('btn-senalar-no')
  if (!btnSi || !btnNo) return

  const activeStyle   = 'background:#3B82F6;color:white;border:none;padding:6px 16px;border-radius:4px;cursor:pointer;'
  const inactiveStyle = 'background:white;color:#6B7280;border:1px solid #D1D5DB;padding:6px 16px;border-radius:4px;cursor:pointer;'

  btnSi.style.cssText = _senalarRevisor ? activeStyle : inactiveStyle
  btnNo.style.cssText = _senalarRevisor ? inactiveStyle : activeStyle
}

async function guardarAlertaManual() {
  const solicitudId = document.getElementById('nueva-alerta-solicitud').value.trim()
  const tipo        = document.getElementById('nueva-alerta-tipo').value.trim()
  const riesgo      = document.getElementById('nueva-alerta-riesgo').value
  const observacion = document.getElementById('nueva-alerta-obs').value.trim()
  const revisorId   = (_senalarRevisor && _revisorInfoActual)
    ? _revisorInfoActual.revisor_id
    : null

  if (!solicitudId || !tipo) {
    mostrarToast('Solicitud y Tipo son obligatorios', 'error')
    return
  }

  try {
    const response = await apiPost('/admin/alerta', {
      Solicitud_ID: solicitudId,
      Tipo_Alerta: tipo,
      Nivel_Riesgo: riesgo,
      Observacion: observacion,
      Revisor_ID: revisorId
    })
    mostrarToast(response.message || 'Alerta creada correctamente', 'success')
    cerrarModalCrearAlerta()
    cargarAlertas()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

function traducirTipoAlerta(tipo) {
  const tipos = {
    cuenta_compartida: 'Cuenta compartida',
    documento_reutilizado: 'Documento reutilizado',
    red_de_fraude: 'Red de fraude',
    dispositivo_repetido: 'Dispositivo repetido',
    direccion_compartida: 'Dirección compartida',
    solicitud_duplicada: 'Solicitud duplicada',
    aval_sospechoso: 'Aval sospechoso',
    SHARED_ACCOUNT: 'Cuenta compartida',
    REUSED_DOCUMENT: 'Documento reutilizado',
    FRAUD_NETWORK: 'Red de fraude'
  }
  return tipos[tipo] || tipo || '-'
}