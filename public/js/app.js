async function apiGet(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`)
  }

  return response.json()
}

async function apiPost(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`)
  }

  return response.json()
}

async function apiPut(url, body = {}) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`)
  }

  return response.json()
}

function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '0'
  return Number(value).toLocaleString('es-GT')
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return 'Q0'
  return `Q${Number(value).toLocaleString('es-GT')}`
}

function riskBadge(risk) {
  if (!risk) return '<span class="badge badge-info">SIN DATOS</span>'

  const normalized = String(risk).toLowerCase()

  if (normalized.includes('critico') || normalized.includes('crítico')) {
    return '<span class="badge badge-critico">CRÍTICO</span>'
  }

  if (normalized.includes('alto')) {
    return '<span class="badge badge-alto">ALTO</span>'
  }

  if (normalized.includes('medio')) {
    return '<span class="badge badge-medio">MEDIO</span>'
  }

  if (normalized.includes('bajo')) {
    return '<span class="badge badge-bajo">BAJO</span>'
  }

  return `<span class="badge badge-info">${risk}</span>`
}

function statusBadge(status) {
  if (!status) return '<span class="badge badge-info">SIN ESTADO</span>'

  const normalized = String(status).toLowerCase()

  if (normalized.includes('aprob')) {
    return '<span class="badge badge-bajo">APROBADA</span>'
  }

  if (normalized.includes('rechaz')) {
    return '<span class="badge badge-alto">RECHAZADA</span>'
  }

  if (normalized.includes('pend')) {
    return '<span class="badge badge-medio">PENDIENTE</span>'
  }

  if (normalized.includes('revisión') || normalized.includes('revision')) {
    return '<span class="badge badge-info">EN REVISIÓN</span>'
  }

  return `<span class="badge badge-info">${status}</span>`
}

function traducirTipoAlerta(tipo) {
  const tipos = {
    SHARED_ACCOUNT: 'Cuenta compartida',
    REUSED_DOCUMENT: 'Documento reutilizado',
    FRAUD_NETWORK: 'Red de fraude'
  }

  return tipos[tipo] || tipo || '-'
}