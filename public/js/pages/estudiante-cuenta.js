document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
})

async function guardarCuenta() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Banco: document.getElementById('banco').value.trim(),
    Tipo_Cuenta: document.getElementById('tipoCuenta').value.trim(),
    Terminacion: document.getElementById('terminacion').value,
    Activa: document.getElementById('activa').value === 'true',
    Fecha_Registro: document.getElementById('fechaRegistro').value,
    Principal: document.getElementById('principal').value === 'true',
    Verificada: document.getElementById('verificada').value === 'true'
  }

  try {
    await apiPost('/estudiante/cuenta', payload)
    message.innerHTML = '<div class="alert alert-success">Cuenta registrada.</div>'
    document.getElementById('cuenta-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
