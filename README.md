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
- CRUD de nodos (crear becas, revisores, estudiantes via CSV, alertas manuales).
- CRUD de propiedades (desactivar estudiantes, actualizar riesgo de alerta, agregar observación).
- CRUD de relaciones (auditar adjuntas, eliminar relaciones GENERA_ALERTA, eliminar nota de revision).
- Filtros (Estudiantes por promedio debajo del maximo, pagos fallidos, documentos invalidos).
- Agregaciones (Estudiantes por cuenta bancaria, promedio de monto por beca, alertas por estado).
- Consultas Cypher complejas para fraude (redes, cuentas compartidas, documentos reutilizados).

## Consultas Cypher Destacadas (Rúbrica)

### 1. Detección de Cuentas Compartidas (SHARED_ACCOUNT)
Encuentra estudiantes distintos que depositan o tienen vinculada la misma cuenta bancaria.
```cypher
MATCH (e:Estudiante)-[:USA_CUENTA]->(cuenta:Cuenta)
WITH cuenta, COLLECT(DISTINCT e) AS estudiantes
WITH cuenta, estudiantes, SIZE(estudiantes) AS num_estudiantes
WHERE num_estudiantes > 1
RETURN cuenta.ID, num_estudiantes, estudiantes
```

### 2. Detección de Documentos Reutilizados (REUSED_DOCUMENT)
Identifica un mismo hash de documento asociado a solicitudes de diferentes estudiantes.
```cypher
MATCH (est:Estudiante)-[:ENVIA]->(sol:Solicitud)-[:ADJUNTA]->(doc:Documento)
WHERE doc.Hash IS NOT NULL AND trim(doc.Hash) <> ''
WITH doc.Hash AS hash, COLLECT(DISTINCT est) AS estudiantes
WHERE SIZE(estudiantes) > 1
RETURN hash, SIZE(estudiantes) AS num_estudiantes
```

### 3. Redes de Fraude Complejas (FRAUD_NETWORK)
Detecta estudiantes que comparten tanto la misma cuenta bancaria como el mismo dispositivo (IP o huella de navegador).
```cypher
MATCH (e:Estudiante)-[:USA_CUENTA]->(c:Cuenta)
MATCH (e)-[:USA_DISPOSITIVO]->(d:Dispositivo)
WITH c, d, COLLECT(DISTINCT e) AS estudiantes
WHERE SIZE(estudiantes) > 1
RETURN c.ID, d.ID, SIZE(estudiantes) AS num_estudiantes
```

### 4. Agregación: Promedio de Montos por Beca
Calcula el promedio, máximo y mínimo de los montos solicitados agrupados por Beca.
```cypher
MATCH (s:Solicitud)-[:APLICA_A]->(b:Beca)
RETURN b.Nombre_Beca, COUNT(s) as solicitudes, AVG(s.Monto_Solicitado) as promedio
```

### 5. Filtro: Estudiantes con Promedios Sospechosos
Busca estudiantes cuyo promedio sea inferior a un límite específico de la beca, ordenados de forma ascendente.
```cypher
MATCH (b:Beca {ID: $becaId})
MATCH (e:Estudiante)
WHERE e.Promedio < b.Monto_Max
RETURN e ORDER BY e.Promedio ASC
```

### 6. Filtro: Pagos Fallidos en Bucle
Encuentra transacciones de pago que no fueron exitosas tras múltiples intentos.
```cypher
MATCH (p:Pago)
WHERE p.Exitoso = false AND p.Intentos > 2
RETURN p ORDER BY p.Intentos DESC
```

## Comandos
- Instalar dependencias: npm install
- Iniciar servidor: npm start
- Generar CSV: node scripts/generate-estudiantes-csv.js 5000
