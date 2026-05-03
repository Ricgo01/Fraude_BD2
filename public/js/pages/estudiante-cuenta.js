let cuentaActualId = null
let cuentasCache = []

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('estudiante')) return
  cargarCuentas()
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
    cuentaActualId = null
    cargarCuentas()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarCuentas() {
  const tbody = document.getElementById('cuentas-table')
  const select = document.getElementById('cuenta-select')

  try {
    const response = await apiGet('/estudiante/cuentas')
    cuentasCache = response.data || []

    if (!cuentasCache.length) {
      tbody.innerHTML = '<tr><td colspan="5">No hay cuentas registradas.</td></tr>'
      select.innerHTML = '<option value="">Sin cuentas registradas</option>'
      return
    }

    tbody.innerHTML = cuentasCache.map((cuenta) => {
      const terminacion = (cuenta.Terminacion && typeof cuenta.Terminacion === 'object' && cuenta.Terminacion.low !== undefined)
        ? cuenta.Terminacion.low
        : (cuenta.Terminacion || '-')
      const fechaReg = (cuenta.Fecha_Registro && typeof cuenta.Fecha_Registro === 'object' && cuenta.Fecha_Registro.year !== undefined)
        ? formatNeoDate(cuenta.Fecha_Registro)
        : (cuenta.Fecha_Registro || '-')
      return `
      <tr>
        <td>${cuenta.Banco || '-'}</td>
        <td>${cuenta.Tipo_Cuenta || '-'}</td>
        <td>****${terminacion}</td>
        <td>${cuenta.Activa ? 'Si' : 'No'}</td>
        <td>${cuenta.Verificada ? 'Si' : 'No'}</td>
      </tr>`
    }).join('')

    select.innerHTML = ['<option value="">Selecciona una cuenta</option>']
      .concat(cuentasCache.map((cuenta) => (
        `<option value="${cuenta.ID}">${cuenta.Banco || 'Cuenta'} - ${cuenta.Terminacion || '----'}</option>`
      )))
      .join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Error cargando cuentas.</td></tr>'
  }
}

function seleccionarCuenta() {
  const select = document.getElementById('cuenta-select')
  const selectedId = select.value
  if (!selectedId) return

  const cuenta = cuentasCache.find((item) => item.ID === selectedId)
  if (!cuenta) return

  cuentaActualId = cuenta.ID
  document.getElementById('banco').value = cuenta.Banco || ''
  document.getElementById('tipoCuenta').value = cuenta.Tipo_Cuenta || ''
  const terminacionVal = (cuenta.Terminacion && typeof cuenta.Terminacion === 'object' && cuenta.Terminacion.low !== undefined)
    ? cuenta.Terminacion.low
    : (cuenta.Terminacion || '')
  document.getElementById('terminacion').value = terminacionVal
  document.getElementById('activa').value = cuenta.Activa ? 'true' : 'false'
  const fechaRegistroVal = (cuenta.Fecha_Registro && typeof cuenta.Fecha_Registro === 'object' && cuenta.Fecha_Registro.year !== undefined)
    ? formatNeoDate(cuenta.Fecha_Registro)
    : (cuenta.Fecha_Registro || '')
  document.getElementById('fechaRegistro').value = fechaRegistroVal
  document.getElementById('principal').value = cuenta.Principal ? 'true' : 'false'
  document.getElementById('verificada').value = cuenta.Verificada ? 'true' : 'false'
}

async function actualizarCuenta() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  if (!cuentaActualId) {
    message.innerHTML = '<div class="alert alert-error">Selecciona una cuenta para actualizar.</div>'
    return
  }

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
    await apiPatch(`/estudiante/cuenta/${cuentaActualId}`, payload)
    message.innerHTML = '<div class="alert alert-success">Cuenta actualizada.</div>'
    cargarCuentas()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}
