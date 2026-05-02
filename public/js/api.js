const BASE_URL = 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

function getRol() {
  return localStorage.getItem('rol')
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
  if (response.status === 401 || response.status === 403) {
    handleAuthError(response)
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

function handleAuthError(response) {
  logout()
}

function mostrarToast(message, type = 'error') {
  const toastContainer = document.getElementById('toast-container') || document.body;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  
  // Estilo básico en caso de no estar en CSS
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '15px 25px';
  toast.style.borderRadius = '8px';
  toast.style.color = 'white';
  toast.style.fontWeight = 'bold';
  toast.style.zIndex = '9999';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease-in-out';
  
  if (type === 'success') toast.style.backgroundColor = '#10B981'; // Green
  else if (type === 'error') toast.style.backgroundColor = '#EF4444'; // Red
  else if (type === 'warning') toast.style.backgroundColor = '#F59E0B'; // Yellow
  else toast.style.backgroundColor = '#3B82F6'; // Blue

  toastContainer.appendChild(toast);
  
  // Fade in
  setTimeout(() => toast.style.opacity = '1', 10);
  
  // Fade out
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
