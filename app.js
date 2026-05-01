require('dotenv').config()
const express = require('express')

const app = express()

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// Motor de vistas
app.set('view engine', 'ejs')
app.set('views', './views')

const renderView = (view, getOptions) => (req, res, next) => {
    const accept = req.headers.accept || ''
    if (!accept.includes('text/html')) {
        return next()
    }

    const options = typeof getOptions === 'function' ? getOptions(req) : (getOptions || {})
    return res.render(view, options)
}

// Vistas
app.get('/', (req, res) => res.redirect('/login'))
app.get('/login', renderView('auth/login', { title: 'Login', role: 'public' }))
app.get('/registro', renderView('auth/registro', { title: 'Registro', role: 'public' }))

app.get('/admin/dashboard', renderView('admin/dashboard', { title: 'Dashboard', role: 'admin' }))
app.get('/admin/becas', renderView('admin/becas', { title: 'Becas', role: 'admin' }))
app.get('/admin/revisores', renderView('admin/revisores', { title: 'Revisores', role: 'admin' }))
app.get('/admin/alertas', renderView('admin/alertas', { title: 'Alertas', role: 'admin' }))
app.get('/admin/fraude', renderView('admin/fraude', { title: 'Fraude', role: 'admin' }))
app.get('/admin/agregaciones', renderView('admin/agregaciones', { title: 'Agregaciones', role: 'admin' }))
app.get('/admin/carga-csv', renderView('admin/carga-csv', { title: 'Carga CSV', role: 'admin' }))

app.get('/estudiante/dashboard', renderView('estudiante/dashboard', { title: 'Dashboard', role: 'estudiante' }))
app.get('/estudiante/perfil', renderView('estudiante/perfil', { title: 'Perfil', role: 'estudiante' }))
app.get('/estudiante/solicitudes', renderView('estudiante/solicitudes', { title: 'Solicitudes', role: 'estudiante' }))
app.get('/estudiante/solicitudes/nueva', renderView('estudiante/nueva-solicitud', { title: 'Nueva solicitud', role: 'estudiante' }))
app.get('/estudiante/solicitudes/:solicitudId', renderView('estudiante/detalle-solicitud', (req) => ({
    title: 'Detalle de solicitud',
    role: 'estudiante',
    solicitudId: req.params.solicitudId
})))
app.get('/estudiante/documentos', renderView('estudiante/documentos', { title: 'Documentos', role: 'estudiante' }))
app.get('/estudiante/cuenta', renderView('estudiante/cuenta', { title: 'Cuenta bancaria', role: 'estudiante' }))
app.get('/estudiante/direccion', renderView('estudiante/direccion', { title: 'Direccion', role: 'estudiante' }))
app.get('/estudiante/institucion', renderView('estudiante/institucion', { title: 'Institucion', role: 'estudiante' }))
app.get('/estudiante/dispositivo', renderView('estudiante/dispositivo', { title: 'Dispositivo', role: 'estudiante' }))
app.get('/estudiante/referencia', renderView('estudiante/referencia', { title: 'Referencia', role: 'estudiante' }))

app.get('/revisor/solicitudes', renderView('reviewer/requests', { title: 'Solicitudes', role: 'revisor' }))
app.get('/revisor/dashboard', renderView('reviewer/dashboard', { title: 'Dashboard', role: 'revisor' }))
app.get('/revisor/solicitud/:solicitudId', renderView('reviewer/request-detail', (req) => ({
    title: 'Detalle de solicitud',
    role: 'revisor',
    solicitudId: req.params.solicitudId
})))

// Rutas
app.use('/api/reports', require('./src/routes/fraud.routes'))
app.use('/auth', require('./src/routes/auth.routes'))
app.use('/estudiante', require('./src/routes/estudiante.routes'))
app.use('/revisor', require('./src/routes/revisor.routes'))
app.use('/admin', require('./src/routes/admin.routes'))
// Inicio
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})