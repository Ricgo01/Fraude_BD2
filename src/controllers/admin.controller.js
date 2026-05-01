const driver = require('../services/neo4j.service')

// ─── CREAR NODOS ──────────────────────────────────────────────────────────────

exports.crearRevisor = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre, Rol, Email, Fecha_Ingreso, Especialidades } = req.body
        const result = await session.run(
            `CREATE (r:Persona:Revisor {
        ID: randomUUID(),
        Nombre: $nombre,
        Rol: $rol,
        Email: $email,
        Activo: true,
        Fecha_Ingreso: date($fechaIngreso),
        Especialidades: $especialidades
      }) RETURN r`,
            { nombre: Nombre, rol: Rol, email: Email, fechaIngreso: Fecha_Ingreso, especialidades: Especialidades }
        )
        res.status(201).json({ success: true, data: result.records[0].get('r').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.crearBeca = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre_Beca, Categoria, Monto_Max, Renovable, Fecha_Inicio } = req.body
        const result = await session.run(
            `CREATE (b:Programa:Beca {
        ID: randomUUID(),
        Nombre_Beca: $nombreBeca,
        Categoria: $categoria,
        Monto_Max: toFloat($montoMax),
        Renovable: toBoolean($renovable),
        Fecha_Inicio: date($fechaInicio)
      }) RETURN b`,
            { nombreBeca: Nombre_Beca, categoria: Categoria, montoMax: Monto_Max, renovable: Renovable, fechaInicio: Fecha_Inicio }
        )
        res.status(201).json({ success: true, data: result.records[0].get('b').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}


exports.crearAlertaManual = async (req, res) => {
    const session = driver.session()
    try {
        const { Tipo_Alerta, Nivel_Riesgo, Puntaje_Riesgo, Solicitud_ID } = req.body
        const result = await session.run(
            `CREATE (a:Riesgo:Alerta:Manual {
        ID: randomUUID(),
        Tipo_Alerta: $tipoAlerta,
        Nivel_Riesgo: $nivelRiesgo,
        Puntaje_Riesgo: toFloat($puntajeRiesgo),
        Resuelta: false,
        Fecha_Creacion: date()
      })
      WITH a
      MATCH (s:Solicitud {ID: $solicitudId})
      CREATE (s)-[:GENERA_ALERTA {
        Fecha_Deteccion: date(),
        Regla_Disparada: $tipoAlerta,
        Estado_Alerta: 'activa'
      }]->(a)
      RETURN a`,
            { tipoAlerta: Tipo_Alerta, nivelRiesgo: Nivel_Riesgo, puntajeRiesgo: Puntaje_Riesgo, solicitudId: Solicitud_ID }
        )
        res.status(201).json({ success: true, data: result.records[0].get('a').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── GESTIÓN DE PROPIEDADES EN NODOS ─────────────────────────────────────────

exports.agregarObservacionAlerta = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaId } = req.params
        const { Observacion } = req.body
        await session.run(
            `MATCH (a:Alerta {ID: $alertaId}) SET a.Observacion = $observacion`,
            { alertaId, observacion: Observacion }
        )
        res.status(200).json({ success: true, message: 'Observación agregada exitosamente' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.agregarAuditadoSolicitudes = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudIds } = req.body
        const result = await session.run(
            `UNWIND $solicitudIds AS sid
       MATCH (s:Solicitud {ID: sid})
       SET s.Auditado = true
       RETURN count(s) AS total`,
            { solicitudIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} solicitudes marcadas como auditadas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.actualizarNivelRiesgoAlerta = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaId } = req.params
        const { Nivel_Riesgo } = req.body
        await session.run(
            `MATCH (a:Alerta {ID: $alertaId}) SET a.Nivel_Riesgo = $nivelRiesgo`,
            { alertaId, nivelRiesgo: Nivel_Riesgo }
        )
        res.status(200).json({ success: true, message: 'Nivel de riesgo actualizado' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.desactivarEstudiantes = async (req, res) => {
    const session = driver.session()
    try {
        const { estudianteIds } = req.body
        const result = await session.run(
            `UNWIND $estudianteIds AS eid
       MATCH (e:Estudiante {ID: eid})
       SET e.Activo = false
       RETURN count(e) AS total`,
            { estudianteIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} estudiantes desactivados` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.eliminarIPHash = async (req, res) => {
    const session = driver.session()
    try {
        const { dispositivoId } = req.params
        await session.run(
            `MATCH (d:Dispositivo {ID: $dispositivoId}) REMOVE d.IP_Hash`,
            { dispositivoId }
        )
        res.status(200).json({ success: true, message: 'IP_Hash eliminado exitosamente' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.eliminarCampoAlertas = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaIds } = req.body
        const result = await session.run(
            `UNWIND $alertaIds AS aid
       MATCH (a:Alerta {ID: aid})
       REMOVE a.Observacion
       RETURN count(a) AS total`,
            { alertaIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `Campo eliminado de ${total} alertas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── VISUALIZACIÓN ────────────────────────────────────────────────────────────

exports.verRevisoresActivos = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (r:Revisor {Activo: true}) RETURN r ORDER BY r.Nombre`
        )
        const revisores = result.records.map(r => r.get('r').properties)
        res.status(200).json({ success: true, data: revisores })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.verAlertasActivas = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (a:Alerta {Resuelta: false})
       WHERE a.Nivel_Riesgo = 'alto'
       RETURN a ORDER BY a.Puntaje_Riesgo DESC`
        )
        const alertas = result.records.map(r => r.get('a').properties)
        res.status(200).json({ success: true, data: alertas })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── ELIMINACIÓN DE NODOS ─────────────────────────────────────────────────────

exports.eliminarAlerta = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaId } = req.params
        await session.run(
            `MATCH (a:Alerta {ID: $alertaId, Resuelta: true}) DETACH DELETE a`,
            { alertaId }
        )
        res.status(200).json({ success: true, message: 'Alerta eliminada exitosamente' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.eliminarAlertasResueltas = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaIds } = req.body
        const result = await session.run(
            `UNWIND $alertaIds AS aid
       MATCH (a:Alerta {ID: aid, Resuelta: true})
       DETACH DELETE a
       RETURN count(a) AS total`,
            { alertaIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} alertas eliminadas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── AGREGACIONES ─────────────────────────────────────────────────────────────

exports.contarSolicitudesPorEstado = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (s:Solicitud)
       RETURN s.Estado AS estado, count(s) AS total
       ORDER BY total DESC`
        )
        const data = result.records.map(r => ({
            estado: r.get('estado'),
            total: r.get('total')
        }))
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.agregaciones = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (a:Alerta)
       WITH MAX(a.Puntaje_Riesgo) AS max_riesgo
       MATCH (e:Estudiante)-[:ENVIA]->(s:Solicitud)
       WITH max_riesgo, MIN(e.Promedio) AS min_promedio
       MATCH (p:Pago)-[:DEPOSITA_EN]->(c:Cuenta)
       WITH max_riesgo, min_promedio, SUM(p.Monto) AS sum_depositos
       MATCH (s:Solicitud)-[:ADJUNTA]->(d:Documento)
       WITH max_riesgo, min_promedio, sum_depositos,
            collect(DISTINCT { solicitud_id: s.ID, documento_id: d.ID, tipo: d.Tipo }) AS documentos
       RETURN {
         max_puntaje_riesgo: max_riesgo,
         min_promedio_estudiantes: min_promedio,
         sum_depositos_total: sum_depositos,
         documentos_por_solicitud: documentos
       } AS resultado`
        )
        res.status(200).json({ success: true, data: result.records[0].get('resultado') })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── FILTROS ──────────────────────────────────────────────────────────────────

exports.filtrarEstudiantesPorPromedio = async (req, res) => {
    const session = driver.session()
    try {
        const { becaId } = req.params
        const result = await session.run(
            `MATCH (b:Beca {ID: $becaId})
       MATCH (e:Estudiante)
       WHERE e.Promedio < b.Monto_Max
       RETURN e ORDER BY e.Promedio ASC`,
            { becaId }
        )
        const estudiantes = result.records.map(r => r.get('e').properties)
        res.status(200).json({ success: true, data: estudiantes })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.filtrarDocumentosInvalidos = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (d:Documento {Es_Valido: false}) RETURN d`
        )
        const documentos = result.records.map(r => r.get('d').properties)
        res.status(200).json({ success: true, data: documentos })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.filtrarPagosFallidos = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (p:Pago)
       WHERE p.Exitoso = false AND p.Intentos > 2
       RETURN p ORDER BY p.Intentos DESC`
        )
        const pagos = result.records.map(r => r.get('p').properties)
        res.status(200).json({ success: true, data: pagos })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// ─── RELACIONES ───────────────────────────────────────────────────────────────


exports.auditarAdjuntas = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudIds } = req.body
        const result = await session.run(
            `UNWIND $solicitudIds AS sid
       MATCH (s:Solicitud {ID: sid})-[r:ADJUNTA]->(d:Documento)
       SET r.Auditada = true
       RETURN count(r) AS total`,
            { solicitudIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} relaciones ADJUNTA auditadas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.actualizarEstadoAlertas = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaIds, Estado_Alerta } = req.body
        const result = await session.run(
            `UNWIND $alertaIds AS aid
       MATCH (s:Solicitud)-[r:GENERA_ALERTA]->(a:Alerta {ID: aid})
       SET r.Estado_Alerta = $estadoAlerta
       RETURN count(r) AS total`,
            { alertaIds, estadoAlerta: Estado_Alerta }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} relaciones actualizadas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

exports.eliminarGeneraAlertas = async (req, res) => {
    const session = driver.session()
    try {
        const { alertaIds } = req.body
        const result = await session.run(
            `UNWIND $alertaIds AS aid
       MATCH (s:Solicitud)-[r:GENERA_ALERTA]->(a:Alerta {ID: aid})
       DELETE r
       RETURN count(r) AS total`,
            { alertaIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `${total} relaciones GENERA_ALERTA eliminadas` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// Eliminar Nota de 1 relación REVISADA_POR
exports.eliminarNotaRevision = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudId, revisorId } = req.params
        await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})-[r:REVISADA_POR]->(rev:Revisor {ID: $revisorId})
       REMOVE r.Nota`,
            { solicitudId, revisorId }
        )
        res.status(200).json({ success: true, message: 'Nota eliminada exitosamente' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

// Eliminar Auditada de múltiples relaciones ADJUNTA
exports.eliminarAuditadaAdjuntas = async (req, res) => {
    const session = driver.session()
    try {
        const { solicitudIds } = req.body
        const result = await session.run(
            `UNWIND $solicitudIds AS sid
       MATCH (s:Solicitud {ID: sid})-[r:ADJUNTA]->(d:Documento)
       REMOVE r.Auditada
       RETURN count(r) AS total`,
            { solicitudIds }
        )
        const total = result.records[0].get('total')
        res.status(200).json({ success: true, message: `Auditada eliminada de ${total} relaciones` })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally { await session.close() }
}

const fs = require('fs')
const { parse } = require('csv-parse')

exports.cargarEstudiantesCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo' })
    }

    const session = driver.session()
    const estudiantes = []

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(parse({ columns: true, trim: true }))
                .on('data', (fila) => estudiantes.push(fila))
                .on('end', resolve)
                .on('error', reject)
        })

        let creados = 0
        for (const e of estudiantes) {
            await session.run(
                `CREATE (est:Persona:Estudiante {
          ID: randomUUID(),
          Nombre_Completo: $nombre,
          Email: $email,
          Fecha_Nacimiento: date($fechaNacimiento),
          Promedio: toFloat($promedio),
          Activo: true,
          Fecha_Registro: date()
        })`,
                {
                    nombre: e.Nombre_Completo,
                    email: e.Email,
                    fechaNacimiento: e.Fecha_Nacimiento,
                    promedio: e.Promedio
                }
            )
            creados++
        }

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path)

        res.status(201).json({
            success: true,
            message: `${creados} estudiantes cargados exitosamente`
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}