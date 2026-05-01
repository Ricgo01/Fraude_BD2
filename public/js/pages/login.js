document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form')
    const message = document.getElementById('message')

    if (!loginForm) return

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault()
        message.innerHTML = ''

        const email = document.getElementById('email').value.trim()

        if (!email) {
            message.innerHTML = '<div class="alert alert-error">Ingresa un correo valido.</div>'
            return
        }

        try {
            const result = await apiPost('/auth/login', { Email: email })
            if (!result || !result.token || !result.usuario) {
                throw new Error('Respuesta de login invalida')
            }

            localStorage.setItem('token', result.token)
            localStorage.setItem('rol', result.usuario.rol)
            localStorage.setItem('usuario', JSON.stringify(result.usuario))

            redirectByRole(result.usuario.rol)
        } catch (error) {
            message.innerHTML = `<div class="alert alert-error">${error.message}</div>`
        }
    })
})

function redirectByRole(role) {
    if (role === 'admin') {
        window.location.href = '/admin/dashboard'
        return
    }

    if (role === 'revisor') {
        window.location.href = '/revisor/dashboard'
        return
    }

    window.location.href = '/estudiante/dashboard'
}
