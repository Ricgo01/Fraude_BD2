/**
 * FRAUDE_BD2 - Fraud Controller
 * Maneja las solicitudes HTTP y retorna reportes de fraude
 * Implementa la lógica de negocio para endpoints de la API
 */

const fraudService = require('../services/fraudService');
const alertService = require('../services/alertService');

class FraudController {
  /**
   * GET /api/reports/fraud/shared-accounts
   * Retorna todas las cuentas bancarias compartidas por múltiples estudiantes
   */
  async getSharedAccounts(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/shared-accounts');
      const sharedAccounts = await fraudService.detectSharedAccounts();

      res.status(200).json({
        success: true,
        message: `${sharedAccounts.length} cuenta(s) compartida(s) detectada(s)`,
        data: sharedAccounts,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getSharedAccounts:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando cuentas compartidas',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/fraud/reused-documents
   * Retorna todos los documentos reutilizados en múltiples solicitudes
   */
  async getReusedDocuments(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/reused-documents');
      const reusedDocs = await fraudService.detectReusedDocuments();

      res.status(200).json({
        success: true,
        message: `${reusedDocs.length} grupo(s) de documento(s) reutilizado(s) detectado(s)`,
        data: reusedDocs,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getReusedDocuments:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando documentos reutilizados',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/fraud/network
   * Retorna redes de fraude (estudiantes compartiendo cuenta y dispositivo)
   */
  async getFraudNetwork(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/network');
      const fraudNetworks = await fraudService.detectFraudNetwork();

      res.status(200).json({
        success: true,
        message: `${fraudNetworks.length} red(es) de fraude detectada(s)`,
        data: fraudNetworks,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getFraudNetwork:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando redes de fraude',
        error: error.message,
      });
    }
  }

  async getSharedDevices(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/shared-devices');
      const devices = await fraudService.detectSharedDevices();

      res.status(200).json({
        success: true,
        message: `${devices.length} dispositivo(s) compartido(s) detectado(s)`,
        data: devices,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getSharedDevices:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando dispositivos compartidos',
        error: error.message,
      });
    }
  }

  async getSharedAddresses(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/shared-addresses');
      const addresses = await fraudService.detectSharedAddresses();

      res.status(200).json({
        success: true,
        message: `${addresses.length} direccion(es) compartida(s) detectada(s)`,
        data: addresses,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getSharedAddresses:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando direcciones compartidas',
        error: error.message,
      });
    }
  }

  async getSuspiciousReferences(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/fraud/suspicious-references');
      const references = await fraudService.detectSuspiciousReferences();

      res.status(200).json({
        success: true,
        message: `${references.length} aval(es) sospechoso(s) detectado(s)`,
        data: references,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getSuspiciousReferences:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error detectando avales sospechosos',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/pending?reviewerId=:id
   * Filtra solicitudes pendientes asignadas a un revisor específico
   */
  async getPendingRequests(req, res) {
    try {
      const { reviewerId } = req.query;

      if (!reviewerId) {
        return res.status(400).json({
          success: false,
          message: 'Parámetro reviewerId es requerido',
        });
      }

      console.log(`[FraudController] GET /api/reports/pending?reviewerId=${reviewerId}`);
      const pendingRequests = await fraudService.filterPendingRequests(reviewerId);

      res.status(200).json({
        success: true,
        message: `${pendingRequests.length} solicitud(es) pendiente(s) para revisor ${reviewerId}`,
        data: pendingRequests,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getPendingRequests:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error filtrando solicitudes pendientes',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/reports/accounts/stats
   * Retorna estadísticas de estudiantes por cuenta (agregación)
   */
  async getAccountStatistics(req, res) {
  try {
    console.log('[FraudController] GET /api/reports/accounts/stats');
    const stats = await fraudService.countStudentsByAccount();

    const totalCuentas = stats.length;

    const statsNormalizadas = stats.map(s => ({
      ...s,
      numero_estudiantes: Number(s.numero_estudiantes),
    }));

    const cuentasCompartidas = statsNormalizadas.filter(s => s.es_compartida).length;

    const promedioEstudiantesPorCuenta = statsNormalizadas.length > 0
      ? (
          statsNormalizadas.reduce((sum, s) => {
            return sum + Number(s.numero_estudiantes);
          }, 0) / statsNormalizadas.length
        ).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      message: `Análisis de ${totalCuentas} cuenta(s)`,
      resumen: {
        total_cuentas: totalCuentas,
        cuentas_compartidas: cuentasCompartidas,
        promedio_estudiantes_por_cuenta: parseFloat(promedioEstudiantesPorCuenta),
      },
      data: statsNormalizadas,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[FraudController] Error en getAccountStatistics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas de cuentas',
      error: error.message,
    });
  }
}

  /**
   * GET /api/reports/scholarships/stats
   * Retorna estadísticas de montos por beca (agregación)
   */
  async getScholarshipStatistics(req, res) {
    try {
      console.log('[FraudController] GET /api/reports/scholarships/stats');
      const stats = await fraudService.avgAmountByScholarship();

      res.status(200).json({
        success: true,
        message: `Análisis de ${stats.length} beca(s)`,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getScholarshipStatistics:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de becas',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/fraud/check-all (REGLA AUTOMÁTICA)
   * Ejecuta detección integral de fraudes y crea alertas automáticas en Neo4j
   * Este es el endpoint que ejecuta la regla automática
   */
  async checkAllFrauds(req, res) {
    try {
      console.log('[FraudController] POST /api/fraud/check-all - Iniciando detección integral');
      
      // Ejecutar detección y crear alertas automáticas
      const resultados = await fraudService.detectFraudsAndCreateAlerts(alertService);

      res.status(200).json({
        success: true,
        message: 'Detección integral de fraudes completada',
        resumen: {
          cuentas_compartidas_detectadas: resultados.sharedAccounts.length,
          documentos_reutilizados_detectados: resultados.reusedDocuments.length,
          redes_fraude_detectadas: resultados.fraudNetwork.length,
          alertas_automáticas_creadas: resultados.alertsCreated,
        },
        timestamp: resultados.timestamp,
        data: resultados,
      });
    } catch (error) {
      console.error('[FraudController] Error en checkAllFrauds:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error ejecutando detección integral',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/alerts/pending
   * Retorna todas las alertas automáticas sin resolver
   */
  async getPendingAlerts(req, res) {
    try {
      console.log('[FraudController] GET /api/alerts/pending');
      const alertas = await alertService.obtenerAlertasPendientes();

      res.status(200).json({
        success: true,
        message: `${alertas.length} alerta(s) pendiente(s)`,
        data: alertas,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getPendingAlerts:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alertas pendientes',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/alerts/stats
   * Retorna estadísticas de alertas
   */
  async getAlertStatistics(req, res) {
    try {
      console.log('[FraudController] GET /api/alerts/stats');
      const stats = await alertService.obtenerEstadisticasAlertas();

      res.status(200).json({
        success: true,
        message: 'Estadísticas de alertas',
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en getAlertStatistics:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas de alertas',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/alerts/:alertId/resolve
   * Marca una alerta como resuelta
   */
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { descripcion_resolucion } = req.body;

      if (!alertId) {
        return res.status(400).json({
          success: false,
          message: 'Parámetro alertId es requerido',
        });
      }

      console.log(`[FraudController] PUT /api/alerts/${alertId}/resolve`);
      await alertService.marcarAlertaResuelta(alertId, descripcion_resolucion || 'Revisada');

      res.status(200).json({
        success: true,
        message: `Alerta ${alertId} marcada como resuelta`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[FraudController] Error en resolveAlert:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error resolviendo alerta',
        error: error.message,
      });
    }
  }
}

module.exports = new FraudController();
