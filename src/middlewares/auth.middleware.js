const jwt = require('jsonwebtoken')

// Verifica que el token existe y es válido
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay token — acceso denegado'
        })
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.usuario = payload // guarda el payload para usarlo después
        next()
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        })
    }
}

// Verifica que el rol sea el correcto
const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para acceder a esta ruta'
        })
    }
    next()
}

const soloRevisor = (req, res, next) => {
    if (req.usuario.rol !== 'revisor') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para acceder a esta ruta'
        })
    }
    next()
}

const soloEstudiante = (req, res, next) => {
    if (req.usuario.rol !== 'estudiante') {
        return res.status(403).json({
            success: false,
            message: 'No tienes permiso para acceder a esta ruta'
        })
    }
    next()
}

module.exports = { verificarToken, soloAdmin, soloRevisor, soloEstudiante }