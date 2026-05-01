document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarPerfil()
})

async function cargarPerfil() {
  const message = document.getElementById('message')
  try {
    const response = await apiGet('/estudiante/perfil')
    const perfil = response.data || {}

    document.getElementById('perfil-nombre').textContent = perfil.Nombre_Completo || '-'
    document.getElementById('perfil-email').textContent = perfil.Email || '-'
    document.getElementById('perfil-promedio').textContent = perfil.Promedio || 0
    document.getElementById('perfil-fecha').textContent = perfil.Fecha_Registro || '-'
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
