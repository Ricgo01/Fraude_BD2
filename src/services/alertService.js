/**
 * FRAUDE_BD2 - Alert Service
 * Crea nodos Alerta:Automatica y :Manual en Neo4j y los conecta a Solicitudes
 */

const driver = require('./neo4j.service');

const TIPOS_ALERTA_AUTOMATICA = {
  // ALTO RIESGO
  'red_de_fraude': { nivel: 'alto', puntaje: 9.0 },
  'cuenta_compartida': { nivel: 'alto', puntaje: 8.5 },
  'documento_reutilizado': { nivel: 'alto', puntaje: 8.0 },
  // MEDIO RIESGO
  'dispositivo_repetido': { nivel: 'medio', puntaje: 5.5 },
  'direccion_compartida': { nivel: 'medio', puntaje: 5.0 },
  'solicitud_duplicada': { nivel: 'medio', puntaje: 4.5 },
  // BAJO RIESGO
  'aval_sospechoso': { nivel: 'bajo', puntaje: 3.5 }
};

class AlertService {
  generarID() {
    return `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crea un nodo Alerta:Automatica en Neo4j y lo conecta a las solicitudes involucradas.
   * El nivel de riesgo y puntaje se asignan automáticamente según el tipo de alerta.
   *
   * @param {string} tipoAlerta - Tipo de alerta del catálogo TIPOS_ALERTA_AUTOMATICA
   * @param {Array<string>} solicitudIDs - IDs de las solicitudes involucradas
   * @param {Object} metadatos - Información adicional del caso (cuenta_id, hash, etc.)
   * @param {string} dedupKey - Clave única para evitar duplicar alertas del mismo caso
   * @returns {Promise<Object>} Información de la alerta creada
   */
  async createAutomaticAlert(tipoAlerta, solicitudIDs, metadatos = {}, dedupKey = null) {
    const session = driver.session();
    try {
      const config = TIPOS_ALERTA_AUTOMATICA[tipoAlerta];
      if (!config) {
        throw new Error(`Tipo de alerta desconocido: ${tipoAlerta}`);
      }

      const alertID = this.generarID();

      const query = `
        MERGE (a:Riesgo:Alerta:Automatica { Tipo_Alerta: $tipoAlerta, DedupKey: $dedupKey })
        ON CREATE SET
          a.ID = $alertID,
          a.Nivel_Riesgo = $nivelRiesgo,
          a.Puntaje_Riesgo = $puntajeRiesgo,
          a.Resuelta = false,
          a.Fecha_Creacion = date(),
          a.Metadatos = $metadatos
        WITH a
        UNWIND $solicitudIDs AS sid
        MATCH (s:Solicitud {ID: sid})
        MERGE (s)-[r:GENERA_ALERTA]->(a)
        ON CREATE SET
          r.Fecha_Deteccion = date(),
          r.Regla_Disparada = $tipoAlerta,
          r.Estado_Alerta = 'activa'
        RETURN a.ID AS alerta_id, COUNT(s) AS solicitudes_conectadas
      `;

      const result = await session.run(query, {
        alertID,
        tipoAlerta,
        nivelRiesgo: config.nivel,
        puntajeRiesgo: config.puntaje,
        metadatos: JSON.stringify(metadatos),
        solicitudIDs,
        dedupKey: dedupKey || tipoAlerta
      });

      return {
        alerta_id: result.records[0]?.get('alerta_id'),
        tipo_alerta: tipoAlerta,
        nivel_riesgo: config.nivel,
        puntaje_riesgo: config.puntaje
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene todas las alertas automáticas sin resolver
   */
  async obtenerAlertasPendientes() {
    const session = driver.session();
    try {
      const query = `
        MATCH (a:Alerta {Resuelta: false})-[:GENERA_ALERTA]-(s:Solicitud)
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
      return result.records.map(record => record.get('resultado'));
    } finally {
      await session.close();
    }
  }

  /**
   * Marca una alerta como resuelta
   */
  async marcarAlertaResuelta(alertID, resolucion = 'Revisada por administrador') {
    const session = driver.session();
    try {
      const query = `
        MATCH (a:Alerta {ID: $alertID})
        SET a.Resuelta = true,
            a.Fecha_Resolucion = date(),
            a.Descripcion_Resolucion = $resolucion
        RETURN a.ID AS alerta_id
      `;
      const result = await session.run(query, { alertID, resolucion });
      if (result.records.length === 0) {
        throw new Error(`Alerta ${alertID} no encontrada`);
      }
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene alertas de un tipo específico
   */
  async obtenerAlertasPorTipo(tipoAlerta, soloNoResueltas = true) {
    const session = driver.session();
    try {
      let query = `MATCH (a:Alerta {Tipo_Alerta: $tipoAlerta})`;
      if (soloNoResueltas) query += ` WHERE a.Resuelta = false`;
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
      return result.records.map(record => record.get('resultado'));
    } finally {
      await session.close();
    }
  }

  /**
   * Obtiene estadísticas de alertas
   */
  async obtenerEstadisticasAlertas() {
    const session = driver.session();
    try {
      const query = `
        MATCH (a:Alerta)
        RETURN {
          total_alertas: COUNT(a),
          alertas_resueltas: COUNT(CASE WHEN a.Resuelta = true THEN 1 END),
          alertas_pendientes: COUNT(CASE WHEN a.Resuelta = false THEN 1 END),
          por_tipo: {
            cuenta_compartida:     COUNT(CASE WHEN a.Tipo_Alerta = 'cuenta_compartida'     THEN 1 END),
            documento_reutilizado: COUNT(CASE WHEN a.Tipo_Alerta = 'documento_reutilizado' THEN 1 END),
            red_de_fraude:         COUNT(CASE WHEN a.Tipo_Alerta = 'red_de_fraude'         THEN 1 END),
            dispositivo_repetido:  COUNT(CASE WHEN a.Tipo_Alerta = 'dispositivo_repetido'  THEN 1 END),
            direccion_compartida:  COUNT(CASE WHEN a.Tipo_Alerta = 'direccion_compartida'  THEN 1 END),
            solicitud_duplicada:   COUNT(CASE WHEN a.Tipo_Alerta = 'solicitud_duplicada'   THEN 1 END),
            aval_sospechoso:       COUNT(CASE WHEN a.Tipo_Alerta = 'aval_sospechoso'       THEN 1 END)
          },
          por_nivel: {
            alto:  COUNT(CASE WHEN a.Nivel_Riesgo = 'alto'  THEN 1 END),
            medio: COUNT(CASE WHEN a.Nivel_Riesgo = 'medio' THEN 1 END),
            bajo:  COUNT(CASE WHEN a.Nivel_Riesgo = 'bajo'  THEN 1 END)
          },
          riesgo_promedio: round(AVG(a.Puntaje_Riesgo) * 100) / 100.0
        } AS stats
      `;
      const result = await session.run(query);
      return result.records[0].get('stats');
    } finally {
      await session.close();
    }
  }
}

module.exports = new AlertService();