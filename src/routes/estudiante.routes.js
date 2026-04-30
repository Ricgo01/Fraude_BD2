// src/routes/estudiante.routes.js
const express = require('express')
const router = express.Router()
const controller = require('../controllers/estudiante.controller')
const { verificarToken, soloEstudiante } = require('../middlewares/auth.middleware')

// Todas las rutas requieren token y rol estudiante
router.use(verificarToken, soloEstudiante)

// ─── Crear nodos ───────────────────────────────────────────────
router.post('/solicitud', controller.crearSolicitud)
router.post('/documento', controller.crearDocumento)

// ─── Merge nodos ───────────────────────────────────────────────
router.post('/institucion', controller.mergeInstitucion)
router.post('/cuenta', controller.mergeCuenta)
router.post('/dispositivo', controller.mergeDispositivo)
router.post('/direccion', controller.mergeDireccion)
router.post('/referencia', controller.mergeReferencia)

// ─── Leer ──────────────────────────────────────────────────────
router.get('/perfil', controller.verPerfil)
router.get('/solicitudes', controller.verSolicitudes)
router.get('/documentos', controller.verDocumentos)

module.exports = router