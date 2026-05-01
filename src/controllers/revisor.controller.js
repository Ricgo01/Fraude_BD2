require('dotenv').config()
const jwt = require('jsonwebtoken')
const driver = require('../services/neo4j.service')

exports.resolverSolicitud = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId } = req.params
        const { Decision, Nota } = req.body
        const revisorId = req.usuario.id

        if (!['Aprobada', 'Rechazada'].includes(Decision)) {
            return res.status(400).json({
                success: false,
                message: 'Decision inválida — solo Aprobada o Rechazada'
            })
        }

        // Actualizar estado de la solicitud y crear relación REVISADA_POR
        let query = `
      MATCH (s:Solicitud {ID: $solicitudId})
      MATCH (r:Revisor {ID: $revisorId})
      SET s.Estado = $decision
      MERGE (s)-[rev:REVISADA_POR]->(r)
      ON CREATE SET
        rev.Fecha_Asignacion = date(),
        rev.Fecha_Resolucion = date(),
        rev.Decision = $decision
      ON MATCH SET
        rev.Fecha_Resolucion = date(),
        rev.Decision = $decision
    `

        // Si hay nota la agrega a la relación
        if (Nota) {
            query += ` SET rev.Nota = $nota`
        }

        // Si es aprobada crea el pago
        if (Decision === 'Aprobada') {
            query += `
                WITH s, r
                MATCH (e:Estudiante)-[:ENVIA]->(s)
                MATCH (e)-[:USA_CUENTA]->(c:Cuenta)
                CREATE (p:Pago {
                ID: randomUUID(),
                Monto: s.Monto_Solicitado,
                Fecha_Pago: date(),
                Estado: 'procesado',
                Referencia_Tx: 'TX' + toString(timestamp()),
                Exitoso: true,
                Intentos: 1
                })
                CREATE (s)-[:GENERA_PAGO {
                Fecha_Autorizacion: date(),
                Aprobado_Por: $revisorId,
                Ciclo_Pago: 'mensual'
                }]->(p)
                CREATE (p)-[:DEPOSITA_EN {
                Fecha_Deposito: date(),
                Confirmado: true,
                Monto_Depositado: s.Monto_Solicitado
                }]->(c)
            `
        }

        query += ` RETURN s`

        const result = await session.run(query, {
            solicitudId,
            revisorId,
            decision: Decision,
            nota: Nota
        })

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            })
        }

        const solicitud = result.records[0].get('s').properties

        res.status(200).json({
            success: true,
            message: `Solicitud ${Decision.toLowerCase()} exitosamente`,
            data: solicitud
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.marcarDocumentosRevisados = async (req, res) => {
    const session = driver.session()
    try {
        const { documentoIds, Estado_Revision } = req.body

        if (!['aprobado', 'rechazado', 'pendiente'].includes(Estado_Revision)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido — solo aprobado, rechazado o pendiente'
            })
        }

        const result = await session.run(
            `UNWIND $documentoIds AS docId
       MATCH (d:Documento {ID: docId})
       SET d.Es_Valido = CASE WHEN $estadoRevision = 'aprobado' THEN true ELSE false END
       WITH d
       MATCH (s:Solicitud)-[r:ADJUNTA]->(d)
       SET r.Estado_Revision = $estadoRevision
       RETURN count(d) AS total`,
            {
                documentoIds,
                estadoRevision: Estado_Revision
            }
        )

        const total = result.records[0].get('total')

        res.status(200).json({
            success: true,
            message: `${total} documento(s) marcados como ${Estado_Revision}`,
            data: { total }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.verSolicitudesPendientes = async (req, res) => {
    const session = driver.session()
    try {
        const revisorId = req.usuario.id

        const result = await session.run(
            `MATCH (s:Solicitud)-[:REVISADA_POR]->(r:Revisor {ID: $revisorId})
       WHERE s.Estado = 'Pendiente'
       MATCH (e:Estudiante)-[:ENVIA]->(s)
       MATCH (s)-[:APLICA_A]->(b:Beca)
       RETURN {
         solicitud_id: s.ID,
         fecha_envio: s.Fecha_Envio,
         estado: s.Estado,
         monto_solicitado: s.Monto_Solicitado,
         motivo: s.Motivo_Apoyo,
         estudiante_id: e.ID,
         estudiante_nombre: e.Nombre_Completo,
         beca_nombre: b.Nombre_Beca
       } AS resultado
       ORDER BY s.Fecha_Envio ASC`,
            { revisorId }
        )

        const solicitudes = result.records.map(r => r.get('resultado'))

        res.status(200).json({
            success: true,
            data: solicitudes
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.verDetalleSolicitud = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId } = req.params

        const result = await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})
       MATCH (e:Estudiante)-[:ENVIA]->(s)
       MATCH (s)-[:APLICA_A]->(b:Beca)
    OPTIONAL MATCH (s)-[:ADJUNTA]->(d:Documento)
    OPTIONAL MATCH (s)-[:GENERA_ALERTA]-(a:Alerta)
       RETURN {
         solicitud_id: s.ID,
         fecha_envio: s.Fecha_Envio,
         estado: s.Estado,
         monto_solicitado: s.Monto_Solicitado,
         motivo: s.Motivo_Apoyo,
         apoyo_total: s.Apoyo_Total,
         estudiante: {
           id: e.ID,
           nombre: e.Nombre_Completo,
           promedio: e.Promedio,
           activo: e.Activo
         },
         beca: {
           id: b.ID,
           nombre: b.Nombre_Beca,
           categoria: b.Categoria,
           monto_max: b.Monto_Max
         },
         documentos: collect(DISTINCT {
           id: d.ID,
           tipo: d.Tipo,
           es_valido: d.Es_Valido,
           fecha_carga: d.Fecha_Carga
         }),
         alertas: collect(DISTINCT {
           id: a.ID,
           tipo: a.Tipo_Alerta,
           nivel_riesgo: a.Nivel_Riesgo,
           resuelta: a.Resuelta
         })
       } AS resultado`,
            { solicitudId }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            data: result.records[0].get('resultado')
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.eliminarMotivoSolicitud = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId } = req.params

        const result = await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})
       WHERE s.Estado IN ['Aprobada', 'Rechazada']
       REMOVE s.Motivo_Apoyo
       RETURN s`,
            { solicitudId }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o aún no procesada'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Motivo eliminado exitosamente'
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.agregarNotaRevision = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId } = req.params
        const { Nota } = req.body
        const revisorId = req.usuario.id

        const result = await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})-[r:REVISADA_POR]->(rev:Revisor {ID: $revisorId})
       SET r.Nota = $nota
       RETURN r`,
            { solicitudId, revisorId, nota: Nota }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Relación REVISADA_POR no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Nota agregada exitosamente'
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.eliminarAdjunta = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId, documentoId } = req.params

        const result = await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})-[r:ADJUNTA]->(d:Documento {ID: $documentoId})
       SET d.Es_Valido = false
       DELETE r
       RETURN d`,
            { solicitudId, documentoId }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Relación ADJUNTA no encontrada'
            })
        }

        res.status(200).json({
            success: true,
            message: 'Documento desvinculado y marcado como inválido'
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.verSolicitudesPorRiesgo = async (req, res) => {
    const session = driver.session()
    try {
        const revisorId = req.usuario.id
        const { Nivel_Riesgo } = req.query

        if (!['bajo', 'medio', 'alto'].includes(Nivel_Riesgo)) {
            return res.status(400).json({
                success: false,
                message: 'Nivel de riesgo inválido — solo bajo, medio o alto'
            })
        }

        const result = await session.run(
            `MATCH (s:Solicitud)-[:REVISADA_POR]->(r:Revisor {ID: $revisorId})
       MATCH (s)-[:GENERA_ALERTA]->(a:Alerta {Nivel_Riesgo: $nivelRiesgo})
       MATCH (e:Estudiante)-[:ENVIA]->(s)
       RETURN {
         solicitud_id: s.ID,
         fecha_envio: s.Fecha_Envio,
         estado: s.Estado,
         monto_solicitado: s.Monto_Solicitado,
         estudiante_nombre: e.Nombre_Completo,
         nivel_riesgo: a.Nivel_Riesgo,
         tipo_alerta: a.Tipo_Alerta,
         puntaje_riesgo: a.Puntaje_Riesgo
       } AS resultado
       ORDER BY a.Puntaje_Riesgo DESC`,
            { revisorId, nivelRiesgo: Nivel_Riesgo }
        )

        const solicitudes = result.records.map(r => r.get('resultado'))

        res.status(200).json({
            success: true,
            data: solicitudes
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.contarSolicitudesPendientes = async (req, res) => {
    const session = driver.session()
    try {
        const revisorId = req.usuario.id

        const result = await session.run(
            `MATCH (s:Solicitud)-[:REVISADA_POR]->(r:Revisor {ID: $revisorId})
       WHERE s.Estado = 'Pendiente'
       RETURN count(s) AS total`,
            { revisorId }
        )

        const total = result.records[0].get('total')

        res.status(200).json({
            success: true,
            data: { total_pendientes: total }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}