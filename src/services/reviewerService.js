const { driver, normalizeNeo4jProperties } = require('./neo4j.service')

async function runQuery(query, params = {}) {
  const session = driver.session()
  try {
    const result = await session.run(query, params)
    return result.records.map(record => normalizeNeo4jProperties(record.get('resultado')))
  } catch (error) {
    console.error('Neo4j query error:', error)
    throw error
  } finally {
    await session.close()
  }
}

async function runSingle(query, params = {}) {
  const rows = await runQuery(query, params)
  return rows[0] || null
}

class ReviewerService {
  async listReviewers() {
    const query = `
      MATCH (r:Revisor)
      RETURN {
        id: r.ID,
        fullName: r.Nombre,
        department: r.Departamento,
        isActive: r.Activo
      } AS resultado
      ORDER BY r.Nombre
      LIMIT 50
    `
    return runQuery(query)
  }

  async getDashboard(reviewerId) {
    const query = `
      MATCH (r:Revisor {ID: $reviewerId})
      OPTIONAL MATCH (r)-[:REVISA]-(s:Solicitud)
      WITH r, collect(DISTINCT s) AS solicitudes
      OPTIONAL MATCH (r)-[:REGISTRA_ALERTA]-(a:Alerta)
      WITH r, solicitudes, collect(DISTINCT a) AS alertas
      RETURN {
        reviewer: {
          id: r.ID,
          fullName: r.Nombre,
          department: r.Departamento,
          isActive: r.Activo
        },
        summary: {
          totalAssigned: size(solicitudes),
          pendingReview: size([x IN solicitudes WHERE x.Estado = 'Pendiente' OR x.Estado = 'En Revisión']),
          completedReview: size([x IN solicitudes WHERE x.Estado = 'Aprobada' OR x.Estado = 'Rechazada']),
          alertsGenerated: size(alertas)
        },
        recentRequests: [x IN solicitudes[0..5] | {
          id: x.ID,
          status: x.Estado,
          requestedAmount: x.Monto_Solicitado,
          submittedAt: toString(x.Fecha_Envio)
        }]
      } AS resultado
    `
    return runSingle(query, { reviewerId })
  }

  async getRequests(reviewerId, status) {
    const query = `
      MATCH (r:Revisor {ID: $reviewerId})-[:REVISA]-(s:Solicitud)
      OPTIONAL MATCH (e:Estudiante)-[:ENVIA]->(s)
      OPTIONAL MATCH (s)-[:APLICA_A]->(b:Beca)
      OPTIONAL MATCH (s)-[:GENERA_ALERTA]-(a:Alerta)
      WITH s, e, b, count(DISTINCT a) as totalAlerts
      WHERE $status = '' OR s.Estado = $status
      RETURN {
        id: s.ID,
        studentName: coalesce(e.Nombre_Completo, 'Desconocido'),
        scholarshipName: coalesce(b.Nombre_Beca, 'Desconocido'),
        status: s.Estado,
        requestedAmount: s.Monto_Solicitado,
        submittedAt: toString(s.Fecha_Envio),
        totalAlerts: totalAlerts
      } AS resultado
      ORDER BY resultado.submittedAt ASC
    `
    return runQuery(query, { reviewerId, status: status || '' })
  }

  async getRequestDetail(reviewerId, requestId) {
    const query = `
      MATCH (r:Revisor {ID: $reviewerId})-[:REVISA]-(s:Solicitud {ID: $requestId})
      OPTIONAL MATCH (e:Estudiante)-[:ENVIA]->(s)
      OPTIONAL MATCH (s)-[:APLICA_A]->(b:Beca)
      OPTIONAL MATCH (s)-[:ADJUNTA]->(d:Documento)
      OPTIONAL MATCH (s)-[:GENERA_ALERTA]->(a:Alerta)
      RETURN {
        request: {
          id: s.ID,
          status: s.Estado,
          requestedAmount: s.Monto_Solicitado,
          submittedAt: toString(s.Fecha_Envio),
          reason: s.Motivo_Apoyo,
          fullSupport: s.Apoyo_Total
        },
        student: {
          id: e.ID,
          fullName: coalesce(e.Nombre_Completo, 'Desconocido'),
          averageGrade: e.Promedio
        },
        scholarship: {
          id: b.ID,
          scholarshipName: coalesce(b.Nombre_Beca, 'Desconocido'),
          category: b.Categoria,
          maxAmount: b.Monto_Max
        },
        documents: collect(DISTINCT {
          id: d.ID,
          type: d.Tipo,
          hash: d.Hash,
          uploadedAt: toString(d.Fecha_Carga),
          sizeKb: d.Tamaño_KB,
          isValid: d.Es_Valido,
          reviewStatus: d.Estado_Revision
        }),
        alerts: collect(DISTINCT {
          id: a.ID,
          alertType: a.Tipo_Alerta,
          riskLevel: a.Nivel_Riesgo,
          riskScore: a.Puntaje_Riesgo,
          isResolved: a.Resuelta
        })
      } AS resultado
    `
    return runSingle(query, { reviewerId, requestId })
  }

  async updateRequestStatus(reviewerId, requestId, status) {
    const query = `
      MATCH (r:Revisor {ID: $reviewerId})-[:REVISA]-(s:Solicitud {ID: $requestId})
      SET s.Estado = $status
      RETURN {
        id: s.ID,
        status: s.Estado
      } AS resultado
    `
    return runSingle(query, { reviewerId, requestId, status })
  }

  async reviewDocument(reviewerId, documentId, status) {
    const isValid = (status === 'Valido')
    const query = `
      MATCH (r:Revisor {ID: $reviewerId})
      MATCH (d:Documento {ID: $documentId})
      SET d.Estado_Revision = $status,
          d.Es_Valido = $isValid
      MERGE (r)-[:REVISO_DOCUMENTO { Fecha: date() }]->(d)
      RETURN {
        id: d.ID,
        reviewStatus: d.Estado_Revision,
        isValid: d.Es_Valido
      } AS resultado
    `
    return runSingle(query, { reviewerId, documentId, status, isValid })
  }

  async createAlert(reviewerId, requestId, body) {
    const alertId = `ALR_${Date.now()}`

    const query = `
      MATCH (r:Revisor {ID: $reviewerId})
      MATCH (s:Solicitud {ID: $requestId})
      CREATE (a:Alerta:Manual {
        ID: $alertId,
        Tipo_Alerta: $alertType,
        Nivel_Riesgo: $riskLevel,
        Puntaje_Riesgo: toFloat($riskScore),
        Resuelta: false,
        Fecha_Creacion: datetime(),
        Justificacion: $justification
      })
      CREATE (s)-[:GENERA_ALERTA {
        Fecha_Deteccion: date(),
        Regla_Disparada: $alertType,
        Estado_Alerta: 'MANUAL'
      }]->(a)
      CREATE (a)-[:SEÑALA {
        Fecha_Deteccion: date(),
        Subcaso: $alertType,
        Escalada: true
      }]->(r)
      RETURN {
        id: a.ID,
        alertType: a.Tipo_Alerta,
        riskLevel: a.Nivel_Riesgo,
        riskScore: a.Puntaje_Riesgo,
        isResolved: a.Resuelta,
        justification: a.Justificacion
      } AS resultado
    `

    return runSingle(query, {
      reviewerId,
      requestId,
      alertId,
      alertType: body.alertType,
      riskLevel: body.riskLevel,
      riskScore: body.riskScore,
      justification: body.justification || ''
    })
  }
}

module.exports = new ReviewerService()