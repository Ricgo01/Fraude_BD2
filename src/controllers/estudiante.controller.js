require('dotenv').config()
const jwt = require('jsonwebtoken')
const driver = require('../services/neo4j.service')

exports.crearSolicitud = async (req, res) => {
    const session = driver.session()
    try {
        const { Motivo_Apoyo, Apoyo_Total, Beca_ID, Monto_Solicitado } = req.body
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MATCH (b:Beca {ID: $becaId})
       CREATE (s:Solicitud {
         ID: randomUUID(),
         Fecha_Envio: date(),
         Estado: 'Pendiente',
         Monto_Solicitado: toFloat($monto),
         Motivo_Apoyo: $motivo,
         Apoyo_Total: toBoolean($apoyoTotal)
       })
       CREATE (e)-[:ENVIA {
         Fecha_Envio: date(),
         Canal: 'web',
         Estado_Inicial: 'Pendiente'
       }]->(s)
       CREATE (s)-[:APLICA_A {
         Fecha_Aplicacion: date(),
         Prioridad: 1,
         Cumple_Reglas: true
       }]->(b)
       RETURN s`,
            {
                estudianteId,
                becaId: Beca_ID,
                monto: Monto_Solicitado,
                motivo: Motivo_Apoyo,
                apoyoTotal: Apoyo_Total
            }
        )

        const solicitud = result.records[0].get('s').properties
        res.status(201).json({
            success: true,
            message: 'Solicitud creada exitosamente',
            data: solicitud
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.crearDocumento = async (req, res) => {
    const session = driver.session()
    try {
        const { Tipo, Hash, Palabras_Clave, Solicitud_ID } = req.body

        const result = await session.run(
            `MATCH (s:Solicitud {ID: $solicitudId})
       CREATE (d:Documento {
         ID: randomUUID(),
         Tipo: $tipo,
         Hash: $hash,
         Fecha_Carga: date(),
         Tamaño_KB: toFloat(size($hash)),
         Es_Valido: true,
         Palabras_Clave: $palabrasClave
       })
       CREATE (s)-[:ADJUNTA {
         Fecha_Carga: date(),
         Obligatorio: false,
         Estado_Revision: 'pendiente'
       }]->(d)
       RETURN d`,
            {
                solicitudId: Solicitud_ID,
                tipo: Tipo,
                hash: Hash,
                palabrasClave: Palabras_Clave
            }
        )

        const documento = result.records[0].get('d').properties

        res.status(201).json({
            success: true,
            message: 'Documento creado y adjuntado exitosamente',
            data: documento
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.mergeInstitucion = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre, Tipo, Departamento, Publica, Fecha_Convenio,
            Desde_Fecha, Carrera, Estado_Academico } = req.body
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MERGE (i:Institucion {Nombre: $nombre})
       ON CREATE SET
         i.ID = randomUUID(),
         i.Tipo = $tipo,
         i.Departamento = $departamento,
         i.Publica = toBoolean($publica),
         i.Fecha_Convenio = date($fechaConvenio)
       MERGE (e)-[r:ESTUDIA_EN]->(i)
       ON CREATE SET
         r.Desde_Fecha = date($desdeFecha),
         r.Carrera = $carrera,
         r.Estado_Academico = $estadoAcademico
       RETURN i`,
            {
                estudianteId,
                nombre: Nombre,
                tipo: Tipo,
                departamento: Departamento,
                publica: Publica,
                fechaConvenio: Fecha_Convenio,
                desdeFecha: Desde_Fecha,
                carrera: Carrera,
                estadoAcademico: Estado_Academico
            }
        )

        const institucion = result.records[0].get('i').properties

        res.status(200).json({
            success: true,
            message: 'Institución vinculada exitosamente',
            data: institucion
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.mergeCuenta = async (req, res) => {
    const session = driver.session()
    try {
        const { Banco, Tipo_Cuenta, Terminacion, Activa, Fecha_Registro,
            Principal, Verificada } = req.body
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MERGE (c:Finanzas:Cuenta {
         Banco: $banco,
         Tipo_Cuenta: $tipoCuenta,
         Terminacion: toInteger($terminacion)
       })
       ON CREATE SET
         c.ID = randomUUID(),
         c.Activa = toBoolean($activa),
         c.Fecha_Registro = date($fechaRegistro)
       MERGE (e)-[r:USA_CUENTA]->(c)
       ON CREATE SET
         r.Fecha_Registro = date($fechaRegistro),
         r.Principal = toBoolean($principal),
         r.Verificada = toBoolean($verificada)
       RETURN c`,
            {
                estudianteId,
                banco: Banco,
                tipoCuenta: Tipo_Cuenta,
                terminacion: Terminacion,
                activa: Activa,
                fechaRegistro: Fecha_Registro,
                principal: Principal,
                verificada: Verificada
            }
        )

        const cuenta = result.records[0].get('c').properties

        res.status(200).json({
            success: true,
            message: 'Cuenta vinculada exitosamente',
            data: cuenta
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.mergeDispositivo = async (req, res) => {
    const session = driver.session()
    try {
        const { Navegador, Sistema_Operativo } = req.body
        const estudianteId = req.usuario.id
        const ip = req.ip || req.connection.remoteAddress
        const IP_Hash = require('crypto').createHash('md5').update(ip).digest('hex')

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MERGE (d:Dispositivo {IP_Hash: $ipHash})
       ON CREATE SET
         d.ID = randomUUID(),
         d.Navegador = $navegador,
         d.Sistema_Operativo = $sistemaOp,
         d.Activo = true,
         d.Fecha_Registro = date()
       MERGE (e)-[r:USA_DISPOSITIVO]->(d)
       ON CREATE SET
         r.Primer_Uso = date(),
         r.Ultimo_Uso = date(),
         r.Veces_Usado = 1
       ON MATCH SET
         r.Ultimo_Uso = date(),
         r.Veces_Usado = r.Veces_Usado + 1
       RETURN d`,
            {
                estudianteId,
                ipHash: IP_Hash,
                navegador: Navegador,
                sistemaOp: Sistema_Operativo
            }
        )

        const dispositivo = result.records[0].get('d').properties

        res.status(200).json({
            success: true,
            message: 'Dispositivo vinculado exitosamente',
            data: dispositivo
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.mergeDireccion = async (req, res) => {
    const session = driver.session()
    try {
        const { Direccion, Municipio, Departamento, Verificada,
            Desde_Fecha, Tipo_Residencia } = req.body
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MERGE (d:Direccion {
         Direccion: $direccion,
         Municipio: $municipio,
         Departamento: $departamento
       })
       ON CREATE SET
         d.ID = randomUUID(),
         d.Verificada = toBoolean($verificada),
         d.Fecha_Actualizacion = date()
       MERGE (e)-[r:VIVE_EN]->(d)
       ON CREATE SET
         r.Desde_Fecha = date($desdeFecha),
         r.Verificada = toBoolean($verificada),
         r.Tipo_Residencia = $tipoResidencia
       RETURN d`,
            {
                estudianteId,
                direccion: Direccion,
                municipio: Municipio,
                departamento: Departamento,
                verificada: Verificada,
                desdeFecha: Desde_Fecha,
                tipoResidencia: Tipo_Residencia
            }
        )

        const direccion = result.records[0].get('d').properties

        res.status(200).json({
            success: true,
            message: 'Dirección vinculada exitosamente',
            data: direccion
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.mergeReferencia = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre, Telefono, Relacion, Verificada,
            Tipo_Aval } = req.body
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       MERGE (r:Persona:Referencia {Telefono: $telefono})
       ON CREATE SET
         r.ID = randomUUID(),
         r.Nombre = $nombre,
         r.Relacion = $relacion,
         r.Verificada = toBoolean($verificada),
         r.Fecha_Registro = date(),
         r.Veces_Usada = 1
       ON MATCH SET
         r.Veces_Usada = r.Veces_Usada + 1
       MERGE (e)-[rel:AVALADO_POR]->(r)
       ON CREATE SET
         rel.Fecha_Registro = date(),
         rel.Tipo_Aval = $tipoAval,
         rel.Verificado = false
       RETURN r`,
            {
                estudianteId,
                nombre: Nombre,
                telefono: Telefono,
                relacion: Relacion,
                verificada: Verificada,
                tipoAval: Tipo_Aval
            }
        )

        const referencia = result.records[0].get('r').properties

        res.status(200).json({
            success: true,
            message: 'Referencia vinculada exitosamente',
            data: referencia
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.verPerfil = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})
       RETURN e`,
            { estudianteId }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            })
        }

        const estudiante = result.records[0].get('e').properties

        res.status(200).json({
            success: true,
            data: estudiante
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.verSolicitudes = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
        const { Estado } = req.query  // filtro opcional

        let query = `
      MATCH (e:Estudiante {ID: $estudianteId})-[:ENVIA]->(s:Solicitud)
    `

        if (Estado) {
            query += ` WHERE s.Estado = $estado`
        }

        query += ` RETURN s ORDER BY s.Fecha_Envio DESC`

        const result = await session.run(query, { estudianteId, estado: Estado })
        const solicitudes = result.records.map(r => r.get('s').properties)

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

exports.verDocumentos = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
        const { Es_Valido } = req.query

        let query = `
      MATCH (e:Estudiante {ID: $estudianteId})-[:ENVIA]->(s:Solicitud)-[:ADJUNTA]->(d:Documento)
    `

        if (Es_Valido !== undefined) {
            query += ` WHERE d.Es_Valido = toBoolean($esValido)`
        }

        query += ` RETURN d ORDER BY d.Fecha_Carga DESC`

        const result = await session.run(query, {
            estudianteId,
            esValido: Es_Valido
        })

        const documentos = result.records.map(r => r.get('d').properties)

        res.status(200).json({
            success: true,
            data: documentos
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarCuentas = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
                const result = await session.run(
                        `MATCH (e:Estudiante {ID: $estudianteId})-[r:USA_CUENTA]->(c:Cuenta)
             RETURN {
                 ID: c.ID,
                 Banco: c.Banco,
                 Tipo_Cuenta: c.Tipo_Cuenta,
                 Terminacion: c.Terminacion,
                 Activa: c.Activa,
                 Fecha_Registro: c.Fecha_Registro,
                 Principal: r.Principal,
                 Verificada: r.Verificada
             } AS cuenta
             ORDER BY c.Fecha_Registro DESC`,
                        { estudianteId }
                )
                const cuentas = result.records.map(r => r.get('cuenta'))
        res.status(200).json({ success: true, data: cuentas })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarDirecciones = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
                const result = await session.run(
                        `MATCH (e:Estudiante {ID: $estudianteId})-[r:VIVE_EN]->(d:Direccion)
             RETURN {
                 ID: d.ID,
                 Direccion: d.Direccion,
                 Municipio: d.Municipio,
                 Departamento: d.Departamento,
                 Verificada: d.Verificada,
                 Fecha_Actualizacion: d.Fecha_Actualizacion,
                 Desde_Fecha: r.Desde_Fecha,
                 Tipo_Residencia: r.Tipo_Residencia
             } AS direccion
             ORDER BY d.Fecha_Actualizacion DESC`,
                        { estudianteId }
                )
                const direcciones = result.records.map(r => r.get('direccion'))
        res.status(200).json({ success: true, data: direcciones })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarInstituciones = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
                const result = await session.run(
                        `MATCH (e:Estudiante {ID: $estudianteId})-[r:ESTUDIA_EN]->(i:Institucion)
             RETURN {
                 ID: i.ID,
                 Nombre: i.Nombre,
                 Tipo: i.Tipo,
                 Departamento: i.Departamento,
                 Publica: i.Publica,
                 Fecha_Convenio: i.Fecha_Convenio,
                 Desde_Fecha: r.Desde_Fecha,
                 Carrera: r.Carrera,
                 Estado_Academico: r.Estado_Academico
             } AS institucion
             ORDER BY i.Fecha_Convenio DESC`,
                        { estudianteId }
                )
                const instituciones = result.records.map(r => r.get('institucion'))
        res.status(200).json({ success: true, data: instituciones })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarDispositivos = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
                const result = await session.run(
                        `MATCH (e:Estudiante {ID: $estudianteId})-[r:USA_DISPOSITIVO]->(d:Dispositivo)
             RETURN {
                 ID: d.ID,
                 Navegador: d.Navegador,
                 Sistema_Operativo: d.Sistema_Operativo,
                 Activo: d.Activo,
                 Fecha_Registro: d.Fecha_Registro,
                 Ultimo_Uso: r.Ultimo_Uso,
                 Veces_Usado: r.Veces_Usado
             } AS dispositivo
             ORDER BY d.Fecha_Registro DESC`,
                        { estudianteId }
                )
                const dispositivos = result.records.map(r => r.get('dispositivo'))
        res.status(200).json({ success: true, data: dispositivos })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarReferencias = async (req, res) => {
    const session = driver.session()
    try {
        const estudianteId = req.usuario.id
                const result = await session.run(
                        `MATCH (e:Estudiante {ID: $estudianteId})-[rel:AVALADO_POR]->(r:Referencia)
             RETURN {
                 ID: r.ID,
                 Nombre: r.Nombre,
                 Telefono: r.Telefono,
                 Relacion: r.Relacion,
                 Verificada: r.Verificada,
                 Fecha_Registro: r.Fecha_Registro,
                 Tipo_Aval: rel.Tipo_Aval
             } AS referencia
             ORDER BY r.Fecha_Registro DESC`,
                        { estudianteId }
                )
                const referencias = result.records.map(r => r.get('referencia'))
        res.status(200).json({ success: true, data: referencias })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.listarBecas = async (req, res) => {
    const session = driver.session()
    try {
        const result = await session.run(
            `MATCH (b:Beca)
       RETURN b ORDER BY b.Nombre_Beca ASC`
        )
        const becas = result.records.map(r => r.get('b').properties)
        res.status(200).json({ success: true, data: becas })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarCuenta = async (req, res) => {
    const session = driver.session()
    try {
        const { cuentaId } = req.params
        const estudianteId = req.usuario.id
        const { Banco, Tipo_Cuenta, Terminacion, Activa, Fecha_Registro, Principal, Verificada } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[r:USA_CUENTA]->(c:Cuenta {ID: $cuentaId})
       SET c.Banco = $banco,
           c.Tipo_Cuenta = $tipoCuenta,
           c.Terminacion = toInteger($terminacion),
           c.Activa = toBoolean($activa),
           c.Fecha_Registro = date($fechaRegistro),
           r.Fecha_Registro = date($fechaRegistro),
           r.Principal = toBoolean($principal),
           r.Verificada = toBoolean($verificada)
       RETURN c`,
            {
                estudianteId,
                cuentaId,
                banco: Banco,
                tipoCuenta: Tipo_Cuenta,
                terminacion: Terminacion,
                activa: Activa,
                fechaRegistro: Fecha_Registro,
                principal: Principal,
                verificada: Verificada
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' })
        }

        res.status(200).json({ success: true, message: 'Cuenta actualizada', data: result.records[0].get('c').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarDireccion = async (req, res) => {
    const session = driver.session()
    try {
        const { direccionId } = req.params
        const estudianteId = req.usuario.id
        const { Direccion, Municipio, Departamento, Verificada, Desde_Fecha, Tipo_Residencia } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[r:VIVE_EN]->(d:Direccion {ID: $direccionId})
       SET d.Direccion = $direccion,
           d.Municipio = $municipio,
           d.Departamento = $departamento,
           d.Verificada = toBoolean($verificada),
           d.Fecha_Actualizacion = date(),
           r.Desde_Fecha = date($desdeFecha),
           r.Verificada = toBoolean($verificada),
           r.Tipo_Residencia = $tipoResidencia
       RETURN d`,
            {
                estudianteId,
                direccionId,
                direccion: Direccion,
                municipio: Municipio,
                departamento: Departamento,
                verificada: Verificada,
                desdeFecha: Desde_Fecha,
                tipoResidencia: Tipo_Residencia
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Direccion no encontrada' })
        }

        res.status(200).json({ success: true, message: 'Direccion actualizada', data: result.records[0].get('d').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarInstitucion = async (req, res) => {
    const session = driver.session()
    try {
        const { institucionId } = req.params
        const estudianteId = req.usuario.id
        const { Nombre, Tipo, Departamento, Publica, Fecha_Convenio, Desde_Fecha, Carrera, Estado_Academico } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[r:ESTUDIA_EN]->(i:Institucion {ID: $institucionId})
       SET i.Nombre = $nombre,
           i.Tipo = $tipo,
           i.Departamento = $departamento,
           i.Publica = toBoolean($publica),
           i.Fecha_Convenio = date($fechaConvenio),
           r.Desde_Fecha = date($desdeFecha),
           r.Carrera = $carrera,
           r.Estado_Academico = $estadoAcademico
       RETURN i`,
            {
                estudianteId,
                institucionId,
                nombre: Nombre,
                tipo: Tipo,
                departamento: Departamento,
                publica: Publica,
                fechaConvenio: Fecha_Convenio,
                desdeFecha: Desde_Fecha,
                carrera: Carrera,
                estadoAcademico: Estado_Academico
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Institucion no encontrada' })
        }

        res.status(200).json({ success: true, message: 'Institucion actualizada', data: result.records[0].get('i').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarDispositivo = async (req, res) => {
    const session = driver.session()
    try {
        const { dispositivoId } = req.params
        const estudianteId = req.usuario.id
        const { Navegador, Sistema_Operativo } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[r:USA_DISPOSITIVO]->(d:Dispositivo {ID: $dispositivoId})
       SET d.Navegador = $navegador,
           d.Sistema_Operativo = $sistemaOp,
           r.Ultimo_Uso = date()
       RETURN d`,
            {
                estudianteId,
                dispositivoId,
                navegador: Navegador,
                sistemaOp: Sistema_Operativo
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Dispositivo no encontrado' })
        }

        res.status(200).json({ success: true, message: 'Dispositivo actualizado', data: result.records[0].get('d').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarReferencia = async (req, res) => {
    const session = driver.session()
    try {
        const { referenciaId } = req.params
        const estudianteId = req.usuario.id
        const { Nombre, Telefono, Relacion, Verificada, Tipo_Aval } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[rel:AVALADO_POR]->(r:Referencia {ID: $referenciaId})
       SET r.Nombre = $nombre,
           r.Telefono = $telefono,
           r.Relacion = $relacion,
           r.Verificada = toBoolean($verificada),
           r.Fecha_Registro = date(),
           rel.Tipo_Aval = $tipoAval
       RETURN r`,
            {
                estudianteId,
                referenciaId,
                nombre: Nombre,
                telefono: Telefono,
                relacion: Relacion,
                verificada: Verificada,
                tipoAval: Tipo_Aval
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Referencia no encontrada' })
        }

        res.status(200).json({ success: true, message: 'Referencia actualizada', data: result.records[0].get('r').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

exports.actualizarDocumento = async (req, res) => {
    const session = driver.session()
    try {
        const { documentoId } = req.params
        const estudianteId = req.usuario.id
        const { Tipo, Hash, Palabras_Clave } = req.body

        const result = await session.run(
            `MATCH (e:Estudiante {ID: $estudianteId})-[:ENVIA]->(:Solicitud)-[:ADJUNTA]->(d:Documento {ID: $documentoId})
       SET d.Tipo = $tipo,
           d.Hash = $hash,
           d.Palabras_Clave = $palabrasClave,
           d.Tamaño_KB = toFloat(size($hash))
       RETURN d`,
            {
                estudianteId,
                documentoId,
                tipo: Tipo,
                hash: Hash,
                palabrasClave: Palabras_Clave
            }
        )

        if (result.records.length === 0) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado' })
        }

        res.status(200).json({ success: true, message: 'Documento actualizado', data: result.records[0].get('d').properties })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}