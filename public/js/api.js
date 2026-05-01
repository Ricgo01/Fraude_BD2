function getToken() {
  return localStorage.getItem('token')
}

function authHeaders(extra = {}, includeJson = true) {
  const headers = { ...extra }

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  headers['Accept'] = 'application/json'

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

function logout() {
  localStorage.clear()
  window.location.href = '/login'
}

async function handleResponse(response) {
  if (response.status === 401) {
    logout()
    throw new Error('Sesion expirada o no autorizada')
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message = payload && payload.message ? payload.message : `Error HTTP ${response.status}`
    throw new Error(message)
  }

  return payload
}

async function apiGet(url, headers = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(headers)
  })

  return handleResponse(response)
}

async function apiPost(url, body = {}, headers = {}) {
  const isForm = body instanceof FormData
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(headers, !isForm),
    body: isForm ? body : JSON.stringify(body)
  })

  return handleResponse(response)
}

async function apiPut(url, body = {}, headers = {}) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: authHeaders(headers),
    body: JSON.stringify(body)
  })

  return handleResponse(response)
}

async function apiPatch(url, body = {}, headers = {}) {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(headers),
    body: JSON.stringify(body)
  })

  return handleResponse(response)
}

async function apiDelete(url, body = null, headers = {}) {
  const options = {
    method: 'DELETE',
    headers: authHeaders(headers)
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  return handleResponse(response)
}
