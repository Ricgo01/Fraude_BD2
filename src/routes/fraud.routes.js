/**
 * FRAUDE_BD2 - Fraud Routes
 * Define todos los endpoints de la API para reportes de fraude y alertas
 */

const express = require('express');
const fraudController = require('../controllers/fraudController');

const router = express.Router();

// ============================================================================
// ENDPOINTS DE REPORTES DE FRAUDE (TAREA 3)
// ============================================================================

/**
 * GET /api/reports/fraud/shared-accounts
 * Retorna cuentas bancarias compartidas por múltiples estudiantes
 */
router.get('/fraud/shared-accounts', fraudController.getSharedAccounts.bind(fraudController));

/**
 * GET /api/reports/fraud/reused-documents
 * Retorna documentos reutilizados en múltiples solicitudes
 */
router.get('/fraud/reused-documents', fraudController.getReusedDocuments.bind(fraudController));

/**
 * GET /api/reports/fraud/network
 * Retorna redes de fraude (estudiantes compartiendo cuenta + dispositivo)
 */
router.get('/fraud/network', fraudController.getFraudNetwork.bind(fraudController));

/**
 * GET /api/reports/fraud/shared-devices
 * Retorna dispositivos compartidos por múltiples estudiantes
 */
router.get('/fraud/shared-devices', fraudController.getSharedDevices.bind(fraudController));

/**
 * GET /api/reports/fraud/shared-addresses
 * Retorna direcciones compartidas por múltiples estudiantes
 */
router.get('/fraud/shared-addresses', fraudController.getSharedAddresses.bind(fraudController));

/**
 * GET /api/reports/fraud/suspicious-references
 * Retorna avales sospechosos usados por múltiples estudiantes
 */
router.get('/fraud/suspicious-references', fraudController.getSuspiciousReferences.bind(fraudController));

/**
 * GET /api/reports/pending?reviewerId=:id
 * Filtra solicitudes pendientes para un revisor específico
 */
router.get('/pending', fraudController.getPendingRequests.bind(fraudController));

/**
 * GET /api/reports/accounts/stats
 * Retorna estadísticas de estudiantes por cuenta (agregación)
 */
router.get('/accounts/stats', fraudController.getAccountStatistics.bind(fraudController));

/**
 * GET /api/reports/scholarships/stats
 * Retorna estadísticas de montos por beca (agregación)
 */
router.get('/scholarships/stats', fraudController.getScholarshipStatistics.bind(fraudController));

// ============================================================================
// ENDPOINTS DE DETECCIÓN AUTOMÁTICA Y ALERTAS (TAREA 3 - REGLA AUTOMÁTICA)
// ============================================================================

/**
 * POST /api/fraud/check-all
 * Ejecuta la detección integral de fraudes y crea alertas automáticas en Neo4j
 * Esta es la REGLA AUTOMÁTICA que crea nodos Alerta:Automáticas
 */
router.post('/fraud/check-all', fraudController.checkAllFrauds.bind(fraudController));

/**
 * GET /api/alerts/pending
 * Retorna todas las alertas automáticas sin resolver
 */
router.get('/alerts/pending', fraudController.getPendingAlerts.bind(fraudController));

/**
 * GET /api/alerts/stats
 * Retorna estadísticas de alertas (total, resueltas, pendientes, por tipo, riesgo promedio)
 */
router.get('/alerts/stats', fraudController.getAlertStatistics.bind(fraudController));

/**
 * PUT /api/alerts/:alertId/resolve
 * Marca una alerta específica como resuelta
 */
router.put('/alerts/:alertId/resolve', fraudController.resolveAlert.bind(fraudController));

module.exports = router;
