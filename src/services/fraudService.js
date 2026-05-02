/**
 * FRAUDE_BD2 - Fraud Detection Service
 * Ejecuta las consultas Cypher contra Neo4j
 * Maneja sesiones, transacciones y error handling
 */

const driver = require('./neo4j.service');
const {
  SHARED_ACCOUNTS_QUERY,
  REUSED_DOCUMENTS_QUERY,
  FRAUD_NETWORK_QUERY,
  PENDING_REQUESTS_BY_REVIEWER_QUERY,
  COUNT_STUDENTS_BY_ACCOUNT_QUERY,
  AVG_AMOUNT_BY_SCHOLARSHIP_QUERY,
} = require('../queries/fraud.queries');

class FraudService {
  /**
   * Detecta cuentas bancarias compartidas por múltiples estudiantes
   * @returns {Promise<Array>} Array de objetos con cuentas compartidas
   */
  async detectSharedAccounts() {
    const session = driver.session();
    try {
      console.log('[FraudService] Ejecutando detectSharedAccounts...');
      const result = await session.run(SHARED_ACCOUNTS_QUERY);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Detectadas ${data.length} cuentas compartidas`);
      return data;
    } catch (error) {
      console.error('[FraudService] Error en detectSharedAccounts:', error.message);
      throw new Error(`Error detectando cuentas compartidas: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Detecta documentos reutilizados (mismo Hash en múltiples solicitudes de estudiantes distintos)
   * @returns {Promise<Array>} Array de objetos con documentos reutilizados
   */
  async detectReusedDocuments() {
    const session = driver.session();
    try {
      console.log('[FraudService] Ejecutando detectReusedDocuments...');
      const result = await session.run(REUSED_DOCUMENTS_QUERY);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Detectados ${data.length} grupos de documentos reutilizados`);
      return data;
    } catch (error) {
      console.error('[FraudService] Error en detectReusedDocuments:', error.message);
      throw new Error(`Error detectando documentos reutilizados: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Detecta redes de fraude: estudiantes que comparten Cuenta Y Dispositivo
   * @returns {Promise<Array>} Array de objetos con redes de fraude
   */
  async detectFraudNetwork() {
    const session = driver.session();
    try {
      console.log('[FraudService] Ejecutando detectFraudNetwork...');
      const result = await session.run(FRAUD_NETWORK_QUERY);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Detectadas ${data.length} redes de fraude`);
      return data;
    } catch (error) {
      console.error('[FraudService] Error en detectFraudNetwork:', error.message);
      throw new Error(`Error detectando red de fraude: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Filtra solicitudes pendientes asignadas a un revisor específico
   * @param {string} reviewerId - ID del revisor
   * @returns {Promise<Array>} Array de solicitudes pendientes
   */
  async filterPendingRequests(reviewerId) {
    const session = driver.session();
    try {
      console.log(`[FraudService] Ejecutando filterPendingRequests para revisor ${reviewerId}...`);
      
      // Query modificada sin parámetro de fecha (asumimos que REVISADA_POR existe)
      const query = `
        MATCH (s:Solicitud)-[:REVISADA_POR]->(r:Revisor)
        WHERE r.ID = $reviewerId AND s.Estado = 'Pendiente'
        MATCH (e:Estudiante)-[:ENVIA]->(s)
        RETURN {
          solicitud_id: s.ID,
          estudiante_id: e.ID,
          estudiante_nombre: e.Nombre_Completo,
          monto_solicitado: s.Monto_Solicitado,
          fecha_envio: s.Fecha_Envio,
          estado: s.Estado,
          revisor_nombre: r.Nombre,
          revisor_id: r.ID
        } AS resultado
        ORDER BY s.Fecha_Envio ASC
      `;
      
      const result = await session.run(query, { reviewerId });
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Encontradas ${data.length} solicitudes pendientes para revisor ${reviewerId}`);
      return data;
    } catch (error) {
      console.error(`[FraudService] Error en filterPendingRequests: ${error.message}`);
      throw new Error(`Error filtrando solicitudes pendientes: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Cuenta cuántos estudiantes distintos usan cada cuenta bancaria
   * @returns {Promise<Array>} Array con estadísticas de cuentas
   */
  async countStudentsByAccount() {
    const session = driver.session();
    try {
      console.log('[FraudService] Ejecutando countStudentsByAccount...');
      const result = await session.run(COUNT_STUDENTS_BY_ACCOUNT_QUERY);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Analizadas ${data.length} cuentas`);
      return data;
    } catch (error) {
      console.error('[FraudService] Error en countStudentsByAccount:', error.message);
      throw new Error(`Error contando estudiantes por cuenta: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Calcula el promedio de monto solicitado por cada beca
   * @returns {Promise<Array>} Array con estadísticas de becas
   */
  async avgAmountByScholarship() {
    const session = driver.session();
    try {
      console.log('[FraudService] Ejecutando avgAmountByScholarship...');
      const result = await session.run(AVG_AMOUNT_BY_SCHOLARSHIP_QUERY);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[FraudService] Calculados promedios para ${data.length} becas`);
      return data;
    } catch (error) {
      console.error('[FraudService] Error en avgAmountByScholarship:', error.message);
      throw new Error(`Error calculando promedios por beca: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Ejecuta todas las detecciones de fraude y crea alertas automáticas
   * Coordina con alertService para crear nodos Alerta en Neo4j
   * @param {Object} alertService - Instancia de AlertService
   * @returns {Promise<Object>} Resumen de fraudes detectados y alertas creadas
   */
  async detectFraudsAndCreateAlerts(alertService) {
    try {
      console.log('[FraudService] Iniciando detección integral de fraudes...');
      
      const results = {
        sharedAccounts: [],
        reusedDocuments: [],
        fraudNetwork: [],
        alertsCreated: 0,
        timestamp: new Date().toISOString(),
      };

      // 1. Detectar cuentas compartidas
      try {
        console.log('[FraudService] Paso 1: Detectando cuentas compartidas...');
        results.sharedAccounts = await this.detectSharedAccounts();
        
        // Crear alertas para cada cuenta compartida
        for (const fraudCase of results.sharedAccounts) {
          await alertService.createAutomaticAlert(
            'SHARED_ACCOUNT',
            fraudCase.solicitudes.map(s => s.id),
            70, // Puntaje de riesgo para cuentas compartidas
            {
              cuenta_id: fraudCase.cuenta_id,
              banco: fraudCase.banco,
              num_estudiantes: fraudCase.numero_estudiantes,
            },
            fraudCase.cuenta_id // dedupKey
          );
          results.alertsCreated++;
        }
      } catch (err) {
        console.error('[FraudService] Error en detección de cuentas compartidas:', err.message);
      }

      // 2. Detectar documentos reutilizados
      try {
        console.log('[FraudService] Paso 2: Detectando documentos reutilizados...');
        results.reusedDocuments = await this.detectReusedDocuments();
        
        // Crear alertas para cada documento reutilizado
        for (const fraudCase of results.reusedDocuments) {
          await alertService.createAutomaticAlert(
            'REUSED_DOCUMENT',
            fraudCase.solicitudes.map(s => s.id),
            80, // Puntaje de riesgo para documentos reutilizados
            {
              hash: fraudCase.hash,
              num_estudiantes: fraudCase.numero_estudiantes,
              tipo_documento: fraudCase.documentos[0]?.tipo,
            },
            fraudCase.hash // dedupKey
          );
          results.alertsCreated++;
        }
      } catch (err) {
        console.error('[FraudService] Error en detección de documentos reutilizados:', err.message);
      }

      // 3. Detectar redes de fraude
      try {
        console.log('[FraudService] Paso 3: Detectando redes de fraude...');
        results.fraudNetwork = await this.detectFraudNetwork();
        
        // Crear alertas para cada red de fraude
        for (const fraudCase of results.fraudNetwork) {
          await alertService.createAutomaticAlert(
            'FRAUD_NETWORK',
            fraudCase.solicitudes.map(s => s.id),
            90, // Puntaje de riesgo para redes de fraude (máximo)
            {
              cuenta_id: fraudCase.cuenta_id,
              dispositivo_id: fraudCase.dispositivo_id,
              num_estudiantes: fraudCase.numero_estudiantes,
            },
            `${fraudCase.cuenta_id}_${fraudCase.dispositivo_id}` // dedupKey
          );
          results.alertsCreated++;
        }
      } catch (err) {
        console.error('[FraudService] Error en detección de red de fraude:', err.message);
      }

      console.log(`[FraudService] Detección completada: ${results.alertsCreated} alertas creadas`);
      return results;
    } catch (error) {
      console.error('[FraudService] Error crítico en detectFraudsAndCreateAlerts:', error.message);
      throw error;
    }
  }

  /**
   * Cierra la conexión del driver Neo4j (se llama al shut down de la app)
   */
  async close() {
    try {
      await driver.close();
      console.log('[FraudService] Driver Neo4j cerrado correctamente');
    } catch (error) {
      console.error('[FraudService] Error cerrando driver:', error.message);
    }
  }
}

module.exports = new FraudService();
