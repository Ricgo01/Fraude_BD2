/**
 * FRAUDE_BD2 - Consultas Cypher para Detección de Fraude
 * Esquema: Estudiante, Solicitud, Documento, Cuenta, Dispositivo, Beca, Alerta, Revisor
 * Autor: FEL
 * Fecha: 2026-04-28
 */

// ============================================================================
// TAREA 1: CONSULTAS DE FRAUDE
// ============================================================================

/**
 * QUERY 1: CUENTAS BANCARIAS COMPARTIDAS
 */
const SHARED_ACCOUNTS_QUERY = `
  MATCH (e:Estudiante)-[:USA_CUENTA]->(cuenta:Cuenta)
  WITH cuenta, COLLECT(DISTINCT e) AS estudiantes
  WITH cuenta, estudiantes, SIZE(estudiantes) AS num_estudiantes
  WHERE num_estudiantes > 1

  OPTIONAL MATCH (e:Estudiante)-[:USA_CUENTA]->(cuenta)
  WHERE e IN estudiantes
  OPTIONAL MATCH (e)-[:ENVIA]->(s:Solicitud)

  WITH 
    cuenta,
    estudiantes,
    num_estudiantes,
    COLLECT(DISTINCT {
      id: s.ID,
      fecha_envio: s.Fecha_Envio,
      estado: s.Estado,
      monto: s.Monto_Solicitado,
      estudiante_id: e.ID
    }) AS detalles_solicitudes

  WITH cuenta, estudiantes, num_estudiantes, detalles_solicitudes
  ORDER BY num_estudiantes DESC

  RETURN {
    cuenta_id: cuenta.ID,
    banco: cuenta.Banco,
    tipo_cuenta: cuenta.Tipo_Cuenta,
    terminacion: cuenta.Terminacion,
    numero_estudiantes: num_estudiantes,
    estudiantes: [
      est IN estudiantes | {
        id: est.ID,
        nombre: est.Nombre_Completo,
        promedio: est.Promedio,
        activo: est.Activo,
        fecha_registro: est.Fecha_Registro
      }
    ],
    solicitudes: detalles_solicitudes,
    riesgo: 'ALTO'
  } AS resultado
`;

/**
 * QUERY 2: DOCUMENTOS REUTILIZADOS
 */
const REUSED_DOCUMENTS_QUERY = `
  MATCH (est:Estudiante)-[:ENVIA]->(sol:Solicitud)-[:ADJUNTA]->(doc:Documento)
  WHERE doc.Hash IS NOT NULL AND trim(doc.Hash) <> ''

  WITH 
    doc.Hash AS hash,
    COLLECT(DISTINCT est) AS estudiantes,
    COLLECT(DISTINCT sol) AS solicitudes,
    COLLECT(DISTINCT doc) AS documentos

  WITH 
    hash,
    estudiantes,
    solicitudes,
    documentos,
    SIZE(estudiantes) AS num_estudiantes,
    SIZE(documentos) AS num_documentos

  WHERE num_estudiantes > 1

  WITH 
    hash,
    estudiantes,
    solicitudes,
    documentos,
    num_estudiantes,
    num_documentos

  ORDER BY num_estudiantes DESC, num_documentos DESC

  RETURN {
    hash: hash,
    numero_documentos: num_documentos,
    numero_estudiantes: num_estudiantes,
    documentos: [
      documento IN documentos | {
        id: documento.ID,
        tipo: documento.Tipo,
        hash: documento.Hash,
        fecha_carga: documento.Fecha_Carga,
        tamaño_kb: documento['Tamaño_KB'],
        es_valido: documento.Es_Valido
      }
    ],
    estudiantes: [
      estudiante IN estudiantes | {
        id: estudiante.ID,
        nombre: estudiante.Nombre_Completo,
        fecha_registro: estudiante.Fecha_Registro
      }
    ],
    solicitudes: [
      solicitud IN solicitudes | {
        id: solicitud.ID,
        fecha_envio: solicitud.Fecha_Envio,
        estado: solicitud.Estado,
        monto: solicitud.Monto_Solicitado
      }
    ],
    riesgo: 'CRITICO'
  } AS resultado
`;

/**
 * QUERY 3: RED DE FRAUDE
 * Detecta estudiantes que comparten la misma Cuenta y el mismo Dispositivo.
 */
const FRAUD_NETWORK_QUERY = `
  MATCH (e:Estudiante)-[:USA_CUENTA]->(c:Cuenta)
  MATCH (e)-[:USA_DISPOSITIVO]->(d:Dispositivo)

  WITH c, d, COLLECT(DISTINCT e) AS estudiantes
  WITH c, d, estudiantes, SIZE(estudiantes) AS num_estudiantes
  WHERE num_estudiantes > 1

  OPTIONAL MATCH (x:Estudiante)-[:ENVIA]->(s:Solicitud)
  WHERE x IN estudiantes

  WITH 
    c,
    d,
    estudiantes,
    num_estudiantes,
    COLLECT(DISTINCT {
      id: s.ID,
      fecha_envio: s.Fecha_Envio,
      estado: s.Estado,
      monto: s.Monto_Solicitado,
      estudiante_id: x.ID
    }) AS detalles_solicitudes

  WITH c, d, estudiantes, num_estudiantes, detalles_solicitudes
  ORDER BY num_estudiantes DESC

  RETURN {
    cuenta_id: c.ID,
    banco: c.Banco,
    tipo_cuenta: c.Tipo_Cuenta,
    terminacion: c.Terminacion,
    dispositivo_id: d.ID,
    navegador: d.Navegador,
    sistema_operativo: d.Sistema_Operativo,
    ip_hash: d.IP_Hash,
    numero_estudiantes: num_estudiantes,
    estudiantes: [
      est IN estudiantes | {
        id: est.ID,
        nombre: est.Nombre_Completo,
        promedio: est.Promedio,
        activo: est.Activo
      }
    ],
    solicitudes: detalles_solicitudes,
    riesgo: 'CRITICO'
  } AS resultado
`;

/**
 * QUERY EXTRA: SOLICITUDES DUPLICADAS
 * Detecta un mismo estudiante con más de una solicitud activa para la misma beca.
 */
const DUPLICATE_APPLICATIONS_QUERY = `
  MATCH (e:Estudiante)-[:ENVIA]->(s:Solicitud)-[:APLICA_A]->(b:Beca)
  WHERE s.Estado IN ['Pendiente', 'En revisión', 'En Revisión']
  
  WITH e, b, COLLECT(s) AS solicitudes
  WHERE SIZE(solicitudes) > 1

  RETURN {
    estudiante: {
      id: e.ID,
      nombre: e.Nombre_Completo,
      activo: e.Activo,
      promedio: e.Promedio
    },
    beca: {
      id: b.ID,
      nombre: b.Nombre_Beca,
      categoria: b.Categoria,
      monto_maximo: b.Monto_Max
    },
    total_solicitudes: SIZE(solicitudes),
    solicitudes: [sol IN solicitudes | {
      id: sol.ID,
      estado: sol.Estado,
      fecha_envio: sol.Fecha_Envio,
      monto_solicitado: sol.Monto_Solicitado,
      motivo_apoyo: sol.Motivo_Apoyo
    }],
    riesgo: 'MEDIO'
  } AS resultado
`;

// ============================================================================
// TAREA 2: FILTROS Y AGREGACIONES
// ============================================================================

/**
 * QUERY 4: SOLICITUDES PENDIENTES POR REVISOR
 */
const PENDING_REQUESTS_BY_REVIEWER_QUERY = `
  MATCH (s:Solicitud)-[rev:REVISADA_POR]->(r:Revisor)
  WHERE r.ID = $reviewerId 
    AND s.Estado = 'Pendiente'

  MATCH (e:Estudiante)-[:ENVIA]->(s)

  WITH e, s, r, rev
  ORDER BY s.Fecha_Envio ASC

  RETURN {
    solicitud_id: s.ID,
    estudiante_id: e.ID,
    estudiante_nombre: e.Nombre_Completo,
    monto_solicitado: s.Monto_Solicitado,
    fecha_envio: s.Fecha_Envio,
    estado: s.Estado,
    revisor_nombre: r.Nombre,
    revisor_id: r.ID,
    fecha_asignacion: rev.Fecha_Asignacion,
    decision: rev.Decision
  } AS resultado
`;

/**
 * QUERY 5: AGREGACIÓN - ESTUDIANTES POR CUENTA
 */
const COUNT_STUDENTS_BY_ACCOUNT_QUERY = `
  MATCH (e:Estudiante)-[:USA_CUENTA]->(c:Cuenta)

  WITH 
    c,
    COUNT(DISTINCT e) AS num_estudiantes,
    COLLECT(DISTINCT e.ID) AS estudiante_ids

  WITH c, num_estudiantes, estudiante_ids
  ORDER BY num_estudiantes DESC

  RETURN {
    cuenta_id: c.ID,
    banco: c.Banco,
    tipo_cuenta: c.Tipo_Cuenta,
    terminacion: c.Terminacion,
    numero_estudiantes: num_estudiantes,
    estudiantes_ids: estudiante_ids,
    es_compartida: CASE 
      WHEN num_estudiantes > 1 THEN true 
      ELSE false 
    END
  } AS resultado
`;

/**
 * QUERY 6: AGREGACIÓN - PROMEDIO DE MONTO POR BECA
 */
const AVG_AMOUNT_BY_SCHOLARSHIP_QUERY = `
  MATCH (s:Solicitud)-[:APLICA_A]->(b:Beca)

  WITH 
    b,
    COUNT(DISTINCT s) AS num_solicitudes,
    AVG(s.Monto_Solicitado) AS monto_promedio,
    MAX(s.Monto_Solicitado) AS monto_maximo,
    MIN(s.Monto_Solicitado) AS monto_minimo

  WITH b, num_solicitudes, monto_promedio, monto_maximo, monto_minimo
  ORDER BY num_solicitudes DESC

  RETURN {
    beca_id: b.ID,
    nombre_beca: b.Nombre_Beca,
    categoria: b.Categoria,
    monto_maximo_beca: b.Monto_Max,
    numero_solicitudes: num_solicitudes,
    monto_promedio: round(monto_promedio * 100) / 100.0,
    monto_maximo_solicitado: monto_maximo,
    monto_minimo_solicitado: monto_minimo,
    renovable: b.Renovable
  } AS resultado
`;

// ============================================================================
// EXPORTAR TODAS LAS QUERIES
// ============================================================================

module.exports = {
  // Fraude
  SHARED_ACCOUNTS_QUERY,
  REUSED_DOCUMENTS_QUERY,
  FRAUD_NETWORK_QUERY,
  DUPLICATE_APPLICATIONS_QUERY,

  // Filtros y agregaciones
  PENDING_REQUESTS_BY_REVIEWER_QUERY,
  COUNT_STUDENTS_BY_ACCOUNT_QUERY,
  AVG_AMOUNT_BY_SCHOLARSHIP_QUERY,
};