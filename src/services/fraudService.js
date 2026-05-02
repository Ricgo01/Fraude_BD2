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
  SHARED_DEVICES_QUERY,
  SHARED_ADDRESS_QUERY,
  SUSPICIOUS_REFERENCE_QUERY,
  DUPLICATE_APPLICATIONS_QUERY,
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
    console.log('[FraudService] Iniciando detección integral de fraudes...');

    const results = {
      sharedAccounts: [],
      reusedDocuments: [],
      fraudNetwork: [],
      sharedDevices: [],
      sharedAddresses: [],
      suspiciousReferences: [],
      duplicateApplications: [],
      alertsCreated: 0,
      timestamp: new Date().toISOString(),
    };

    // ALTO RIESGO
    try {
      results.sharedAccounts = await this.detectSharedAccounts();
      for (const f of results.sharedAccounts) {
        await alertService.createAutomaticAlert(
          'cuenta_compartida',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { cuenta_id: f.cuenta_id, banco: f.banco, num_estudiantes: f.numero_estudiantes },
          f.cuenta_id
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error cuentas:', err.message); }

    try {
      results.reusedDocuments = await this.detectReusedDocuments();
      for (const f of results.reusedDocuments) {
        await alertService.createAutomaticAlert(
          'documento_reutilizado',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { hash: f.hash, num_estudiantes: f.numero_estudiantes },
          f.hash
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error documentos:', err.message); }

    try {
      results.fraudNetwork = await this.detectFraudNetwork();
      for (const f of results.fraudNetwork) {
        await alertService.createAutomaticAlert(
          'red_de_fraude',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { cuenta_id: f.cuenta_id, dispositivo_id: f.dispositivo_id, num_estudiantes: f.numero_estudiantes },
          `${f.cuenta_id}_${f.dispositivo_id}`
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error red:', err.message); }

    // MEDIO RIESGO
    try {
      results.sharedDevices = await this.detectSharedDevices();
      for (const f of results.sharedDevices) {
        await alertService.createAutomaticAlert(
          'dispositivo_repetido',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { dispositivo_id: f.dispositivo_id, num_estudiantes: f.numero_estudiantes },
          f.dispositivo_id
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error dispositivos:', err.message); }

    try {
      results.sharedAddresses = await this.detectSharedAddresses();
      for (const f of results.sharedAddresses) {
        await alertService.createAutomaticAlert(
          'direccion_compartida',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { direccion_id: f.direccion_id, num_estudiantes: f.numero_estudiantes },
          f.direccion_id
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error direcciones:', err.message); }

    try {
      const session = driver.session();
      const result = await session.run(DUPLICATE_APPLICATIONS_QUERY);
      results.duplicateApplications = result.records.map(r => r.get('resultado'));
      await session.close();

      for (const f of results.duplicateApplications) {
        await alertService.createAutomaticAlert(
          'solicitud_duplicada',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { estudiante_id: f.estudiante.id, beca_id: f.beca.id, total: f.total_solicitudes },
          `${f.estudiante.id}_${f.beca.id}`
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error duplicadas:', err.message); }

    // BAJO RIESGO
    try {
      results.suspiciousReferences = await this.detectSuspiciousReferences();
      for (const f of results.suspiciousReferences) {
        await alertService.createAutomaticAlert(
          'aval_sospechoso',
          f.solicitudes.map(s => s.id).filter(Boolean),
          { referencia_id: f.referencia_id, num_estudiantes: f.numero_estudiantes, veces_usada: f.veces_usada },
          f.referencia_id
        );
        results.alertsCreated++;
      }
    } catch (err) { console.error('[FraudService] Error referencias:', err.message); }

    console.log(`[FraudService] Detección completada: ${results.alertsCreated} alertas creadas`);
    return results;
  }
}

module.exports = new FraudService();
