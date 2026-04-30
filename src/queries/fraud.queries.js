/**
 * FRAUDE_BD2 - Consultas Cypher para Detección de Fraude
 * Esquema: Estudiante, Solicitud, Documento, Cuenta, Dispositivo, Beca, Alerta, Revisor
 * Autor: FEL
 * Fecha: 2026-04-28
 */

// ============================================================================
// TAREA 1: CONSULTAS DE FRAUDE (3 patrones principales)
// ============================================================================

/**
 * QUERY 1: CUENTAS BANCARIAS COMPARTIDAS
 * Detecta múltiples estudiantes DISTINTOS conectados a la misma Cuenta vía USA_CUENTA
 * Retorna: { cuenta_id, banco, num_estudiantes, estudiantes: [...], solicitudes: [...] }
 */
const SHARED_ACCOUNTS_QUERY = `
  MATCH (e1:Estudiante)-[:USA_CUENTA]->(cuenta:Cuenta)
  WHERE COUNT { (e1)-[:USA_CUENTA]->(cuenta) } > 0
  WITH cuenta, COUNT(DISTINCT e1) AS num_estudiantes, COLLECT(DISTINCT e1.ID) AS estudiante_ids
  WHERE num_estudiantes > 1
  MATCH (estudiantes:Estudiante)-[:USA_CUENTA]->(cuenta)
  WHERE estudiantes.ID IN estudiante_ids
  WITH cuenta, num_estudiantes, estudiante_ids, 
       COLLECT(DISTINCT {
         id: estudiantes.ID,
         nombre: estudiantes.Nombre_Completo,
         promedio: estudiantes.Promedio,
         fecha_registro: estudiantes.Fecha_Registro
       }) AS detalles_estudiantes
  MATCH (solicitudes:Solicitud)<-[:ENVIA]-(e:Estudiante)
  WHERE e.ID IN estudiante_ids
  WITH cuenta, num_estudiantes, detalles_estudiantes,
       COLLECT(DISTINCT {
         id: solicitudes.ID,
         fecha_envio: solicitudes.Fecha_Envio,
         estado: solicitudes.Estado,
         monto: solicitudes.Monto_Solicitado,
         estudiante_id: e.ID
       }) AS detalles_solicitudes
  RETURN {
    cuenta_id: cuenta.ID,
    banco: cuenta.Banco,
    tipo_cuenta: cuenta.Tipo_Cuenta,
    terminacion: cuenta.Terminacion,
    numero_estudiantes: num_estudiantes,
    estudiantes: detalles_estudiantes,
    solicitudes: detalles_solicitudes,
    riesgo: 'ALTO'
  } AS resultado
  ORDER BY num_estudiantes DESC
`;

/**
 * QUERY 2: DOCUMENTOS REUTILIZADOS
 * Detecta múltiples Documentos con el mismo Hash adjuntos a solicitudes de ESTUDIANTES DISTINTOS
 * Retorna: { hash, tipo, num_documentos, num_estudiantes, documentos: [...], estudiantes: [...] }
 */
const REUSED_DOCUMENTS_QUERY = `
  MATCH (est1:Estudiante)-[:ENVIA]->(sol1:Solicitud)-[:ADJUNTA]->(doc1:Documento)
  WITH doc1.Hash AS hash, COUNT(DISTINCT est1.ID) AS num_estudiantes
  WHERE num_estudiantes > 1
  MATCH (est:Estudiante)-[:ENVIA]->(sol:Solicitud)-[:ADJUNTA]->(doc:Documento)
  WHERE doc.Hash = hash
  WITH hash, num_estudiantes, 
       COLLECT(DISTINCT {
         id: doc.ID,
         tipo: doc.Tipo,
         hash: doc.Hash,
         fecha_carga: doc.Fecha_Carga,
         tamaño_kb: doc.Tamaño_KB,
         es_valido: doc.Es_Valido
       }) AS detalles_documentos,
       COLLECT(DISTINCT {
         id: est.ID,
         nombre: est.Nombre_Completo,
         fecha_registro: est.Fecha_Registro
       }) AS detalles_estudiantes,
       COLLECT(DISTINCT {
         id: sol.ID,
         fecha_envio: sol.Fecha_Envio,
         estado: sol.Estado,
         estudiante_id: est.ID
       }) AS detalles_solicitudes
  RETURN {
    hash: hash,
    numero_documentos: COUNT(DISTINCT hash),
    numero_estudiantes: num_estudiantes,
    documentos: detalles_documentos,
    estudiantes: detalles_estudiantes,
    solicitudes: detalles_solicitudes,
    riesgo: 'CRITICO'
  } AS resultado
  ORDER BY num_estudiantes DESC
`;

/**
 * QUERY 3: RED DE FRAUDE (Dispositivo + Cuenta)
 * Detecta 2+ estudiantes que comparten TANTO Cuenta COMO Dispositivo
 * Retorna: { estudiante_ids, cuenta_id, dispositivo_id, num_nodos, riesgo }
 */
const FRAUD_NETWORK_QUERY = `
  MATCH (e1:Estudiante)-[:USA_CUENTA]->(c:Cuenta),
        (e1)-[:USA_DISPOSITIVO]->(d:Dispositivo),
        (e2:Estudiante)-[:USA_CUENTA]->(c),
        (e2)-[:USA_DISPOSITIVO]->(d)
  WHERE e1.ID < e2.ID
  WITH c, d, COLLECT(DISTINCT e1.ID) + COLLECT(DISTINCT e2.ID) AS estudiantes_conectados
  WHERE SIZE(APOC.coll.toSet(estudiantes_conectados)) > 1
  MATCH (e:Estudiante)
  WHERE e.ID IN estudiantes_conectados
  WITH c, d, estudiantes_conectados,
       COLLECT(DISTINCT {
         id: e.ID,
         nombre: e.Nombre_Completo,
         promedio: e.Promedio,
         activo: e.Activo
       }) AS detalles_estudiantes
  MATCH (s:Solicitud)<-[:ENVIA]-(e:Estudiante)
  WHERE e.ID IN estudiantes_conectados
  WITH c, d, detalles_estudiantes,
       COLLECT(DISTINCT {
         id: s.ID,
         fecha_envio: s.Fecha_Envio,
         estado: s.Estado,
         monto: s.Monto_Solicitado,
         estudiante_id: e.ID
       }) AS detalles_solicitudes
  RETURN {
    cuenta_id: c.ID,
    banco: c.Banco,
    dispositivo_id: d.ID,
    navegador: d.Navegador,
    sistema_operativo: d.Sistema_Operativo,
    ip_hash: d.IP_Hash,
    numero_estudiantes: SIZE(detalles_estudiantes),
    estudiantes: detalles_estudiantes,
    solicitudes: detalles_solicitudes,
    riesgo: 'CRITICO'
  } AS resultado
  ORDER BY SIZE(detalles_estudiantes) DESC
`;

// ============================================================================
// TAREA 2: FILTROS Y AGREGACIONES
// ============================================================================

/**
 * QUERY 4: SOLICITUDES PENDIENTES POR REVISOR
 * Filtra todas las solicitudes con Estado = 'Pendiente' asignadas a un Revisor específico
 * Parámetro: reviewerId (ID del Revisor)
 * Retorna: [ { solicitud_id, estudiante_id, monto, fecha_envio, estado, revisor_nombre } ]
 */
const PENDING_REQUESTS_BY_REVIEWER_QUERY = `
  MATCH (s:Solicitud)-[:REVISADA_POR {Fecha_Asignacion: $reviewerAssignDate}]->(r:Revisor)
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
    revisor_id: r.ID,
    fecha_asignacion: s.REVISADA_POR.Fecha_Asignacion
  } AS resultado
  ORDER BY s.Fecha_Envio ASC
`;

/**
 * QUERY 5: AGREGACIÓN - ESTUDIANTES POR CUENTA
 * Cuenta cuántos estudiantes DISTINTOS usan cada Cuenta, ordenado de mayor a menor
 * Retorna: [ { cuenta_id, banco, num_estudiantes, estudiantes_ids } ]
 */
const COUNT_STUDENTS_BY_ACCOUNT_QUERY = `
  MATCH (e:Estudiante)-[:USA_CUENTA]->(c:Cuenta)
  WITH c, COUNT(DISTINCT e.ID) AS num_estudiantes, COLLECT(DISTINCT e.ID) AS estudiante_ids
  RETURN {
    cuenta_id: c.ID,
    banco: c.Banco,
    tipo_cuenta: c.Tipo_Cuenta,
    terminacion: c.Terminacion,
    numero_estudiantes: num_estudiantes,
    estudiantes_ids: estudiante_ids,
    es_compartida: CASE WHEN num_estudiantes > 1 THEN true ELSE false END
  } AS resultado
  ORDER BY num_estudiantes DESC
`;

/**
 * QUERY 6: AGREGACIÓN - PROMEDIO DE MONTO POR BECA
 * Calcula el AVG de Monto_Solicitado para cada Beca
 * Retorna: [ { beca_id, nombre_beca, categoria, num_solicitudes, monto_promedio, monto_max, monto_min } ]
 */
const AVG_AMOUNT_BY_SCHOLARSHIP_QUERY = `
  MATCH (s:Solicitud)-[:APLICA_A]->(b:Beca)
  WITH b, 
       COUNT(s) AS num_solicitudes,
       AVG(s.Monto_Solicitado) AS monto_promedio,
       MAX(s.Monto_Solicitado) AS monto_maximo,
       MIN(s.Monto_Solicitado) AS monto_minimo
  RETURN {
    beca_id: b.ID,
    nombre_beca: b.Nombre_Beca,
    categoria: b.Categoria,
    monto_maximo_beca: b.Monto_Max,
    numero_solicitudes: num_solicitudes,
    monto_promedio: ROUND(monto_promedio, 2),
    monto_maximo_solicitado: monto_maximo,
    monto_minimo_solicitado: monto_minimo,
    renovable: b.Renovable
  } AS resultado
  ORDER BY num_solicitudes DESC
`;

// ============================================================================
// EXPORTAR TODAS LAS QUERIES
// ============================================================================

module.exports = {
  // Fraude
  SHARED_ACCOUNTS_QUERY,
  REUSED_DOCUMENTS_QUERY,
  FRAUD_NETWORK_QUERY,

  // Filtros y Agregaciones
  PENDING_REQUESTS_BY_REVIEWER_QUERY,
  COUNT_STUDENTS_BY_ACCOUNT_QUERY,
  AVG_AMOUNT_BY_SCHOLARSHIP_QUERY,
};
