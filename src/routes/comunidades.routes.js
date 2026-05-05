// src/routes/comunidades.routes.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/comunidades.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware')

// Todas las rutas requieren token y rol admin
router.use(verificarToken)
router.use(soloAdmin)

// POST /admin/comunidades/ejecutar
// Corre el algoritmo Louvain y guarda resultados en la BD
router.post('/ejecutar', controller.ejecutarLouvain)

// GET /admin/comunidades/resultados
// Devuelve los resultados del último análisis sin volver a correr
router.get('/resultados', controller.verResultados)

// DELETE /admin/comunidades/limpiar
// Limpia las propiedades del algoritmo para demo
router.delete('/limpiar', controller.limpiarComunidades)

module.exports = router