let comunidadesData = []
let topSospechososData = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarResultados()
})

async function cargarResultados() {
  try {
    const response = await apiGet('/admin/comunidades/resultados')
    const data = response.data || {}

    if (!data.ejecutado) {
      mostrarMensajeNoEjecutado()
      return
    }

    renderizarResultados(data)
  } catch (error) {
    mostrarToast('Error al cargar los resultados.', 'error')
  }
}

function mostrarMensajeNoEjecutado() {
  document.getElementById('kpis-section').style.display = 'none'
  document.getElementById('comunidades-table').innerHTML =
    '<tr><td colspan="5">El analisis no ha sido ejecutado. Presiona Ejecutar Analisis para comenzar.</td></tr>'
  document.getElementById('sospechosos-table').innerHTML =
    '<tr><td colspan="5">El analisis no ha sido ejecutado. Presiona Ejecutar Analisis para comenzar.</td></tr>'
}

function renderizarResultados(data) {
  comunidadesData = data.comunidades || []
  topSospechososData = data.top_sospechosos || []

  const totalComunidades = comunidadesData.length
  const totalEnRiesgo = comunidadesData.reduce((sum, c) => sum + c.total_estudiantes, 0)
  const mayorComunidad = comunidadesData[0]?.total_estudiantes ?? 0

  document.getElementById('kpi-comunidades').textContent = totalComunidades
  document.getElementById('kpi-en-riesgo').textContent = totalEnRiesgo
  document.getElementById('kpi-mayor').textContent = mayorComunidad
  document.getElementById('kpis-section').style.display = 'block'

  renderizarComunidades()
  renderizarSospechosos()
}

function renderizarComunidades() {
  const tbody = document.getElementById('comunidades-table')

  if (!comunidadesData.length) {
    tbody.innerHTML = '<tr><td colspan="5">No se detectaron comunidades sospechosas.</td></tr>'
    return
  }

  tbody.innerHTML = comunidadesData.map((c, index) => {
    const preview = c.estudiantes.slice(0, 3).join(', ') +
      (c.estudiantes.length > 3 ? ` y ${c.estudiantes.length - 3} mas` : '')
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${preview}</td>
        <td>${c.total_estudiantes}</td>
        <td><span class="badge ${colorScore(c.score_maximo)}">${c.score_maximo}</span></td>
        <td><button class="btn btn-secondary" onclick="verDetalle(${index})">Ver detalle</button></td>
      </tr>
    `
  }).join('')
}

function renderizarSospechosos() {
  const tbody = document.getElementById('sospechosos-table')

  if (!topSospechososData.length) {
    tbody.innerHTML = '<tr><td colspan="5">No hay datos de estudiantes sospechosos.</td></tr>'
    return
  }

  tbody.innerHTML = topSospechososData.map((e, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${e.nombre || '-'}</td>
      <td>${e.email || '-'}</td>
      <td><span class="badge ${colorScore(e.score)}">${e.score}</span></td>
      <td>${construirComparte(e)}</td>
    </tr>
  `).join('')
}

async function ejecutarAnalisis() {
  const btn = document.getElementById('btn-ejecutar')
  btn.disabled = true
  btn.textContent = 'Analizando...'

  try {
    const response = await apiPost('/admin/comunidades/ejecutar', {})

    if (response.success) {
      mostrarToast(response.message, 'success')
      renderizarResultados(response.data)
    } else {
      mostrarToast(response.message || 'Error al ejecutar el analisis.', 'error')
    }
  } catch (error) {
    mostrarToast('Error al ejecutar el analisis.', 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Ejecutar Analisis'
  }
}

async function limpiarResultados() {
  const ok = window.confirm(
    'Esto elimina los resultados del analisis de todos los estudiantes.\n\nPuedes volver a ejecutar el analisis cuando quieras.\n\n¿Continuar?'
  )
  if (!ok) return

  try {
    const response = await apiDelete('/admin/comunidades/limpiar')

    if (response.success) {
      mostrarToast(response.message, 'success')
      comunidadesData = []
      topSospechososData = []
      mostrarMensajeNoEjecutado()
    } else {
      mostrarToast(response.message || 'Error al limpiar los resultados.', 'error')
    }
  } catch (error) {
    mostrarToast('Error al limpiar los resultados.', 'error')
  }
}

function verDetalle(index) {
  const comunidad = comunidadesData[index]
  if (!comunidad) return

  document.getElementById('modal-title').textContent =
    `Comunidad #${index + 1} — ${comunidad.total_estudiantes} estudiantes`

  document.getElementById('modal-content').innerHTML = `
    <p style="margin-bottom: 8px;"><strong>Miembros:</strong></p>
    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
      ${comunidad.estudiantes.map(e => `<li>${e}</li>`).join('')}
    </ul>
    <p style="margin-top: 20px;">
      <strong>Score maximo de sospecha:</strong>
      <span class="badge ${colorScore(comunidad.score_maximo)}" style="margin-left: 8px;">${comunidad.score_maximo}</span>
    </p>
  `

  const overlay = document.getElementById('modal-overlay')
  overlay.style.display = 'flex'
}

function cerrarModal() {
  document.getElementById('modal-overlay').style.display = 'none'
}

function cerrarModalOverlay(event) {
  if (event.target === document.getElementById('modal-overlay')) {
    cerrarModal()
  }
}

function construirComparte(estudiante) {
  const partes = []
  if (estudiante.comparte_cuenta > 0) partes.push('Cuenta')
  if (estudiante.comparte_dispositivo > 0) partes.push('Dispositivo')
  if (estudiante.comparte_direccion > 0) partes.push('Direccion')
  if (estudiante.comparte_referencia > 0) partes.push('Referencia')
  return partes.join(' + ') || '-'
}

function colorScore(score) {
  if (score >= 8) return 'badge-alto'
  if (score >= 4) return 'badge-medio'
  return 'badge-bajo'
}
