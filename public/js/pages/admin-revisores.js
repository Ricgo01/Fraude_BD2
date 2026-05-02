document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarRevisores()
})

async function crearRevisor() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Nombre: document.getElementById('revisorNombre').value.trim(),
    Rol: document.getElementById('revisorRol').value.trim(),
    Email: document.getElementById('revisorEmail').value.trim(),
    Fecha_Ingreso: document.getElementById('revisorFecha').value,
    Especialidades: Array.from(document.querySelectorAll('#revisorEspecialidades input[type="checkbox"]:checked')).map(cb => cb.value)
  }

  try {
    await apiPost('/admin/revisor', payload)
    message.innerHTML = '<div class="alert alert-success">Revisor creado correctamente.</div>'
    cargarRevisores()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarRevisores() {
  const tbody = document.getElementById('revisores-table')
  try {
    const response = await apiGet('/admin/revisores')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay revisores activos.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.ID || '-'}</td>
        <td>${item.Nombre || '-'}</td>
        <td>${item.Email || '-'}</td>
        <td>${item.Rol || '-'}</td>
        <td>${Array.isArray(item.Especialidades) ? item.Especialidades.join(', ') : (item.Especialidades || '-')}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando revisores.</td></tr>'
  }
}
