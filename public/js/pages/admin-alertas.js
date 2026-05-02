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
    const response = await apiGet('/admin/alertas/activas') // endpoint correcto según admin.routes.js
    const alertas = response.data || []

    if (alertas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">No hay alertas activas.</td></tr>`
      return
    }

    tbody.innerHTML = alertas.map(alerta => `
      <tr>
        <td>${alerta.id || '-'}</td>
        <td>${traducirTipoAlerta(alerta.tipo)}</td>
        <td>${riskBadge(alerta.nivel_riesgo)}</td>
        <td>${alerta.puntaje_riesgo || 0}</td>
        <td>${alerta.solicitud_id || '-'}</td>
        <td>${alerta.solicitud_estado || '-'}</td>
        <td>${alerta.fecha_creacion || '-'}</td>
        <td>
          <button class="btn btn-secondary" onclick="abrirModalAlerta('${alerta.id}', '${alerta.tipo}', '${alerta.solicitud_id}', '${alerta.nivel_riesgo}', '${alerta.observacion || ''}')">
            Gestionar
          </button>
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

// === MODAL CREAR ALERTA MANUAL ===
function abrirModalCrearAlerta() {
  document.getElementById('modal-crear-alerta').style.display = 'flex'
}

function cerrarModalCrearAlerta() {
  document.getElementById('modal-crear-alerta').style.display = 'none'
}

async function guardarAlertaManual() {
  const solicitudId = document.getElementById('nueva-alerta-solicitud').value.trim()
  const tipo = document.getElementById('nueva-alerta-tipo').value.trim()
  const riesgo = document.getElementById('nueva-alerta-riesgo').value
  const observacion = document.getElementById('nueva-alerta-obs').value.trim()

  if (!solicitudId || !tipo) {
    mostrarToast('Solicitud ID y Tipo son obligatorios', 'error')
    return
  }

  try {
    await apiPost('/admin/alerta', {
      Solicitud_ID: solicitudId,
      Tipo_Alerta: tipo,
      Nivel_Riesgo: riesgo,
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
    SHARED_ACCOUNT: 'Cuenta compartida',
    REUSED_DOCUMENT: 'Documento reutilizado',
    FRAUD_NETWORK: 'Red de fraude'
  }
  return tipos[tipo] || tipo || '-'
}