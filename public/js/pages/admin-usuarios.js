document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarEstudiantes()
})

async function cargarEstudiantes() {
  const tbody = document.getElementById('estudiantes-table')
  
  try {
    const response = await apiGet('/admin/lista/estudiantes')
    const estudiantes = response.data || []

    if (!estudiantes.length) {
      tbody.innerHTML = '<tr><td colspan="6">No hay estudiantes registrados.</td></tr>'
      return
    }

    tbody.innerHTML = estudiantes.map(est => `
      <tr>
        <td>
          <input type="checkbox" class="student-checkbox" value="${est.id}" ${!est.activo ? 'disabled' : ''}>
        </td>
        <td>${est.id || '-'}</td>
        <td>${est.nombre || est.nombre_completo || '-'}</td>
        <td>${est.email || '-'}</td>
        <td>${est.promedio || 0}</td>
        <td>
          ${est.activo 
            ? '<span class="badge badge-bajo">Activo</span>' 
            : '<span class="badge badge-alto">Inactivo</span>'}
        </td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6">Error cargando estudiantes.</td></tr>'
    mostrarToast(error.message, 'error')
  }
}

function toggleSelectAll(source) {
  const checkboxes = document.querySelectorAll('.student-checkbox:not([disabled])')
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = source.checked
  }
}

async function ejecutarGuillotina() {
  const checkboxes = document.querySelectorAll('.student-checkbox:checked')
  const estudianteIds = Array.from(checkboxes).map(cb => cb.value)

  if (estudianteIds.length === 0) {
    mostrarToast('Selecciona al menos un estudiante para desactivar.', 'warning')
    return
  }

  if (!confirm(`¿Estás seguro de que quieres DESACTIVAR a ${estudianteIds.length} estudiante(s)? Esta acción restringirá su acceso al sistema.`)) {
    return
  }

  try {
    await apiPatch('/admin/estudiantes/desactivar', { estudianteIds })
    mostrarToast(`${estudianteIds.length} estudiante(s) desactivados correctamente.`, 'success')
    document.getElementById('select-all').checked = false
    cargarEstudiantes()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}
