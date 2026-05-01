const fs = require('fs')
const path = require('path')

const total = Number(process.argv[2] || 5000)
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(__dirname, '..', 'uploads', 'estudiantes_5000.csv')

const nombres = ['Ana', 'Luis', 'Carlos', 'Maria', 'Jose', 'Elena', 'Diego', 'Sara', 'Lucia', 'Jorge']
const apellidos = ['Lopez', 'Perez', 'Gomez', 'Hernandez', 'Diaz', 'Torres', 'Castillo', 'Rojas', 'Mendoza', 'Vargas']

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function pad(num, size) {
  return String(num).padStart(size, '0')
}

function randomDate() {
  const year = 1998 + Math.floor(Math.random() * 8)
  const month = 1 + Math.floor(Math.random() * 12)
  const day = 1 + Math.floor(Math.random() * 28)
  return `${year}-${pad(month, 2)}-${pad(day, 2)}`
}

const lines = ['Nombre_Completo,Email,Fecha_Nacimiento,Promedio']

for (let i = 1; i <= total; i += 1) {
  const nombre = `${randomItem(nombres)} ${randomItem(apellidos)}`
  const email = `estudiante${pad(i, 5)}@becas.gt`
  const fecha = randomDate()
  const promedio = (70 + Math.random() * 30).toFixed(2)
  lines.push(`${nombre},${email},${fecha},${promedio}`)
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8')

console.log(`CSV generado: ${outputPath} (${total} filas)`)