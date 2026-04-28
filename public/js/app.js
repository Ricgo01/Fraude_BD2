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
  if (value === undefined || value === null) return '0'
  return Number(value).toLocaleString('es-GT')
}

function riskBadge(risk) {
  if (!risk) return '<span class="badge badge-bajo">SIN RIESGO</span>'

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

  return '<span class="badge badge-bajo">BAJO</span>'
}