const estudiantes = [
  {
    id: "EST-001",
    nombre: "Ana López",
    fechaNacimiento: "2004-05-10",
    promedio: 87.5,
    activo: true,
    institucion: "Universidad del Valle",
    direccion: "Zona 15, Guatemala",
    cuenta: "Banco Industrial - ****1234",
    referencia: "María López",
  },
  {
    id: "EST-002",
    nombre: "Carlos Pérez",
    fechaNacimiento: "2003-09-18",
    promedio: 79.2,
    activo: true,
    institucion: "Universidad Galileo",
    direccion: "Mixco, Guatemala",
    cuenta: "BAC - ****5678",
    referencia: "Luis Pérez",
  },
];

const becas = [
  {
    id: "BEC-001",
    nombre: "Beca Excelencia Académica",
    categoria: "Académica",
    montoMax: 8000,
    renovable: true,
    fechaInicio: "2026-02-01",
    activa: true,
  },
  {
    id: "BEC-002",
    nombre: "Beca Apoyo Económico",
    categoria: "Socioeconómica",
    montoMax: 6000,
    renovable: false,
    fechaInicio: "2026-02-15",
    activa: true,
  },
];

const revisores = [
  {
    id: "REV-001",
    nombre: "Jorge Méndez",
    rol: "Revisor académico",
    activo: true,
    especialidades: ["Académica", "Socioeconómica"],
  },
  {
    id: "REV-002",
    nombre: "Laura García",
    rol: "Revisor financiero",
    activo: true,
    especialidades: ["Financiera", "Documental"],
  },
];

const solicitudes = [
  {
    id: "SOL-001",
    estudianteId: "EST-001",
    estudiante: "Ana López",
    becaId: "BEC-001",
    beca: "Beca Excelencia Académica",
    montoSolicitado: 5000,
    motivo: "Apoyo para matrícula universitaria",
    estado: "En Revisión",
    fechaEnvio: "2026-04-20",
    revisorId: "REV-001",
    revisor: "Jorge Méndez",
    nivelRiesgo: "Medio",
  },
  {
    id: "SOL-002",
    estudianteId: "EST-002",
    estudiante: "Carlos Pérez",
    becaId: "BEC-002",
    beca: "Beca Apoyo Económico",
    montoSolicitado: 6500,
    motivo: "Apoyo para mensualidades",
    estado: "Pendiente",
    fechaEnvio: "2026-04-22",
    revisorId: "REV-002",
    revisor: "Laura García",
    nivelRiesgo: "Alto",
  },
];

const documentos = [
  {
    id: "DOC-001",
    solicitudId: "SOL-001",
    tipo: "Constancia de estudios",
    estadoRevision: "Válido",
    esValido: true,
    fechaCarga: "2026-04-20",
  },
  {
    id: "DOC-002",
    solicitudId: "SOL-002",
    tipo: "Constancia de ingresos",
    estadoRevision: "Pendiente",
    esValido: null,
    fechaCarga: "2026-04-22",
  },
];

const alertas = [
  {
    id: "ALT-001",
    solicitudId: "SOL-002",
    estudiante: "Carlos Pérez",
    tipo: "Monto solicitado mayor al permitido",
    nivelRiesgo: "Alto",
    puntaje: 85,
    origen: "Automática",
    resuelta: false,
    justificacion:
      "El monto solicitado supera el monto máximo permitido para la beca seleccionada.",
    fechaCreacion: "2026-04-22",
  },
  {
    id: "ALT-002",
    solicitudId: "SOL-001",
    estudiante: "Ana López",
    tipo: "Documento pendiente de validación",
    nivelRiesgo: "Medio",
    puntaje: 60,
    origen: "Manual",
    resuelta: false,
    justificacion:
      "El revisor solicitó validar nuevamente la documentación adjunta.",
    fechaCreacion: "2026-04-21",
  },
];

module.exports = {
  estudiantes,
  becas,
  revisores,
  solicitudes,
  documentos,
  alertas,
};