document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth('admin')) return
  cargarBecasStats()
  cargarCatalogoBecas()
})

async function cargarCatalogoBecas() {
  const select = document.getElementById('becaFiltroId')
  try {
    const response = await apiGet('/admin/lista/becas')
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

async function crearBeca() {
  const message = document.getElementById('message')
  message.innerHTML = ''

  const payload = {
    Nombre_Beca: document.getElementById('nombreBeca').value.trim(),
    Categoria: document.getElementById('categoria').value.trim(),
    Monto_Max: document.getElementById('montoMax').value,
    Renovable: document.getElementById('renovable').value === 'true',
    Fecha_Inicio: document.getElementById('fechaInicio').value
  }

  try {
    await apiPost('/admin/beca', payload)
    message.innerHTML = '<div class="alert alert-success">Beca creada correctamente.</div>'
    cargarBecasStats()
  } catch (error) {
    message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
  }
}

async function cargarBecasStats() {
  const tbody = document.getElementById('becas-table')
  try {
    const response = await apiGet('/api/reports/scholarships/stats')
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7">No hay datos disponibles.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.beca_id || '-'}</td>
        <td>${item.nombre_beca || '-'}</td>
        <td>${item.categoria || '-'}</td>
        <td>${formatNumber(item.numero_solicitudes)}</td>
        <td>${formatMoney(item.monto_promedio)}</td>
        <td>${formatMoney(item.monto_minimo_solicitado)}</td>
        <td>${formatMoney(item.monto_maximo_solicitado)}</td>
        <td>
          <button class="btn btn-secondary" onclick="abrirModalEditarBeca('${item.beca_id}', '${item.nombre_beca}', '${item.categoria}', ${item.monto_maximo_beca}, ${item.renovable})">Editar</button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="8">Error cargando estadisticas.</td></tr>'
  }
}

function abrirModalEditarBeca(id, nombre, categoria, monto, renovable) {
  document.getElementById('editBecaId').value = id
  document.getElementById('editNombreBeca').value = nombre || ''
  document.getElementById('editCategoria').value = categoria || ''
  document.getElementById('editMontoMax').value = monto || 0
  document.getElementById('editRenovable').value = renovable ? 'true' : 'false'
  document.getElementById('modal-editar-beca').style.display = 'flex'
}

function cerrarModalEditarBeca() {
  document.getElementById('modal-editar-beca').style.display = 'none'
}

async function guardarBeca() {
  const id = document.getElementById('editBecaId').value
  const payload = {
    Nombre_Beca: document.getElementById('editNombreBeca').value.trim(),
    Categoria: document.getElementById('editCategoria').value.trim(),
    Monto_Max: document.getElementById('editMontoMax').value,
    Renovable: document.getElementById('editRenovable').value === 'true'
  }

  try {
    await apiPut(`/admin/beca/${id}`, payload)
    mostrarToast('Beca actualizada correctamente', 'success')
    cerrarModalEditarBeca()
    cargarBecasStats()
    cargarCatalogoBecas()
  } catch (error) {
    mostrarToast(error.message, 'error')
  }
}

async function filtrarEstudiantes() {
  const becaId = document.getElementById('becaFiltroId').value.trim()
  const tbody = document.getElementById('estudiantes-table')

  if (!becaId) {
    tbody.innerHTML = '<tr><td colspan="4">Selecciona una beca.</td></tr>'
    return
  }

  try {
    const response = await apiGet(`/admin/estudiantes/promedio/${becaId}`)
    const items = response.data || []

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4">Sin resultados.</td></tr>'
      return
    }

    tbody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.ID || '-'}</td>
        <td>${item.Nombre_Completo || '-'}</td>
        <td>${item.Email || '-'}</td>
        <td>${item.Promedio || 0}</td>
      </tr>
    `).join('')
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4">Error consultando estudiantes.</td></tr>'
  }
}
