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

// Rutas — se agregan aquí conforme las vayamos creando
// app.use('/estudiante', require('./src/routes/estudiante.routes'))
// app.use('/solicitud',  require('./src/routes/solicitud.routes'))
// app.use('/admin',      require('./src/routes/admin.routes'))

// Inicio
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

