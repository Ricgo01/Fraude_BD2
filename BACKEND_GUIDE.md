# BACKEND - Endpoints para Frontend

## URL Base
```
http://localhost:3000/api
```

---

## 10 Endpoints Disponibles

### 1. Cuentas Bancarias Compartidas
```
GET /reports/fraud/shared-accounts
```
Retorna cuentas compartidas por múltiples estudiantes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cuenta_id": "ACC001",
      "banco": "Banco X",
      "numero_estudiantes": 3,
      "estudiantes": [{...}],
      "riesgo": "ALTO"
    }
  ]
}
```

---

### 2. Documentos Reutilizados
```
GET /reports/fraud/reused-documents
```
Retorna documentos con hash idéntico en solicitudes distintas.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hash_documento": "sha256_abc123",
      "tipo_documento": "Cedula",
      "numero_estudiantes": 4,
      "estudiantes": [{...}],
      "riesgo": "CRITICO"
    }
  ]
}
```

---

### 3. Red de Fraude
```
GET /reports/fraud/network
```
Retorna estudiantes compartiendo cuenta Y dispositivo simultáneamente.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "red_id": "FRAUD_NETWORK_001",
      "estudiantes": [{...}],
      "cuenta_compartida": "ACC020",
      "dispositivo_compartido": "DEV020",
      "riesgo": "CRITICO"
    }
  ]
}
```

---

### 4. Solicitudes Pendientes por Revisor
```
GET /reports/pending?reviewerId=REV001
```
Parámetros:
- `reviewerId` (requerido): ID del revisor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "solicitud_id": "SOL001",
      "estudiante_nombre": "Juan Pérez",
      "monto_solicitado": 5000000,
      "fecha_envio": "2026-04-01",
      "estado": "Pendiente"
    }
  ]
}
```

---

### 5. Estadísticas de Cuentas
```
GET /reports/accounts/stats
```
Retorna COUNT de estudiantes por cuenta.

**Response:**
```json
{
  "success": true,
  "resumen": {
    "total_cuentas": 150,
    "cuentas_compartidas": 12,
    "promedio_estudiantes_por_cuenta": 1.33
  },
  "data": [{...}]
}
```

---

### 6. Estadísticas de Becas
```
GET /reports/scholarships/stats
```
Retorna AVG, MIN, MAX de montos por beca.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "beca_id": "BECA001",
      "nombre_beca": "Beca Académica",
      "monto_promedio": 5500000,
      "monto_maximo_solicitado": 9800000,
      "monto_minimo_solicitado": 2000000,
      "numero_solicitudes": 150
    }
  ]
}
```

---

### 7. Ejecutar Detección Integral
```
POST /fraud/check-all
```
Crea alertas automáticas en Neo4j. Body: `{}`

**Response:**
```json
{
  "success": true,
  "resumen": {
    "cuentas_compartidas_detectadas": 5,
    "documentos_reutilizados_detectados": 3,
    "redes_fraude_detectadas": 2,
    "alertas_automáticas_creadas": 10
  }
}
```

---

### 8. Obtener Alertas Pendientes
```
GET /reports/alerts/pending
```
Retorna alertas sin resolver.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "alerta_id": "alerta_1714322400123_abc123",
      "tipo_alerta": "SHARED_ACCOUNT",
      "nivel_riesgo": "ALTO",
      "puntaje_riesgo": 70,
      "fecha_creacion": "2026-04-28T14:30:00.000Z",
      "solicitud_id": "SOL001"
    }
  ]
}
```

---

### 9. Estadísticas de Alertas
```
GET /reports/alerts/stats
```
Retorna estadísticas consolidadas de alertas.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_alertas": 15,
    "alertas_resueltas": 3,
    "alertas_pendientes": 12,
    "por_tipo": {
      "shared_account": 5,
      "reused_document": 4,
      "fraud_network": 6
    },
    "riesgo_promedio": 78.5
  }
}
```

---

### 10. Marcar Alerta Como Resuelta
```
PUT /reports/alerts/:alertId/resolve
```
Body:
```json
{
  "descripcion_resolucion": "Revisada y aprobada"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alerta marcada como resuelta"
}
```

---

## Headers Requeridos
```javascript
Content-Type: application/json
```

---

## Formato General de Respuestas
```json
{
  "success": true/false,
  "message": "descripción",
  "data": {...},
  "timestamp": "2026-04-28T14:30:00.000Z"
}
```

---

## Puntajes de Riesgo
- Cuentas compartidas: **70/100** (ALTO)
- Documentos reutilizados: **80/100** (CRÍTICO)
- Red de fraude: **90/100** (CRÍTICO)