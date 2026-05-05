// src/controllers/comunidades.controller.js
const driver = require('../services/neo4j.service')

/**
 * POST /admin/comunidades/ejecutar
 * Corre el algoritmo de detección de comunidades (Louvain manual)
 * Asigna propiedades comunidad y score_sospecha a cada Estudiante
 */
exports.ejecutarLouvain = async (req, res) => {
    const session = driver.session()
    try {

        // Paso 1: Inicializar — cada estudiante es su propia comunidad
        await session.run(`
      MATCH (e:Estudiante)
      SET e.comunidad = e.ID
    `)

        // Paso 2: Iterar 5 veces propagando la comunidad mínima
        let actualizados = 1
        let iteraciones = 0
        while (actualizados > 0 && iteraciones < 5) {
            const iter = await session.run(`
        MATCH (e:Estudiante)
        OPTIONAL MATCH (e)-[:USA_CUENTA|USA_DISPOSITIVO|VIVE_EN|AVALADO_POR]->(recurso)
                      <-[:USA_CUENTA|USA_DISPOSITIVO|VIVE_EN|AVALADO_POR]-(otro:Estudiante)
        WHERE e <> otro
        WITH e, min(otro.comunidad) AS comunidad_min
        WHERE comunidad_min IS NOT NULL AND comunidad_min < e.comunidad
        SET e.comunidad = comunidad_min
        RETURN count(e) AS actualizados
      `)
            actualizados = iter.records[0]?.get('actualizados').toNumber() ?? 0
            iteraciones++
        }

        // Paso 3: Calcular score de sospecha ponderado por tipo de recurso
        // Cuenta compartida = 3.0 (más grave)
        // Dispositivo compartido = 2.0
        // Dirección compartida = 1.5
        // Referencia compartida = 1.0
        await session.run(`
      MATCH (e:Estudiante)
      OPTIONAL MATCH (e)-[:USA_CUENTA]->(c:Cuenta)<-[:USA_CUENTA]-(o1:Estudiante)
      WHERE e <> o1
      WITH e, count(DISTINCT o1) AS comparten_cuenta

      OPTIONAL MATCH (e)-[:USA_DISPOSITIVO]->(d:Dispositivo)<-[:USA_DISPOSITIVO]-(o2:Estudiante)
      WHERE e <> o2
      WITH e, comparten_cuenta, count(DISTINCT o2) AS comparten_dispositivo

      OPTIONAL MATCH (e)-[:VIVE_EN]->(dir:Direccion)<-[:VIVE_EN]-(o3:Estudiante)
      WHERE e <> o3
      WITH e, comparten_cuenta, comparten_dispositivo, count(DISTINCT o3) AS comparten_direccion

      OPTIONAL MATCH (e)-[:AVALADO_POR]->(r:Referencia)<-[:AVALADO_POR]-(o4:Estudiante)
      WHERE e <> o4
      WITH e, comparten_cuenta, comparten_dispositivo, comparten_direccion, count(DISTINCT o4) AS comparten_referencia

      SET e.score_sospecha = (comparten_cuenta * 3.0) +
                             (comparten_dispositivo * 2.0) +
                             (comparten_direccion * 1.5) +
                             (comparten_referencia * 1.0)
    `)

        // Paso 4: Obtener comunidades con 2+ estudiantes
        const resultComunidades = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.comunidad IS NOT NULL
      WITH e.comunidad AS comunidad,
           collect(e.Nombre_Completo) AS estudiantes,
           count(*) AS total,
           round(max(e.score_sospecha) * 100) / 100.0 AS max_score
      WHERE total >= 2
      RETURN comunidad, total, estudiantes, max_score
      ORDER BY total DESC
      LIMIT 20
    `)

        const comunidades = resultComunidades.records.map(r => ({
            comunidad_id: r.get('comunidad'),
            total_estudiantes: r.get('total').toNumber ? r.get('total').toNumber() : r.get('total'),
            estudiantes: r.get('estudiantes'),
            score_maximo: r.get('max_score')
        }))

        // Paso 5: Top 10 estudiantes más sospechosos
        const resultTop = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.score_sospecha > 0

      OPTIONAL MATCH (e)-[:USA_CUENTA]->(c:Cuenta)<-[:USA_CUENTA]-(o1:Estudiante) WHERE e <> o1
      WITH e, count(DISTINCT o1) AS cc
      OPTIONAL MATCH (e)-[:USA_DISPOSITIVO]->(d:Dispositivo)<-[:USA_DISPOSITIVO]-(o2:Estudiante) WHERE e <> o2
      WITH e, cc, count(DISTINCT o2) AS cd
      OPTIONAL MATCH (e)-[:VIVE_EN]->(dir:Direccion)<-[:VIVE_EN]-(o3:Estudiante) WHERE e <> o3
      WITH e, cc, cd, count(DISTINCT o3) AS cdir
      OPTIONAL MATCH (e)-[:AVALADO_POR]->(ref:Referencia)<-[:AVALADO_POR]-(o4:Estudiante) WHERE e <> o4
      WITH e, cc, cd, cdir, count(DISTINCT o4) AS cref

      RETURN e.Nombre_Completo AS nombre,
             e.Email AS email,
             round(e.score_sospecha * 100) / 100.0 AS score,
             cc AS comparte_cuenta,
             cd AS comparte_dispositivo,
             cdir AS comparte_direccion,
             cref AS comparte_referencia
      ORDER BY score DESC
      LIMIT 10
    `)

        const topSospechosos = resultTop.records.map(r => ({
            nombre: r.get('nombre'),
            email: r.get('email'),
            score: r.get('score'),
            comparte_cuenta: r.get('comparte_cuenta').toNumber ? r.get('comparte_cuenta').toNumber() : r.get('comparte_cuenta'),
            comparte_dispositivo: r.get('comparte_dispositivo').toNumber ? r.get('comparte_dispositivo').toNumber() : r.get('comparte_dispositivo'),
            comparte_direccion: r.get('comparte_direccion').toNumber ? r.get('comparte_direccion').toNumber() : r.get('comparte_direccion'),
            comparte_referencia: r.get('comparte_referencia').toNumber ? r.get('comparte_referencia').toNumber() : r.get('comparte_referencia')
        }))

        res.status(200).json({
            success: true,
            message: `Análisis completado. Se detectaron ${comunidades.length} comunidades sospechosas en ${iteraciones} iteraciones.`,
            data: {
                iteraciones_realizadas: iteraciones,
                total_comunidades_sospechosas: comunidades.length,
                comunidades,
                top_sospechosos: topSospechosos
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

/**
 * GET /admin/comunidades/resultados
 * Devuelve los resultados del último análisis ejecutado
 * (sin volver a correr el algoritmo)
 */
exports.verResultados = async (req, res) => {
    const session = driver.session()
    try {

        // Verificar si ya se ejecutó el algoritmo
        const verificar = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.comunidad IS NOT NULL
      RETURN count(e) AS total
    `)
        const total = verificar.records[0]?.get('total').toNumber() ?? 0

        if (total === 0) {
            return res.status(200).json({
                success: true,
                message: 'El algoritmo aún no ha sido ejecutado.',
                data: {
                    ejecutado: false,
                    comunidades: [],
                    top_sospechosos: []
                }
            })
        }

        // Comunidades
        const resultComunidades = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.comunidad IS NOT NULL
      WITH e.comunidad AS comunidad,
           collect(e.Nombre_Completo) AS estudiantes,
           count(*) AS total,
           round(max(e.score_sospecha) * 100) / 100.0 AS max_score
      WHERE total >= 2
      RETURN comunidad, total, estudiantes, max_score
      ORDER BY total DESC
      LIMIT 20
    `)

        const comunidades = resultComunidades.records.map(r => ({
            comunidad_id: r.get('comunidad'),
            total_estudiantes: r.get('total').toNumber ? r.get('total').toNumber() : r.get('total'),
            estudiantes: r.get('estudiantes'),
            score_maximo: r.get('max_score')
        }))

        // Top 10 con campos de comparte completos
        const resultTop = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.score_sospecha > 0

      OPTIONAL MATCH (e)-[:USA_CUENTA]->(c:Cuenta)<-[:USA_CUENTA]-(o1:Estudiante) WHERE e <> o1
      WITH e, count(DISTINCT o1) AS cc
      OPTIONAL MATCH (e)-[:USA_DISPOSITIVO]->(d:Dispositivo)<-[:USA_DISPOSITIVO]-(o2:Estudiante) WHERE e <> o2
      WITH e, cc, count(DISTINCT o2) AS cd
      OPTIONAL MATCH (e)-[:VIVE_EN]->(dir:Direccion)<-[:VIVE_EN]-(o3:Estudiante) WHERE e <> o3
      WITH e, cc, cd, count(DISTINCT o3) AS cdir
      OPTIONAL MATCH (e)-[:AVALADO_POR]->(ref:Referencia)<-[:AVALADO_POR]-(o4:Estudiante) WHERE e <> o4
      WITH e, cc, cd, cdir, count(DISTINCT o4) AS cref

      RETURN e.Nombre_Completo AS nombre,
             e.Email AS email,
             round(e.score_sospecha * 100) / 100.0 AS score,
             cc AS comparte_cuenta,
             cd AS comparte_dispositivo,
             cdir AS comparte_direccion,
             cref AS comparte_referencia
      ORDER BY score DESC
      LIMIT 10
    `)

        const topSospechosos = resultTop.records.map(r => ({
            nombre: r.get('nombre'),
            email: r.get('email'),
            score: r.get('score'),
            comparte_cuenta: r.get('comparte_cuenta').toNumber ? r.get('comparte_cuenta').toNumber() : r.get('comparte_cuenta'),
            comparte_dispositivo: r.get('comparte_dispositivo').toNumber ? r.get('comparte_dispositivo').toNumber() : r.get('comparte_dispositivo'),
            comparte_direccion: r.get('comparte_direccion').toNumber ? r.get('comparte_direccion').toNumber() : r.get('comparte_direccion'),
            comparte_referencia: r.get('comparte_referencia').toNumber ? r.get('comparte_referencia').toNumber() : r.get('comparte_referencia')
        }))

        res.status(200).json({
            success: true,
            data: {
                ejecutado: true,
                total_comunidades_sospechosas: comunidades.length,
                comunidades,
                top_sospechosos: topSospechosos
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}

/**
 * DELETE /admin/comunidades/limpiar
 * Elimina las propiedades comunidad y score_sospecha de todos los estudiantes
 * Útil para demos — permite volver a ejecutar el algoritmo desde cero
 */
exports.limpiarComunidades = async (req, res) => {
    const session = driver.session()
    try {

        const result = await session.run(`
      MATCH (e:Estudiante)
      WHERE e.comunidad IS NOT NULL OR e.score_sospecha IS NOT NULL
      REMOVE e.comunidad, e.score_sospecha
      RETURN count(e) AS estudiantes_limpiados
    `)

        const total = result.records[0]?.get('estudiantes_limpiados').toNumber() ?? 0

        res.status(200).json({
            success: true,
            message: `Se limpiaron ${total} estudiantes. El análisis puede ejecutarse nuevamente.`,
            data: { estudiantes_limpiados: total }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    } finally {
        await session.close()
    }
}