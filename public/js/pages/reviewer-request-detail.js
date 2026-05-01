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

        document.getElementById('solicitud-id').textContent = data.solicitud_id
        document.getElementById('solicitud-estado').innerHTML = statusBadge(data.estado)
        document.getElementById('solicitud-monto').textContent = formatMoney(data.monto_solicitado)
        document.getElementById('solicitud-fecha').textContent = data.fecha_envio || '-'

        document.getElementById('detalle-estudiante').innerHTML = `
            <h3>Estudiante</h3>
            <p><strong>Nombre:</strong> ${data.estudiante?.nombre || '-'}<br>
            <strong>Promedio:</strong> ${data.estudiante?.promedio || 0}<br>
            <strong>Activo:</strong> ${data.estudiante?.activo ? 'Si' : 'No'}</p>
        `

        document.getElementById('detalle-beca').innerHTML = `
            <h3>Beca</h3>
            <p><strong>Nombre:</strong> ${data.beca?.nombre || '-'}<br>
            <strong>Categoria:</strong> ${data.beca?.categoria || '-'}<br>
            <strong>Monto max:</strong> ${formatMoney(data.beca?.monto_max)}</p>
        `

        renderDocumentos(data.documentos || [])
        renderAlertas(data.alertas || [])
    } catch (error) {
        message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
    }
}

function renderDocumentos(documentos) {
    const tbody = document.getElementById('documentos-table')

    if (!documentos.length) {
        tbody.innerHTML = '<tr><td colspan="5">No hay documentos.</td></tr>'
        return
    }

    tbody.innerHTML = documentos.map((doc) => {
        const estado = doc.es_valido === true
            ? 'aprobado'
            : doc.es_valido === false
                ? 'rechazado'
                : 'pendiente'

        return `
        <tr>
            <td>${doc.id || '-'}</td>
            <td>${doc.tipo || '-'}</td>
            <td>${doc.es_valido === true ? 'Si' : doc.es_valido === false ? 'No' : '-'}</td>
            <td>${estado}</td>
            <td>
                <button class="btn btn-secondary" onclick="revisarDocumento('${doc.id}', 'aprobado')">Aprobar</button>
                <button class="btn btn-warning" onclick="revisarDocumento('${doc.id}', 'rechazado')">Rechazar</button>
                <button class="btn btn-danger" onclick="eliminarDocumento('${doc.id}')">Eliminar</button>
            </td>
        </tr>
    `
    }).join('')
}

function renderAlertas(alertas) {
    const tbody = document.getElementById('alertas-table')

    if (!alertas.length) {
        tbody.innerHTML = '<tr><td colspan="4">No hay alertas.</td></tr>'
        return
    }

    tbody.innerHTML = alertas.map((alerta) => `
        <tr>
            <td>${alerta.id || '-'}</td>
            <td>${alerta.tipo || '-'}</td>
            <td>${riskBadge(alerta.nivel_riesgo)}</td>
            <td>${alerta.resuelta ? 'Si' : 'No'}</td>
        </tr>
    `).join('')
}

async function revisarDocumento(documentoId, estado) {
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()
    try {
        await apiPatch('/revisor/documentos/revisar', {
            documentoIds: [documentoId],
            Estado_Revision: estado
        })
        cargarDetalle()
    } catch (error) {
        showInlineError(error.message)
    }
}

async function eliminarDocumento(documentoId) {
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()
    try {
        await apiDelete(`/revisor/solicitud/${solicitudId}/documento/${documentoId}`)
        cargarDetalle()
    } catch (error) {
        showInlineError(error.message)
    }
}

async function resolverSolicitud() {
    const solicitudId = window.solicitudId || window.location.pathname.split('/').pop()
    const decision = document.getElementById('decision').value
    const nota = document.getElementById('nota').value.trim()
    const message = document.getElementById('message')

    try {
        await apiPut(`/revisor/solicitud/${solicitudId}/resolver`, {
            Decision: decision,
            Nota: nota
        })
        message.innerHTML = '<div class="alert alert-success">Solicitud actualizada.</div>'
        cargarDetalle()
    } catch (error) {
        message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
    }
}

function showInlineError(text) {
    const message = document.getElementById('message')
    message.innerHTML = `<div class="alert alert-error">${text}</div>`
}
