/**
 * FRAUDE_BD2 - Alert Service
 * Crea nodos Alerta:Automáticas en Neo4j y los conecta a Solicitudes
 * Implementa reglas automáticas de alerta cuando se detecta fraude
 */

const driver = require('./neo4j.service');
const { v4: uuidv4 } = require('crypto').randomUUID || (() => require('uuid').v4());

class AlertService {
  /**
   * Calcula el nivel de riesgo basado en el puntaje
   * @param {number} puntaje - Puntaje de riesgo (0-100)
   * @returns {string} Nivel: 'BAJO', 'MEDIO', 'ALTO', 'CRITICO'
   */
  calcularNivelRiesgo(puntaje) {
    if (puntaje >= 80) return 'CRITICO';
    if (puntaje >= 60) return 'ALTO';
    if (puntaje >= 40) return 'MEDIO';
    return 'BAJO';
  }

  /**
   * Genera un UUID simple (compatible si uuid no está instalado)
   * @returns {string} UUID v4
   */
  generarID() {
    return `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crea un nodo Alerta:Automáticas en Neo4j y lo conecta a Solicitudes
   * @param {string} tipoAlerta - Tipo: 'SHARED_ACCOUNT', 'REUSED_DOCUMENT', 'FRAUD_NETWORK'
   * @param {Array<string>} solicitudIDs - Array de IDs de Solicitudes involucradas
   * @param {number} puntajeRiesgo - Puntaje de riesgo (0-100)
   * @param {Object} metadatos - Información adicional del fraude
   * @returns {Promise<Object>} Objeto con información de la alerta creada
   */
  async createAutomaticAlert(tipoAlerta, solicitudIDs, puntajeRiesgo, metadatos = {}, dedupKey = '') {
    const session = driver.session();
    try {
      console.log(`[AlertService] Creando alerta tipo '${tipoAlerta}' para ${solicitudIDs.length} solicitud(es)...`);

      if (!dedupKey) {
        throw new Error('dedupKey es requerido para evitar alertas duplicadas');
      }

      const alertID = this.generarID();
      const nivelRiesgo = this.calcularNivelRiesgo(puntajeRiesgo);
      const fechaCreacion = new Date().toISOString();

      // Query que crea la alerta Y la conecta a las solicitudes en una transacción
      const crearAlertaQuery = `
        MERGE (a:Alerta:Automáticas {
          Tipo_Alerta: $tipoAlerta,
          Regla_Disparada: $tipoAlerta,
          Dedup_Key: $dedupKey,
          Resuelta: false
        })
        ON CREATE SET
          a.ID = $alertID,
          a.Nivel_Riesgo = $nivelRiesgo,
          a.Puntaje_Riesgo = $puntajeRiesgo,
          a.Fecha_Creacion = $fechaCreacion,
          a.Metadatos = $metadatos
        WITH a, (a.Fecha_Creacion = $fechaCreacion) AS creada
        UNWIND $solicitudIDs AS solicitud_id
        MATCH (s:Solicitud {ID: solicitud_id})
        MERGE (a)-[r:GENERA_ALERTA]->(s)
        ON CREATE SET
          r.Fecha_Deteccion = $fechaCreacion,
          r.Regla_Disparada = $tipoAlerta,
          r.Estado_Alerta = 'GENERADA'
        RETURN a.ID AS alerta_id, COUNT(s) AS solicitudes_conectadas, creada
      `;

      const result = await session.run(crearAlertaQuery, {
        alertID,
        tipoAlerta,
        nivelRiesgo,
        puntajeRiesgo: parseInt(puntajeRiesgo),
        fechaCreacion,
        metadatos: JSON.stringify(metadatos),
        solicitudIDs,
        dedupKey,
      });

      if (result.records.length === 0) {
        throw new Error('No se creó la alerta o no se encontraron las solicitudes');
      }

      const record = result.records[0];
      const alertaID = record.get('alerta_id');
      const solicitudesConectadas = record.get('solicitudes_conectadas');
      const creada = record.get('creada');

      console.log(
        `[AlertService] ✓ Alerta creada (${alertaID}) con nivel ${nivelRiesgo}. ` +
        `Conectada a ${solicitudesConectadas} solicitud(es).`
      );

      return {
        alerta_id: alertaID,
        tipo_alerta: tipoAlerta,
        nivel_riesgo: nivelRiesgo,
        puntaje_riesgo: puntajeRiesgo,
        solicitudes_conectadas: solicitudesConectadas,
        fecha_creacion: fechaCreacion,
        metadatos,
        creada: Boolean(creada),
      };
    } catch (error) {
      console.error(`[AlertService] Error creando alerta: ${error.message}`);
      throw new Error(`Error creando alerta automática: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene todas las alertas automáticas sin resolver
   * @returns {Promise<Array>} Array de alertas sin resolver
   */
  async obtenerAlertasPendientes() {
    const session = driver.session();
    try {
      console.log('[AlertService] Obteniendo alertas pendientes...');

      const query = `
        MATCH (a:Alerta:Automáticas {Resuelta: false})-[:GENERA_ALERTA]->(s:Solicitud)
        RETURN {
          alerta_id: a.ID,
          tipo_alerta: a.Tipo_Alerta,
          nivel_riesgo: a.Nivel_Riesgo,
          puntaje_riesgo: a.Puntaje_Riesgo,
          fecha_creacion: a.Fecha_Creacion,
          solicitud_id: s.ID,
          solicitud_estado: s.Estado
        } AS resultado
        ORDER BY a.Fecha_Creacion DESC
      `;

      const result = await session.run(query);
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[AlertService] Encontradas ${data.length} alertas pendientes`);
      return data;
    } catch (error) {
      console.error('[AlertService] Error obteniendo alertas pendientes:', error.message);
      throw new Error(`Error obteniendo alertas: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Marca una alerta como resuelta
   * @param {string} alertID - ID de la alerta
   * @param {string} resolucion - Descripción de la resolución
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  async marcarAlertaResuelta(alertID, resolucion = 'Revisada por administrador') {
    const session = driver.session();
    try {
      console.log(`[AlertService] Marcando alerta ${alertID} como resuelta...`);

      const query = `
        MATCH (a:Alerta:Automáticas {ID: $alertID})
        SET a.Resuelta = true,
            a.Fecha_Resolucion = datetime(),
            a.Descripcion_Resolucion = $resolucion
        RETURN a.ID AS alerta_id
      `;

      const result = await session.run(query, {
        alertID,
        resolucion,
      });

      if (result.records.length === 0) {
        throw new Error(`Alerta ${alertID} no encontrada`);
      }

      console.log(`[AlertService] ✓ Alerta marcada como resuelta`);
      return true;
    } catch (error) {
      console.error(`[AlertService] Error marcando alerta resuelta: ${error.message}`);
      throw new Error(`Error resolviendo alerta: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene alertas de un tipo específico
   * @param {string} tipoAlerta - Tipo de alerta ('SHARED_ACCOUNT', 'REUSED_DOCUMENT', 'FRAUD_NETWORK')
   * @param {boolean} soloNoResueltas - Si true, retorna solo alertas sin resolver
   * @returns {Promise<Array>} Array de alertas del tipo especificado
   */
  async obtenerAlertasPorTipo(tipoAlerta, soloNoResueltas = true) {
    const session = driver.session();
    try {
      console.log(`[AlertService] Obteniendo alertas tipo '${tipoAlerta}'...`);

      let query = `
        MATCH (a:Alerta:Automáticas {Tipo_Alerta: $tipoAlerta})
      `;

      if (soloNoResueltas) {
        query += ` WHERE a.Resuelta = false`;
      }

      query += `
        RETURN {
          alerta_id: a.ID,
          tipo_alerta: a.Tipo_Alerta,
          nivel_riesgo: a.Nivel_Riesgo,
          puntaje_riesgo: a.Puntaje_Riesgo,
          fecha_creacion: a.Fecha_Creacion,
          resuelta: a.Resuelta
        } AS resultado
        ORDER BY a.Puntaje_Riesgo DESC
      `;

      const result = await session.run(query, { tipoAlerta });
      const data = result.records.map(record => record.get('resultado'));
      console.log(`[AlertService] Encontradas ${data.length} alertas tipo '${tipoAlerta}'`);
      return data;
    } catch (error) {
      console.error('[AlertService] Error obteniendo alertas por tipo:', error.message);
      throw new Error(`Error obteniendo alertas por tipo: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene estadísticas de alertas
   * @returns {Promise<Object>} Objeto con estadísticas de alertas
   */
  async obtenerEstadisticasAlertas() {
    const session = driver.session();
    try {
      console.log('[AlertService] Obteniendo estadísticas de alertas...');

      const query = `
        MATCH (a:Alerta:Automáticas)
        RETURN {
          total_alertas: COUNT(a),
          alertas_resueltas: COUNT(CASE WHEN a.Resuelta = true THEN 1 END),
          alertas_pendientes: COUNT(CASE WHEN a.Resuelta = false THEN 1 END),
          por_tipo: {
            shared_account: COUNT(CASE WHEN a.Tipo_Alerta = 'SHARED_ACCOUNT' THEN 1 END),
            reused_document: COUNT(CASE WHEN a.Tipo_Alerta = 'REUSED_DOCUMENT' THEN 1 END),
            fraud_network: COUNT(CASE WHEN a.Tipo_Alerta = 'FRAUD_NETWORK' THEN 1 END)
          },
          riesgo_promedio: ROUND(AVG(a.Puntaje_Riesgo), 2)
        } AS stats
      `;

      const result = await session.run(query);
      const stats = result.records[0].get('stats');
      console.log('[AlertService] ✓ Estadísticas obtenidas');
      return stats;
    } catch (error) {
      console.error('[AlertService] Error obteniendo estadísticas:', error.message);
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    } finally {
      await session.close();
    }
  }
}

module.exports = new AlertService();
