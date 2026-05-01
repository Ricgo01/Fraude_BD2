document.addEventListener('DOMContentLoaded', () => {
  const registroForm = document.getElementById('registro-form')
  const message = document.getElementById('message')

  if (!registroForm) return

  registroForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    message.innerHTML = ''

    const payload = {
      Nombre_Completo: document.getElementById('nombre').value.trim(),
      Email: document.getElementById('email').value.trim(),
      Fecha_Nacimiento: document.getElementById('fechaNacimiento').value,
      Promedio: document.getElementById('promedio').value,
      Rol: document.getElementById('rol').value
    }

    if (!payload.Nombre_Completo || !payload.Email) {
      message.innerHTML = '<div class="alert alert-error">Completa todos los campos requeridos.</div>'
      return
    }

    try {
      const result = await apiPost('/auth/registro', payload)
      if (!result || !result.token || !result.usuario) {
        throw new Error('Respuesta de registro invalida')
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('rol', result.usuario.rol)
      localStorage.setItem('usuario', JSON.stringify(result.usuario))

      redirectByRole(result.usuario.rol)
    } catch (error) {
      message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
    }
  })
})

function redirectByRole(role) {
  if (role === 'admin') {
    window.location.href = '/admin/dashboard'
    return
  }

  if (role === 'revisor') {
    window.location.href = '/revisor/dashboard'
    return
  }

  window.location.href = '/estudiante/dashboard'
}
