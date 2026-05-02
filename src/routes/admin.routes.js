const express = require('express')
const router = express.Router()
const controller = require('../controllers/admin.controller')
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware')
const upload = require('../services/upload.service')

router.use(verificarToken, soloAdmin)

// ─── Crear nodos ───────────────────────────────────────────────
router.post('/revisor', controller.crearRevisor)
router.post('/beca', controller.crearBeca)
router.put('/beca/:id', controller.actualizarBeca)
router.post('/alerta', controller.crearAlertaManual)

// ─── Gestión de propiedades en nodos ───────────────────────────
router.patch('/alerta/:alertaId/observacion', controller.agregarObservacionAlerta)
router.patch('/solicitudes/auditar', controller.agregarAuditadoSolicitudes)
router.patch('/alerta/:alertaId/riesgo', controller.actualizarNivelRiesgoAlerta)
router.patch('/estudiantes/desactivar', controller.desactivarEstudiantes)
router.delete('/dispositivo/:dispositivoId/ip', controller.eliminarIPHash)
router.delete('/alertas/campo', controller.eliminarCampoAlertas)

// ─── Visualización ─────────────────────────────────────────────
router.get('/revisores', controller.verRevisoresActivos)
router.get('/alertas/activas', controller.verAlertasActivas)
router.get('/solicitudes/estados', controller.contarSolicitudesPorEstado)
router.get('/agregaciones', controller.agregaciones)
router.get('/lista/alertas', controller.listarAlertas)
router.get('/lista/solicitudes', controller.listarSolicitudes)
router.get('/lista/estudiantes', controller.listarEstudiantes)
router.get('/lista/dispositivos', controller.listarDispositivos)
router.get('/lista/becas', controller.listarBecas)

// ─── Filtros ───────────────────────────────────────────────────
router.get('/estudiantes/promedio/:becaId', controller.filtrarEstudiantesPorPromedio)
router.get('/documentos/invalidos', controller.filtrarDocumentosInvalidos)
router.get('/pagos/fallidos', controller.filtrarPagosFallidos)

// ─── Eliminar nodos ────────────────────────────────────────────
router.delete('/alerta/:alertaId', controller.eliminarAlerta)
router.delete('/alertas', controller.eliminarAlertasResueltas)

// ─── Relaciones ────────────────────────────────────────────────
router.patch('/adjuntas/auditar', controller.auditarAdjuntas)
router.patch('/alertas/estado', controller.actualizarEstadoAlertas)
router.delete('/alertas/relaciones', controller.eliminarGeneraAlertas)
router.delete('/solicitud/:solicitudId/revisor/:revisorId/nota', controller.eliminarNotaRevision)
router.patch('/adjuntas/desauditar', controller.eliminarAuditadaAdjuntas)

router.post('/estudiantes/csv', upload.single('archivo'), controller.cargarEstudiantesCSV)

module.exports = router