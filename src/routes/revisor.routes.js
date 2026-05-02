const express = require('express')
const router = express.Router()
const controller = require('../controllers/revisor.controller')
const { verificarToken, soloRevisor } = require('../middlewares/auth.middleware')

router.use(verificarToken, soloRevisor)

// ─── Solicitudes ───────────────────────────────────────────────
router.put('/solicitud/:solicitudId/resolver', controller.resolverSolicitud)
router.get('/solicitudes/pendientes', controller.verSolicitudesPendientes)
router.get('/solicitudes/pendientes/count', controller.contarSolicitudesPendientes)
router.get('/solicitudes/riesgo', controller.verSolicitudesPorRiesgo)
router.get('/solicitud/:solicitudId', controller.verDetalleSolicitud)
router.delete('/solicitud/:solicitudId/motivo', controller.eliminarMotivoSolicitud)
router.get('/solicitudes/disponibles', controller.verSolicitudesDisponibles)
router.patch('/solicitud/:solicitudId/tomar', controller.tomarSolicitud)

// ─── Documentos ────────────────────────────────────────────────
router.patch('/documentos/revisar', controller.marcarDocumentosRevisados)
router.delete('/solicitud/:solicitudId/documento/:documentoId', controller.eliminarAdjunta)

// ─── Relaciones ────────────────────────────────────────────────
router.patch('/solicitud/:solicitudId/nota', controller.agregarNotaRevision)

module.exports = router