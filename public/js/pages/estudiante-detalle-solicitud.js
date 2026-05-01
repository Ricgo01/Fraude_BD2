document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarDetalle()
})

async function cargarDetalle() {
  const message = document.getElementById('message')
  const solicitudId = window.solicitudId

  if (!solicitudId) {
    message.innerHTML = '<div class="alert alert-error">Solicitud no valida.</div>'
    return
  }

  try {
    const response = await apiGet('/estudiante/solicitudes')
    const solicitudes = response.data || []
    const solicitud = solicitudes.find((item) => item.ID === solicitudId)

    if (!solicitud) {
      message.innerHTML = '<div class="alert alert-error">Solicitud no encontrada.</div>'
      return
    }

    document.getElementById('solicitud-id').textContent = solicitud.ID || '-'
    document.getElementById('solicitud-estado').textContent = solicitud.Estado || '-'
    document.getElementById('solicitud-monto').textContent = formatMoney(solicitud.Monto_Solicitado)
    document.getElementById('solicitud-apoyo').textContent = solicitud.Apoyo_Total ? 'Si' : 'No'

    document.getElementById('solicitud-info').textContent = `Motivo: ${solicitud.Motivo_Apoyo || '-'} | Fecha envio: ${solicitud.Fecha_Envio || '-'}`
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
