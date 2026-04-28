const express = require('express')
const router = express.Router()

// Inicio
router.get('/', (req, res) => {
  res.redirect('/admin/dashboard')
})

// Auth
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar sesión',
    role: 'auth'
  })
})

// Estudiante
router.get('/estudiante/dashboard', (req, res) => {
  res.render('estudiante/dashboard', {
    title: 'Dashboard Estudiante',
    role: 'estudiante'
  })
})

router.get('/estudiante/solicitudes', (req, res) => {
  res.render('estudiante/solicitudes', {
    title: 'Mis Solicitudes',
    role: 'estudiante'
  })
})

// Revisor
router.get('/revisor/dashboard', (req, res) => {
  res.render('revisor/dashboard', {
    title: 'Dashboard Revisor',
    role: 'revisor'
  })
})

router.get('/revisor/solicitudes', (req, res) => {
  res.render('revisor/solicitudes', {
    title: 'Solicitudes Pendientes',
    role: 'revisor'
  })
})

// Admin
router.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Dashboard Admin',
    role: 'admin'
  })
})

router.get('/admin/alertas', (req, res) => {
  res.render('admin/alertas', {
    title: 'Gestión de Alertas',
    role: 'admin'
  })
})

router.get('/admin/fraude', (req, res) => {
  res.render('admin/fraude', {
    title: 'Detección de Fraude',
    role: 'admin'
  })
})

router.get('/admin/reportes', (req, res) => {
  res.render('admin/reportes', {
    title: 'Reportes',
    role: 'admin'
  })
})

router.get('/admin/becas', (req, res) => {
  res.render('admin/becas', {
    title: 'Gestión de Becas',
    role: 'admin'
  })
})

router.get('/admin/usuarios', (req, res) => {
  res.render('admin/usuarios', {
    title: 'Gestión de Usuarios',
    role: 'admin'
  })
})

module.exports = router