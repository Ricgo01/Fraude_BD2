// src/controllers/auth.controller.js
require('dotenv').config()
const jwt = require('jsonwebtoken')
const driver = require('../services/neo4j.service')

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Determina el rol según las labels del nodo
const determinarRol = (labels) => {
    if (labels.includes('Admin')) return 'admin'
    if (labels.includes('Revisor')) return 'revisor'
    if (labels.includes('Estudiante')) return 'estudiante'
    return null
}

// Genera el JWT con el payload del usuario
const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    )
}

// ─── Registro ─────────────────────────────────────────────────────────────────

exports.registro = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre_Completo, Email, Fecha_Nacimiento, Promedio, Rol } = req.body

        // Validar que el rol sea válido
        if (!['estudiante', 'revisor'].includes(Rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido — solo estudiante o revisor'
            })
        }

        // Verificar que el email no existe
        const existe = await session.run(
            `MATCH (n) WHERE n.Email = $email RETURN n LIMIT 1`,
            { email: Email }
        )

        if (existe.records.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            })
        }

        // Determinar labels según el rol
        const labels = Rol === 'estudiante'
            ? 'Persona:Estudiante'
            : 'Persona:Revisor'

        // Crear el nodo
        const result = await session.run(
            `CREATE (n:${labels} {
        ID: randomUUID(),
        Nombre_Completo: $nombre,
        Email: $email,
        Fecha_Nacimiento: date($fechaNacimiento),
        Promedio: toFloat($promedio),
        Activo: true,
        Fecha_Registro: date()
      }) RETURN n, labels(n) AS labels`,
            {
                nombre: Nombre_Completo,
                email: Email,
                fechaNacimiento: Fecha_Nacimiento,
                promedio: Promedio
            }
        )

        const nodo = result.records[0].get('n').properties
        const etiquetas = result.records[0].get('labels')
        const rol = determinarRol(etiquetas)
        const token = generarToken({ id: nodo.ID, rol, nombre: nodo.Nombre_Completo })

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: nodo.ID,
                nombre: nodo.Nombre_Completo,
                email: nodo.Email,
                rol
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

// ─── Login ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
    const session = driver.session()
    try {
        const { Email } = req.body

        if (!Email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            })
        }

        // Buscar el usuario por email
        const result = await session.run(
            `MATCH (n) WHERE n.Email = $email RETURN n, labels(n) AS labels LIMIT 1`,
            { email: Email }
        )

        if (result.records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        const nodo = result.records[0].get('n').properties
        const etiquetas = result.records[0].get('labels')
        const rol = determinarRol(etiquetas)

        if (!rol) {
            return res.status(403).json({
                success: false,
                message: 'Usuario sin rol definido'
            })
        }

        const token = generarToken({ id: nodo.ID, rol, nombre: nodo.Nombre_Completo })

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            token,
            usuario: {
                id: nodo.ID,
                nombre: nodo.Nombre_Completo,
                email: nodo.Email,
                rol
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

// ─── Crear usuario (solo Admin) ───────────────────────────────────────────────

exports.crear = async (req, res) => {
    const session = driver.session()
    try {
        const { Nombre_Completo, Email, Fecha_Nacimiento, Promedio, Rol } = req.body

        const rolesValidos = ['estudiante', 'revisor', 'admin']
        if (!rolesValidos.includes(Rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            })
        }

        // Verificar email único
        const existe = await session.run(
            `MATCH (n) WHERE n.Email = $email RETURN n LIMIT 1`,
            { email: Email }
        )

        if (existe.records.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            })
        }

        const labelsMap = {
            estudiante: 'Persona:Estudiante',
            revisor: 'Persona:Revisor',
            admin: 'Admin'
        }

        const result = await session.run(
            `CREATE (n:${labelsMap[Rol]} {
        ID: randomUUID(),
        Nombre_Completo: $nombre,
        Email: $email,
        Fecha_Nacimiento: date($fechaNacimiento),
        Promedio: toFloat($promedio),
        Activo: true,
        Fecha_Registro: date()
      }) RETURN n`,
            {
                nombre: Nombre_Completo,
                email: Email,
                fechaNacimiento: Fecha_Nacimiento,
                promedio: Promedio || 0
            }
        )

        const nodo = result.records[0].get('n').properties

        res.status(201).json({
            success: true,
            message: `Usuario ${Rol} creado exitosamente`,
            usuario: { id: nodo.ID, nombre: nodo.Nombre_Completo, email: nodo.Email, rol: Rol }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}