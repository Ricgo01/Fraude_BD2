const validarEstudiante = (req, res, next) => {
    const { Nombre_Completo, Fecha_Nacimiento, Promedio } = req.body

    // Validar nombre — solo letras y espacios
    if (!Nombre_Completo || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(Nombre_Completo)) {
        return res.status(400).json({
            success: false,
            message: 'Nombre inválido — solo se permiten letras y espacios'
        })
    }

    // Validar fecha
    if (!Fecha_Nacimiento || isNaN(Date.parse(Fecha_Nacimiento))) {
        return res.status(400).json({
            success: false,
            message: 'Fecha de nacimiento inválida — usa el formato YYYY-MM-DD'
        })
    }

    // Validar promedio
    if (Promedio === undefined || isNaN(parseFloat(Promedio))) {
        return res.status(400).json({
            success: false,
            message: 'Promedio inválido — debe ser un número'
        })
    }

    next() // Todo válido — pasa al controlador
}

module.exports = { validarEstudiante }