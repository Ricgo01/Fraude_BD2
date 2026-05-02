document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarSolicitudes()
})

let todasSolicitudes = []

async function cargarSolicitudes() {
  const tbody = document.getElementById('solicitudes-table')
  tbody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>'
  
  try {
    const response = await apiGet('/admin/lista/solicitudes') // endpoints list return all maybe? Let's use /admin/solicitudes or /admin/lista/solicitudes
    // Wait, the prompt says: "GET /admin/solicitudes (si no existe se puede combinar lo que ya hay)"
    // The previous code in `admin-agregaciones.js` uses `apiGet('/admin/lista/solicitudes')` to load all solicitudes for catalog.
    const items = response.data || []
    todasSolicitudes = items
    filtrarTabla()
  } catch (error) {
    try {
      const resp2 = await apiGet('/admin/solicitudes')
      todasSolicitudes = resp2.data || []
      filtrarTabla()
    } catch (e2) {
      tbody.innerHTML = '<tr><td colspan="8">Error cargando solicitudes.</td></tr>'
    }
  }
}

function renderSolicitudes(items) {
  const tbody = document.getElementById('solicitudes-table')
  if (!items.length) {
    tbody.innerHTML = `
      <div class="empty-state">
        <p>No hay datos para mostrar</p>
        <button onclick="cargarSolicitudes()">Recargar</button>
      </div>`
    return
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><input type="checkbox" class="solicitud-cb" value="${item.ID}"></td>
      <td title="${item.ID}">${shortId(item.ID)}</td>
      <td>${item.Estudiante_Nombre || item.Estudiante || '-'}</td>
      <td>${item.Beca_Nombre || item.Beca || '-'}</td>
      <td>${formatMoney(item.Monto_Solicitado || item.Monto || 0)}</td>
      <td><span class="badge badge-${(item.Estado || '').toLowerCase().replace(' ', '-')}">${item.Estado || '-'}</span></td>
      <td>${formatNeoDate(item.Fecha_Envio || item.Fecha)}</td>
      <td>
        <button class="btn btn-secondary" onclick="abrirDetalle('${item.ID}')">Detalle</button>
      </td>
    </tr>
  `).join('')
}

function filtrarTabla() {
  const estadoQuery = document.getElementById('filtro-estado').value

  const filtrados = todasSolicitudes.filter(sol => {
    if (estadoQuery === '') return true
    return sol.Estado === estadoQuery
  })

  renderSolicitudes(filtrados)
}

function toggleAllSol(source) {
  const checkboxes = document.querySelectorAll('.solicitud-cb')
  checkboxes.forEach(cb => cb.checked = source.checked)
}

async function auditarSeleccionadas() {
  const checkboxes = document.querySelectorAll('.solicitud-cb:checked')
  const ids = Array.from(checkboxes).map(cb => cb.value)

  if (!ids.length) {
    mostrarToast('Selecciona al menos una solicitud', 'warning')
    return
  }

  try {
    await apiPatch('/admin/solicitudes/auditar', { solicitudIds: ids })
    mostrarToast('Solicitudes auditadas exitosamente', 'success')
    cargarSolicitudes()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}



function abrirDetalle(id) {
  const sol = todasSolicitudes.find(s => s.ID === id)
  if (!sol) return
  document.getElementById('modal-sol-id').textContent = shortId(id)
  
  const content = `
    <p><strong>Estudiante:</strong> ${sol.Estudiante_Nombre || sol.Estudiante || '-'}</p>
    <p><strong>Beca:</strong> ${sol.Beca_Nombre || sol.Beca || '-'}</p>
    <p><strong>Monto:</strong> ${formatMoney(sol.Monto_Solicitado || sol.Monto || 0)}</p>
    <p><strong>Estado:</strong> ${sol.Estado || '-'}</p>
    <p><strong>Fecha:</strong> ${formatNeoDate(sol.Fecha_Envio || sol.Fecha)}</p>
    <p><strong>Justificación:</strong> ${sol.Justificacion || '-'}</p>
  `
  document.getElementById('modal-sol-content').innerHTML = content
  document.getElementById('modal-detalle-solicitud').style.display = 'flex'
}

function cerrarModalDetalle() {
  document.getElementById('modal-detalle-solicitud').style.display = 'none'
}
