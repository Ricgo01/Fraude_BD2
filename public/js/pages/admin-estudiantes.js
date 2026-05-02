document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarEstudiantes()
})

let todosEstudiantes = []

async function cargarEstudiantes() {
  const tbody = document.getElementById('estudiantes-table')
  tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>'
  
  try {
    const response = await apiGet('/admin/lista/estudiantes')
    todosEstudiantes = response.data || []
    filtrarTabla()
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="7">Error cargando estudiantes. Intenta usar otro endpoint si este no existe.</td></tr>'
    console.error(error)
  }
}

function renderEstudiantes(items) {
  const tbody = document.getElementById('estudiantes-table')
  if (!items.length) {
    tbody.innerHTML = `
      <div class="empty-state">
        <p>No hay datos para mostrar</p>
        <button onclick="cargarEstudiantes()">Recargar</button>
      </div>`
    return
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><input type="checkbox" class="estudiante-cb" value="${item.ID}"></td>
      <td title="${item.ID}">${shortId(item.ID)}</td>
      <td>${item.Nombre_Completo || item.Nombre || '-'}</td>
      <td>${item.Email || '-'}</td>
      <td>${item.Promedio || 0}</td>
      <td>
        <span class="badge badge-${item.Activo ? 'aprobada' : 'rechazada'}">
          ${item.Activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>${formatNeoDate(item.Fecha_Registro)}</td>
    </tr>
  `).join('')
}

function filtrarTabla() {
  const nombreQuery = document.getElementById('filtro-nombre').value.toLowerCase()
  const activoQuery = document.getElementById('filtro-activo').value

  const filtrados = todosEstudiantes.filter(est => {
    const nombre = (est.Nombre_Completo || est.Nombre || '').toLowerCase()
    const matchNombre = nombre.includes(nombreQuery)
    
    let matchActivo = true
    if (activoQuery !== '') {
      const activoBool = activoQuery === 'true'
      matchActivo = est.Activo === activoBool || String(est.Activo) === activoQuery
    }
    
    return matchNombre && matchActivo
  })

  renderEstudiantes(filtrados)
}

function toggleAll(source) {
  const checkboxes = document.querySelectorAll('.estudiante-cb')
  checkboxes.forEach(cb => cb.checked = source.checked)
}

async function desactivarSeleccionados() {
  const checkboxes = document.querySelectorAll('.estudiante-cb:checked')
  const ids = Array.from(checkboxes).map(cb => cb.value)

  if (!ids.length) {
    mostrarToast('Selecciona al menos un estudiante', 'warning')
    return
  }

  if (confirm('¿Estás seguro? Esta acción no se puede deshacer.')) {
    try {
      await apiPatch('/admin/estudiantes/desactivar', { estudianteIds: ids })
      mostrarToast('Estudiantes desactivados', 'success')
      cargarEstudiantes()
    } catch (error) {
      mostrarToast(error.message, 'error')
    }
  }
}


