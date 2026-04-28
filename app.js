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

// Rutas
app.use('/api/reports', require('./src/routes/fraud.routes'))
// app.use('/api/estudiante', require('./src/routes/estudiante.routes'))
// app.use('/api/solicitud',  require('./src/routes/solicitud.routes'))
// app.use('/api/admin',      require('./src/routes/admin.routes'))

// Inicio
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

