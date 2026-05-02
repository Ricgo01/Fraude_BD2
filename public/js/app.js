function formatNumber(value) {
  if (value === undefined || value === null || value === '') return '0'
  let num = value;
  if (typeof value === 'object' && value.low !== undefined) num = value.low;
  return Number(num).toLocaleString('es-GT')
}

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return 'Q0.00'
  let num = value;
  if (typeof value === 'object' && value.low !== undefined) num = value.low;
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2
  }).format(Number(num));
}

function formatNeoDate(fecha) {
  if (!fecha) return '-';
  if (typeof fecha === 'string') return fecha;
  if (fecha.year !== undefined) {
    const y = typeof fecha.year === 'object' && fecha.year.low !== undefined ? fecha.year.low : fecha.year;
    const mRaw = typeof fecha.month === 'object' && fecha.month.low !== undefined ? fecha.month.low : fecha.month;
    const dRaw = typeof fecha.day === 'object' && fecha.day.low !== undefined ? fecha.day.low : fecha.day;
    
    const m = String(mRaw).padStart(2, '0');
    const d = String(dRaw).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return JSON.stringify(fecha);
}

function shortId(id) {
  if (!id) return '-';
  return id.substring(0, 8) + '...';
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
    return '<span class="badge badge-aprobada">APROBADA</span>'
  }

  if (normalized.includes('rechaz')) {
    return '<span class="badge badge-rechazada">RECHAZADA</span>'
  }

  if (normalized.includes('pend')) {
    return '<span class="badge badge-pendiente">PENDIENTE</span>'
  }

  if (normalized.includes('revisión') || normalized.includes('revision')) {
    return '<span class="badge badge-en-revision">EN REVISIÓN</span>'
  }

  return `<span class="badge badge-info">${status}</span>`
}

function traducirTipoAlerta(tipo) {
  const tipos = {
    cuenta_compartida: 'Cuenta compartida',
    documento_reutilizado: 'Documento reutilizado',
    red_de_fraude: 'Red de fraude',
    dispositivo_repetido: 'Dispositivo repetido',
    direccion_compartida: 'Dirección compartida',
    solicitud_duplicada: 'Solicitud duplicada',
    aval_sospechoso: 'Aval sospechoso',
    SHARED_ACCOUNT: 'Cuenta compartida',
    REUSED_DOCUMENT: 'Documento reutilizado',
    FRAUD_NETWORK: 'Red de fraude'
  }

  return tipos[tipo] || tipo || '-'
}

function requireAuth(expectedRole) {
  const token = getToken()
  const role = localStorage.getItem('rol')

  if (!token) {
    logout()
    return false
  }

  if (expectedRole && role !== expectedRole) {
    const roleRedirects = {
      admin: '/admin/dashboard',
      revisor: '/revisor/dashboard',
      estudiante: '/estudiante/dashboard'
    }

    if (roleRedirects[role]) {
      window.location.href = roleRedirects[role]
      return false
    }

    logout()
    return false
  }

  return true
}

function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || '{}')
  } catch (error) {
    return {}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const usuario = getUsuario()
  const role = localStorage.getItem('rol')

  const roleEl = document.getElementById('nav-role')
  if (roleEl && role) {
    roleEl.textContent = role
  }

  const userEl = document.getElementById('nav-user')
  if (userEl) {
    userEl.textContent = usuario.nombre || usuario.email || 'Usuario'
  }

  const logoutLink = document.getElementById('logout-link')
  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault()
      logout()
    })
  }

  const currentPath = window.location.pathname
  document.querySelectorAll('.sidebar a').forEach((link) => {
    const href = link.getAttribute('href')
    if (href && currentPath.startsWith(href)) {
      link.classList.add('active')
    }
  })
})