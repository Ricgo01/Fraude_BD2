document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth('revisor')) return
    cargarDetalle()
})

async function cargarDetalle() {
    const message = document.getElementById('message')
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()

    if (!solicitudId) {
        message.innerHTML = '<div class="alert alert-error">Solicitud no valida.</div>'
        return
    }

    try {
        const response = await apiGet(`/revisor/solicitud/${solicitudId}`)
        const data = response.data

        document.getElementById('solicitud-id-header').textContent = data.solicitud_id

        // Renderizar Banderas Rojas si hay alertas
        const banner = document.getElementById('banner-alertas')
        if (data.alertas && data.alertas.length > 0) {
            const nivelMaximo = data.alertas.some(a => (a.nivel_riesgo || '').toLowerCase() === 'critico') 
                ? 'CRÍTICO' : 'ALTO';
            const resuelta = data.alertas.every(a => a.resuelta)
            if(!resuelta) {
                banner.style.display = 'block'
                banner.innerHTML = `ATENCIÓN: Esta solicitud tiene ${data.alertas.length} alertas de fraude activas - Nivel ${nivelMaximo}.`
            }
        } else {
            banner.style.display = 'none'
        }

        // Datos
        document.getElementById('detalle-estudiante').innerHTML = `
            <p><strong>Nombre:</strong> ${data.estudiante?.nombre || '-'}<br>
            <strong>Promedio:</strong> ${data.estudiante?.promedio || 0}<br>
            <strong>Email:</strong> ${data.estudiante?.email || data.estudiante?.Email || '-'}</p>
        `

        document.getElementById('detalle-beca').innerHTML = `
            <p><strong>Nombre:</strong> ${data.beca?.nombre || '-'}<br>
            <strong>Categoría:</strong> ${data.beca?.categoria || '-'}<br>
            <strong>Monto Máx:</strong> ${formatMoney(data.beca?.monto_max)}</p>
        `

        document.getElementById('detalle-solicitud').innerHTML = `
            <p><strong>Monto Solicitado:</strong> ${formatMoney(data.monto_solicitado)}<br>
            <strong>Estado:</strong> ${statusBadge(data.estado)}<br>
            <strong>Fecha Envio:</strong> ${formatNeoDate(data.fecha_envio)}<br>
            <strong>Motivo:</strong> ${data.motivo_apoyo || data.motivo || '-'}</p>
        `

        // Sección de veredicto dinámica (Prioridad 3: reglas de modificación)
        const veredictoDiv = document.getElementById('seccion-veredicto')
        const yaResuelta = ['Aprobada', 'Rechazada'].includes(data.estado)
        if (yaResuelta) {
            veredictoDiv.innerHTML = `
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; text-align: center;">
                    <p style="font-weight: bold; color: #166534; font-size: 1.1em;">
                        ${data.estado === 'Aprobada' ? '✅' : '❌'} Esta solicitud ya fue ${data.estado.toLowerCase()}.
                    </p>
                    <p style="color: #374151; font-size: 0.9em; margin-top: 5px;">
                        No se puede modificar la decisión. Aún puedes agregar una nota de post-revisión.
                    </p>
                </div>`
        } else {
            veredictoDiv.innerHTML = `
                <div style="display: flex; gap: 10px; flex-direction: column;">
                    <button class="btn btn-primary" style="background-color: #10b981; font-size: 1.2em; padding: 15px;" onclick="resolverSolicitud('Aprobada')">✓ APROBAR</button>
                    <button class="btn btn-primary" style="background-color: #ef4444; font-size: 1.2em; padding: 15px;" onclick="resolverSolicitud('Rechazada')">✗ RECHAZAR</button>
                </div>`
        }

        // Documentos con checkboxes
        const docsContainer = document.getElementById('documentos-container')
        if (!data.documentos || data.documentos.length === 0) {
            docsContainer.innerHTML = '<p>No hay documentos adjuntos.</p>'
        } else {
            docsContainer.innerHTML = data.documentos.map((doc) => {
                const checkedValid = doc.es_valido === true ? 'checked' : ''
                const checkedInvalid = doc.es_valido === false ? 'checked' : ''
                return `
                <div style="border: 1px solid #e5e7eb; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                    <strong>${doc.tipo || 'Documento'}</strong> (ID: ${doc.id})
                    <div style="margin-top: 10px; display: flex; gap: 15px;">
                        <label><input type="radio" name="doc_${doc.id}" value="valido" ${checkedValid}> Válido</label>
                        <label><input type="radio" name="doc_${doc.id}" value="invalido" ${checkedInvalid}> Inválido</label>
                    </div>
                </div>
                `
            }).join('')
        }

        // Dejar guardado el array de ids para usarlo despues
        window.documentosActuales = data.documentos || []

    } catch (error) {
        message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
    }
}

async function marcarDocumentos() {
    const docs = window.documentosActuales || []
    let errores = 0

    for (const doc of docs) {
        const radios = document.getElementsByName(`doc_${doc.id}`)
        let valorSeleccionado = null
        for (const radio of radios) {
            if (radio.checked) valorSeleccionado = radio.value
        }

        if (valorSeleccionado) {
            try {
                const estadoRevision = valorSeleccionado === 'valido' ? 'aprobado' : 'rechazado'
                await apiPatch('/revisor/documentos/revisar', {
                    documentoIds: [doc.id],
                    Estado_Revision: estadoRevision
                })
            } catch (err) {
                errores++
                console.error(err)
            }
        }
    }

    if (errores > 0) {
        mostrarToast('Hubo errores al guardar la revisión de documentos', 'error')
    } else {
        mostrarToast('Revisión de documentos guardada', 'success')
        cargarDetalle()
    }
}

async function guardarNotaRevision() {
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()
    const nota = document.getElementById('nota-veredicto').value.trim()

    if (!nota) {
        mostrarToast('Escribe una nota primero.', 'error')
        return
    }

    try {
        await apiPatch(`/revisor/solicitud/${solicitudId}/nota`, { Nota: nota })
        mostrarToast('Nota agregada a la solicitud.', 'success')
    } catch (error) {
        mostrarToast(error.message, 'error')
    }
}

async function resolverSolicitud(decision) {
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()
    const nota = document.getElementById('nota-veredicto').value.trim()

    if (!nota && decision === 'Rechazada') {
        mostrarToast('Debes agregar una justificación para rechazar.', 'error')
        return
    }

    try {
        await apiPut(`/revisor/solicitud/${solicitudId}/resolver`, {
            Decision: decision,
            Nota: nota || decision
        })
        mostrarToast(`Solicitud ${decision}`, 'success')
        
        setTimeout(() => {
            window.location.href = '/revisor/dashboard'
        }, 1500)
    } catch (error) {
        mostrarToast(error.message, 'error')
    }
}
