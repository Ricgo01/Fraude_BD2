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

class StudentService {
  async listStudents() {
    const query = `
      MATCH (e:Estudiante)
      RETURN {
        id: e.ID,
        fullName: e.Nombre_Completo,
        averageGrade: e.Promedio,
        isActive: e.Activo,
        registeredAt: toString(e.Fecha_Registro)
      } AS resultado
      ORDER BY e.Nombre_Completo
      LIMIT 50
    `

    return runQuery(query)
  }

  async getDashboard(studentId) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})
      OPTIONAL MATCH (e)-[:ENVIA]-(s:Solicitud)
      WITH e, collect(DISTINCT s) AS solicitudes
      OPTIONAL MATCH (e)-[:ENVIA]-(:Solicitud)-[:ADJUNTA]-(d:Documento)
      WITH e, solicitudes, collect(DISTINCT d) AS documentos
      RETURN {
        student: {
          id: e.ID,
          fullName: e.Nombre_Completo,
          averageGrade: e.Promedio,
          isActive: e.Activo
        },
        summary: {
          totalRequests: size(solicitudes),
          pending: size([x IN solicitudes WHERE x.Estado = 'Pendiente']),
          inReview: size([x IN solicitudes WHERE x.Estado = 'En Revisión']),
          approved: size([x IN solicitudes WHERE x.Estado = 'Aprobada']),
          rejected: size([x IN solicitudes WHERE x.Estado = 'Rechazada']),
          totalDocuments: size(documentos)
        },
        requests: [x IN solicitudes | {
          id: x.ID,
          status: x.Estado,
          requestedAmount: x.Monto_Solicitado,
          submittedAt: toString(x.Fecha_Envio),
          reason: x.Motivo_Apoyo
        }]
      } AS resultado
    `

    return runSingle(query, { studentId })
  }

  async getProfile(studentId) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})
      OPTIONAL MATCH (e)-[:VIVE_EN]-(dir)
      OPTIONAL MATCH (e)-[:USA_CUENTA]-(c:Cuenta)
      OPTIONAL MATCH (e)-[:USA_DISPOSITIVO]-(d:Dispositivo)
      OPTIONAL MATCH (e)-[:ESTUDIA_EN]-(i)
      OPTIONAL MATCH (e)-[:AVALADO_POR]-(r:Referencia)
      RETURN {
        student: {
          id: e.ID,
          fullName: e.Nombre_Completo,
          birthDate: toString(e.Fecha_Nacimiento),
          averageGrade: e.Promedio,
          isActive: e.Activo,
          registeredAt: toString(e.Fecha_Registro)
        },
        address: {
          id: dir.ID,
          address: dir.Direccion,
          municipality: dir.Municipio,
          department: dir.Departamento,
          isVerified: dir.Verificada
        },
        account: {
          id: c.ID,
          bank: c.Banco,
          accountType: c.Tipo_Cuenta,
          termination: c.Terminacion,
          isActive: c.Activa
        },
        device: {
          id: d.ID,
          browser: d.Navegador,
          os: d.Sistema_Operativo,
          isActive: d.Activo
        },
        institution: {
          id: i.ID,
          name: i.Nombre,
          type: i.Tipo,
          department: i.Departamento
        },
        reference: {
          id: r.ID,
          name: r.Nombre,
          phone: r.Telefono,
          relationship: r.Relacion,
          isVerified: r.Verificada
        }
      } AS resultado
    `

    return runSingle(query, { studentId })
  }

  async updateProfile(studentId, body) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})
      SET e.Nombre_Completo = coalesce($fullName, e.Nombre_Completo),
          e.Promedio = coalesce(toFloat($averageGrade), e.Promedio),
          e.Activo = coalesce($isActive, e.Activo)
      RETURN {
        id: e.ID,
        fullName: e.Nombre_Completo,
        averageGrade: e.Promedio,
        isActive: e.Activo
      } AS resultado
    `

    return runSingle(query, {
      studentId,
      fullName: body.fullName || null,
      averageGrade: body.averageGrade || null,
      isActive: body.isActive === undefined ? null : body.isActive
    })
  }

  async getScholarships() {
    const query = `
      MATCH (b:Beca)
      RETURN {
        id: b.ID,
        scholarshipName: b.Nombre_Beca,
        category: b.Categoria,
        maxAmount: b.Monto_Max,
        isRenewable: b.Renovable,
        startDate: toString(b.Fecha_Inicio)
      } AS resultado
      ORDER BY b.Nombre_Beca
    `

    return runQuery(query)
  }

  async getRequests(studentId, estado) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud)
      OPTIONAL MATCH (s)-[:APLICA_A]-(b:Beca)
      OPTIONAL MATCH (s)-[:GENERA_ALERTA]-(a:Alerta)
      WITH s, b, count(DISTINCT a) AS total_alertas
      WHERE $estado = '' OR s.Estado = $estado
      RETURN {
        id: s.ID,
        beca_id: b.ID,
        beca: b.Nombre_Beca,
        categoria: b.Categoria,
        estado: s.Estado,
        monto_solicitado: s.Monto_Solicitado,
        fecha_envio: toString(s.Fecha_Envio),
        motivo: s.Motivo_Apoyo,
        apoyo_total: s.Apoyo_Total,
        total_alertas: total_alertas
      } AS resultado
      ORDER BY resultado.fecha_envio DESC
    `

    return runQuery(query, {
      studentId,
      estado: estado || ''
    })
  }

  async getRequestDetail(studentId, requestId) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud {ID: $requestId})
      OPTIONAL MATCH (s)-[:APLICA_A]-(b:Beca)
      OPTIONAL MATCH (s)-[:ADJUNTA]-(d:Documento)
      OPTIONAL MATCH (s)-[:GENERA_ALERTA]-(a:Alerta)
      RETURN {
        solicitud: {
          id: s.ID,
          estado: s.Estado,
          monto_solicitado: s.Monto_Solicitado,
          fecha_envio: toString(s.Fecha_Envio),
          motivo: s.Motivo_Apoyo,
          apoyo_total: s.Apoyo_Total
        },
        beca: {
          id: b.ID,
          nombre: b.Nombre_Beca,
          categoria: b.Categoria,
          monto_max: b.Monto_Max,
          renovable: b.Renovable
        },
        documentos: collect(DISTINCT {
          id: d.ID,
          tipo: d.Tipo,
          hash: d.Hash,
          fecha_carga: toString(d.Fecha_Carga),
          tamanio_kb: d.Tamaño_KB,
          es_valido: d.Es_Valido,
          estado_revision: d.Estado_Revision
        }),
        alertas: collect(DISTINCT {
          id: a.ID,
          tipo_alerta: a.Tipo_Alerta,
          nivel_riesgo: a.Nivel_Riesgo,
          puntaje_riesgo: a.Puntaje_Riesgo,
          resuelta: a.Resuelta
        })
      } AS resultado
    `

    return runSingle(query, { studentId, requestId })
  }

  async createRequest(studentId, body) {
    const requestId = `SOL_${Date.now()}`

    const query = `
      MATCH (e:Estudiante {ID: $studentId})
      MATCH (b:Beca {ID: $becaId})
      CREATE (s:Solicitud {
        ID: $requestId,
        Fecha_Envio: date(),
        Estado: 'Pendiente',
        Monto_Solicitado: toFloat($montoSolicitado),
        Motivo_Apoyo: $motivo,
        Apoyo_Total: $apoyoTotal
      })
      CREATE (e)-[:ENVIA {
        Fecha_Envio: date(),
        Canal: 'Web',
        Estado_Inicial: 'Pendiente'
      }]->(s)
      CREATE (s)-[:APLICA_A {
        Fecha_Aplicacion: date(),
        Prioridad: toInteger($prioridad),
        Cumple_Reglas: toFloat($montoSolicitado) <= b.Monto_Max
      }]->(b)
      RETURN {
        id: s.ID,
        estado: s.Estado,
        beca: b.Nombre_Beca,
        monto_solicitado: s.Monto_Solicitado,
        fecha_envio: toString(s.Fecha_Envio)
      } AS resultado
    `

    return runSingle(query, {
      studentId,
      requestId,
      becaId: body.becaId,
      montoSolicitado: body.montoSolicitado,
      motivo: body.motivo,
      apoyoTotal: Boolean(body.apoyoTotal),
      prioridad: body.prioridad || 1
    })
  }

  async updateRequest(studentId, requestId, body) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud {ID: $requestId})
      WHERE s.Estado = 'Pendiente'
      SET s.Monto_Solicitado = coalesce(toFloat($montoSolicitado), s.Monto_Solicitado),
          s.Motivo_Apoyo = coalesce($motivo, s.Motivo_Apoyo),
          s.Apoyo_Total = coalesce($apoyoTotal, s.Apoyo_Total)
      RETURN {
        id: s.ID,
        estado: s.Estado,
        monto_solicitado: s.Monto_Solicitado,
        motivo: s.Motivo_Apoyo,
        apoyo_total: s.Apoyo_Total
      } AS resultado
    `

    return runSingle(query, {
      studentId,
      requestId,
      montoSolicitado: body.montoSolicitado || null,
      motivo: body.motivo || null,
      apoyoTotal: body.apoyoTotal === undefined ? null : Boolean(body.apoyoTotal)
    })
  }

  async deleteRequest(studentId, requestId) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud {ID: $requestId})
      WHERE s.Estado = 'Pendiente'
      DETACH DELETE s
      RETURN {
        deleted: true,
        request_id: $requestId
      } AS resultado
    `

    return runSingle(query, { studentId, requestId })
  }

  async getDocuments(studentId, estadoRevision) {
    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud)-[:ADJUNTA]-(d:Documento)
      WHERE $estadoRevision = '' OR d.Estado_Revision = $estadoRevision
      RETURN {
        id: d.ID,
        solicitud_id: s.ID,
        tipo: d.Tipo,
        hash: d.Hash,
        fecha_carga: toString(d.Fecha_Carga),
        tamanio_kb: d.Tamaño_KB,
        es_valido: d.Es_Valido,
        estado_revision: d.Estado_Revision
      } AS resultado
      ORDER BY resultado.fecha_carga DESC
    `

    return runQuery(query, {
      studentId,
      estadoRevision: estadoRevision || ''
    })
  }

  async addDocument(studentId, requestId, body) {
    const documentId = `DOC_${Date.now()}`

    const query = `
      MATCH (e:Estudiante {ID: $studentId})-[:ENVIA]-(s:Solicitud {ID: $requestId})
      CREATE (d:Documento {
        ID: $documentId,
        Tipo: $tipo,
        Hash: $hash,
        Fecha_Carga: date(),
        Tamaño_KB: toFloat($tamanioKb),
        Es_Valido: null,
        Estado_Revision: 'Pendiente'
      })
      CREATE (s)-[:ADJUNTA {
        Fecha_Carga: date(),
        Obligatorio: $obligatorio,
        Estado_Revision: 'Pendiente'
      }]->(d)
      RETURN {
        id: d.ID,
        solicitud_id: s.ID,
        tipo: d.Tipo,
        fecha_carga: toString(d.Fecha_Carga),
        estado_revision: d.Estado_Revision
      } AS resultado
    `

    return runSingle(query, {
      studentId,
      requestId,
      documentId,
      tipo: body.tipo,
      hash: `sha256_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tamanioKb: body.tamanioKb || 100,
      obligatorio: Boolean(body.obligatorio)
    })
  }
}

module.exports = new StudentService()