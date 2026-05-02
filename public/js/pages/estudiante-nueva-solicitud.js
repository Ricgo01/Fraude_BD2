document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarBecas()
})

async function cargarBecas() {
  const select = document.getElementById('becaId')
  try {
    const response = await apiGet('/estudiante/becas')
    const becas = response.data || []

    if (!becas.length) {
      select.innerHTML = '<option value="">Sin becas disponibles</option>'
      return
    }

    select.innerHTML = ['<option value="">Selecciona una beca</option>']
      .concat(becas.map((beca) => (
        `<option value="${beca.ID}">${beca.Nombre_Beca || 'Beca'} - ${formatMoney(beca.Monto_Max)}</option>`
      )))
      .join('')
  } catch (error) {
    select.innerHTML = '<option value="">Error cargando becas</option>'
  }
}

async function crearSolicitud() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Motivo_Apoyo: document.getElementById('motivo').value.trim(),
    Monto_Solicitado: document.getElementById('monto').value,
    Apoyo_Total: document.getElementById('apoyoTotal').value === 'true',
    Beca_ID: document.getElementById('becaId').value.trim()
  }

  if (!payload.Motivo_Apoyo || !payload.Monto_Solicitado || !payload.Beca_ID) {
    message.innerHTML = '<div class="alert alert-error">Completa todos los campos.</div>'
    return
  }

  try {
    await apiPost('/estudiante/solicitud', payload)
    message.innerHTML = '<div class="alert alert-success">Solicitud creada correctamente.</div>'
    document.getElementById('solicitud-form').reset()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
