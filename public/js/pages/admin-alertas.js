document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarAlertas()
})

let alertaSeleccionada = null

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
        <td>${alerta.Solicitud_ID || '-'}</td>
        <td>${alerta.Estado_Alerta || '-'}</td>
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
  const select = document.getElementById('nueva-alerta-solicitud')
  select.innerHTML = '<option value="">Cargando solicitudes...</option>'
  try {
    const response = await apiGet('/admin/solicitudes')
    const items = response.data || []
    select.innerHTML = '<option value="">Selecciona una solicitud</option>' + 
      items.map(s => `<option value="${s.ID}">${(s.ID || '').substring(0,8)}... - ${s.Estudiante_Nombre || s.Estudiante || 'Estudiante'} - ${s.Estado || 'Sin estado'}</option>`).join('')
  } catch (error) {
    select.innerHTML = '<option value="">Error cargando solicitudes</option>'
  }
}

function cerrarModalCrearAlerta() {
  document.getElementById('modal-crear-alerta').style.display = 'none'
}

async function guardarAlertaManual() {
  const solicitudId = document.getElementById('nueva-alerta-solicitud').value.trim()
  const tipo = document.getElementById('nueva-alerta-tipo').value.trim()
  const riesgo = document.getElementById('nueva-alerta-riesgo').value
  const observacion = document.getElementById('nueva-alerta-obs').value.trim()

  const puntaje = document.getElementById('nueva-alerta-puntaje').value

  if (!solicitudId || !tipo) {
    mostrarToast('Solicitud ID y Tipo son obligatorios', 'error')
    return
  }

  try {
    await apiPost('/admin/alerta', {
      Solicitud_ID: solicitudId,
      Tipo_Alerta: tipo,
      Nivel_Riesgo: riesgo,
      Puntaje_Riesgo: parseFloat(puntaje),
      Observaciones: observacion
    })
    mostrarToast('Alerta creada correctamente', 'success')
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