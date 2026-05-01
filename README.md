# FRAUDE_BD2 - Sistema de Becas Antifraude

Sistema de gestion de becas con deteccion de fraude sobre Neo4j. Incluye portal por roles (admin, revisor, estudiante), reportes, alertas automaticas, cargas CSV y consultas Cypher.

## Tecnologias
- Node.js + Express
- Neo4j (neo4j-driver)
- EJS + CSS
- JWT (autenticacion por token)
- Multer (carga CSV)

## Instalacion
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear el archivo .env usando .env.example.
3. Ejecutar el servidor:
   ```bash
   npm start
   ```

La aplicacion queda disponible en http://localhost:3000.

## Archivo .env
Revisar el archivo .env.example y completar:
- NEO4J_URI
- NEO4J_USER
- NEO4J_PASSWORD
- PORT
- JWT_SECRET

## JWT y roles
- El token JWT se guarda en `localStorage`.
- Todas las llamadas API usan `Authorization: Bearer <token>` desde `public/js/api.js`.
- Las vistas redirigen por rol (admin, revisor, estudiante) en login y registro.

## Usuario admin
- admin@becas.gt

## Rutas principales (vistas)
- /login
- /registro
- /admin/dashboard
- /admin/becas
- /admin/revisores
- /admin/alertas
- /admin/fraude
- /admin/agregaciones
- /admin/carga-csv
- /revisor/dashboard
- /estudiante/perfil
- /estudiante/dashboard
- /estudiante/solicitudes
- /estudiante/documentos
- /estudiante/cuenta
- /estudiante/direccion
- /estudiante/institucion
- /estudiante/dispositivo
- /estudiante/referencia
- /revisor/solicitudes
- /revisor/solicitud/:id

## Rutas principales (API)
- POST /auth/login
- POST /auth/registro

- GET /api/reports/fraud/shared-accounts
- GET /api/reports/fraud/reused-documents
- GET /api/reports/fraud/network
- GET /api/reports/pending?reviewerId=REV001
- GET /api/reports/accounts/stats
- GET /api/reports/scholarships/stats
- POST /api/reports/fraud/check-all
- GET /api/reports/alerts/pending
- GET /api/reports/alerts/stats
- PUT /api/reports/alerts/:alertId/resolve

- /admin/* (gestion)
- /estudiante/* (perfil, solicitudes, documentos)
- /revisor/* (revision de solicitudes)

## Flujo de demo sugerido
1. Iniciar sesion como admin.
2. Ir a /admin/carga-csv y cargar estudiantes.
3. Ver /admin/fraude y ejecutar check-all.
4. Revisar alertas en /admin/alertas y resolver.
5. Consultar agregaciones y filtros en /admin/agregaciones.
6. Iniciar sesion como revisor y revisar solicitudes en /revisor/dashboard.
7. Iniciar sesion como estudiante y crear solicitud + documento.

## Carga CSV
- Endpoint: POST /admin/estudiantes/csv
- Archivo CSV con columnas: Nombre_Completo, Email, Fecha_Nacimiento, Promedio

### Generar CSV de 5000 estudiantes (recomendado)
```bash
node scripts/generate-estudiantes-csv.js 5000
```
Esto genera el archivo `uploads/estudiantes_5000.csv` listo para cargar en /admin/carga-csv.

## Cumplimiento de rubrica
- Carga CSV y minimo de 5000 nodos (segun dataset cargado).
- Grafo conexo con estudiantes, solicitudes, documentos, cuentas, dispositivos y alertas.
- CRUD de nodos (crear becas, revisores, estudiantes via CSV, documentos, solicitudes).
- CRUD de relaciones (auditar, eliminar relaciones GENERA_ALERTA, notas de revision).
- Filtros y agregaciones visibles en /admin/agregaciones.
- 6 consultas Cypher visibles en reportes de fraude y estadisticas.

## Consultas Cypher visibles (6)
- /admin/fraude: cuentas compartidas, documentos reutilizados, red de fraude.
- /admin/agregaciones: pendientes por revisor, estadisticas de cuentas.
- /admin/becas: estadisticas de montos por beca.

## Consultas por integrante
- RIC: cuenta compartida, solicitud duplicada
- FEL: aprobacion sospechosa, red de fraude
- VIA: documento reutilizado, dispositivo/direccion reutilizada

## Comandos
- Instalar dependencias: npm install
- Iniciar servidor: npm start
- Generar CSV: node scripts/generate-estudiantes-csv.js 5000
