# ?? Sensors API - Documentaci�n Completa

## ?? **Informaci�n General**

**Proyecto:** Sistema de Monitoreo de Sensores en Tiempo Real  
**Tecnolog�a:** .NET 8 - Razor Pages + API REST + SignalR  
**Base URL:** `http://localhost:5000` (Development)  
**Versi�n:** 1.0.0  

---

## ??? **Arquitectura del Sistema**

### **Componentes Principales:**
- **?? API REST**: Endpoints para consultas y configuraci�n
- **?? SignalR Hub**: Comunicaci�n en tiempo real
- **?? FileWatcher Service**: Monitoreo autom�tico de archivos CSV
- **?? Simulation Service**: Simulaci�n de datos para testing
- **?? JWT Authentication**: Autenticaci�n basada en tokens

### **Flujo de Datos:**
1. **Sensores reales** ? Escriben datos a archivos CSV
2. **FileWatcher** ? Detecta cambios autom�ticamente  
3. **Sistema** ? Procesa solo l�neas nuevas (eficiente)
4. **SignalR** ? Env�a datos en tiempo real al frontend
5. **Frontend** ? Actualiza gr�ficos/dashboards instant�neamente

---

## ?? **Autenticaci�n**

### **Formato del Token:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **SignalR Authentication:**
```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/sensordata?access_token=" + jwtToken)
    .build();
```

**?? IMPORTANTE:** Todos los endpoints requieren token JWT excepto health checks

---

## ?? **Modelos de Datos**

### **SensorReading**
```json
{
  "timestamp": "2025-01-15T14:30:45",
  "temperatura": 25.3,
  "humedad": 62.1,
  "pm2_5": 12.4,
  "co3": 0.045,
  "punto": "Punto 1"
}
```

### **SensorDataResponse**
```json
{
  "data": [SensorReading],
  "punto": "Punto 1",
  "lastUpdate": "2025-01-15T14:35:00",
  "totalRecords": 150,
  "isRealTime": false
}
```

### **RealtimeSensorData** (SignalR)
```json
{
  "latestReading": SensorReading,
  "punto": "Punto 1",
  "updateTime": "2025-01-15T14:35:22Z",
  "status": "real-time"  // o "simulating"
}
```

---

## ?? **API REST Endpoints**

### **1. ?? Obtener Datos de Sensores**
```http
GET /api/sensordata
```
**?? Requiere Token:** ? S�

**Query Parameters:**
- `punto` (opcional): `"Punto 1"`, `"Punto 2"`, etc.
- `fromDate` (opcional): `"2025-01-15T10:00:00"`
- `toDate` (opcional): `"2025-01-15T20:00:00"`
- `limit` (opcional): `100` (default)
- `simulate` (opcional): `false` (default)

**Ejemplo de uso:**
```javascript
// Obtener �ltimas 50 lecturas del Punto 1
GET /api/sensordata?punto=Punto 1&limit=50

// Filtrar por rango de fechas
GET /api/sensordata?fromDate=2025-01-15T08:00:00&toDate=2025-01-15T18:00:00

// Todos los puntos, �ltimas 20 lecturas
GET /api/sensordata?limit=20
```

**Respuesta:**
```json
{
  "data": [
    {
      "timestamp": "2025-01-15T14:30:45",
      "temperatura": 25.3,
      "humedad": 62.1,
      "pm2_5": 12.4,
      "co3": 0.045,
      "punto": "Punto 1"
    }
  ],
  "punto": "Punto 1",
  "lastUpdate": "2025-01-15T14:35:00",
  "totalRecords": 150,
  "isRealTime": false
}
```

---

### **2. ?? �ltima Lectura de un Sensor**
```http
GET /api/sensordata/latest/{punto}
```
**?? Requiere Token:** ? S�

**Ejemplo:**
```javascript
GET /api/sensordata/latest/Punto 1
```

**Respuesta:**
```json
{
  "timestamp": "2025-01-15T14:35:22",
  "temperatura": 26.8,
  "humedad": 58.3,
  "pm2_5": 15.2,
  "co3": 0.052,
  "punto": "Punto 1"
}
```

---

### **3. ?? Puntos de Sensores Disponibles**
```http
GET /api/sensordata/points
```
**?? Requiere Token:** ? S�

**Respuesta:**
```json
[
  "Punto 1",
  "Punto 2", 
  "Punto 3"
]
```

---

### **4. ?? Iniciar Simulaci�n**
```http
POST /api/sensordata/simulate/{punto}/start
```
**?? Requiere Token:** ? S�

**Ejemplo:**
```javascript
POST /api/sensordata/simulate/Punto 1/start
```

**Respuesta:**
```json
{
  "message": "Simulation started for Punto 1",
  "punto": "Punto 1",
  "status": "simulating",
  "startTime": "2025-01-15T14:35:00Z"
}
```

**�Qu� hace?**
- Inicia simulaci�n con datos del CSV
- Env�a 1 lectura cada 2 segundos v�a SignalR
- Recorre datos secuencialmente (bucle infinito)
- Status = "simulating"

---

### **5. ?? Detener Simulaci�n**
```http
POST /api/sensordata/simulate/{punto}/stop
```
**?? Requiere Token:** ? S�

**Ejemplo:**
```javascript
POST /api/sensordata/simulate/Punto 1/stop
```

**Respuesta:**
```json
{
  "message": "Simulation stopped for Punto 1",
  "punto": "Punto 1", 
  "status": "stopped",
  "stopTime": "2025-01-15T14:40:00Z"
}
```

---

### **6. ? Estado de Simulaci�n**
```http
GET /api/sensordata/simulate/{punto}/status
```
**?? Requiere Token:** ? S�

**Ejemplo:**
```javascript
GET /api/sensordata/simulate/Punto 1/status
```

**Respuesta:**
```json
{
  "punto": "Punto 1",
  "isActive": true,
  "status": "simulating",
  "timestamp": "2025-01-15T14:35:00Z"
}
```

---

### **7. ?? Todos los Datos (Testing)**
```http
GET /api/sensordata/all/{punto}
```
**?? Requiere Token:** ? S�

**Ejemplo:**
```javascript
GET /api/sensordata/all/Punto 1
```

**Respuesta:**
```json
{
  "punto": "Punto 1",
  "totalRecords": 250,
  "data": [
    {
      "timestamp": "2025-06-30T20:30:00",
      "temperatura": 23.29,
      "humedad": 50.4,
      "pm2_5": 6.34,
      "co3": 0.072,
      "punto": "Punto 1"
    }
    // ... m�s datos
  ],
  "timestamp": "2025-01-15T14:35:00Z"
}
```

---

### **8. ?? Health Check**
```http
GET /api/sensordata/health
```
**?? Requiere Token:** ? NO (P�blico)

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T14:35:00Z",
  "availablePoints": ["Punto 1", "Punto 2", "Punto 3"],
  "activeSimulations": ["Punto 1"],
  "totalPoints": 3,
  "activeSimulationsCount": 1
}
```

---

## ?? **SignalR Real-Time Hub**

### **Conexi�n:**
```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/sensordata?access_token=" + jwtToken)
    .build();

await connection.start();
```

### **Suscribirse a un Sensor:**
```javascript
// Suscribirse al Punto 1
await connection.invoke("JoinSensorGroup", "Punto 1");

// Recibir datos en tiempo real
connection.on("SensorDataUpdate", function (data) {
    console.log("Nuevos datos:", data);
    updateChart(data.latestReading);
});
```

### **Desuscribirse:**
```javascript
await connection.invoke("LeaveSensorGroup", "Punto 1");
```

### **Eventos Recibidos:**
**`SensorDataUpdate`** - Se dispara cuando:
- ? Hay simulaci�n activa (cada 2 segundos)
- ? Sensores reales escriben datos al CSV (autom�tico)

**Formato del evento:**
```json
{
  "latestReading": {
    "timestamp": "2025-01-15T14:35:22",
    "temperatura": 26.8,
    "humedad": 58.3,
    "pm2_5": 15.2,
    "co3": 0.052,
    "punto": "Punto 1"
  },
  "punto": "Punto 1",
  "updateTime": "2025-01-15T14:35:22Z",
  "status": "real-time"  // "real-time" o "simulating"
}
```

---

## ?? **Modos de Operaci�n**

### **1. ?? Modo Simulaci�n**
```javascript
// Iniciar simulaci�n
POST /api/sensordata/simulate/Punto 1/start

// El sistema:
// - Lee datos del CSV existente
// - Env�a 1 lectura cada 2 segundos v�a SignalR
// - Recorre datos secuencialmente (bucle infinito)
// - Status: "simulating"
// - Timestamp: DateTime.UtcNow (tiempo actual)

// Detener simulaci�n
POST /api/sensordata/simulate/Punto 1/stop
```

### **2. ?? Modo Real-Time**
```javascript
// NO requiere configuraci�n manual
// El FileWatcherService detecta autom�ticamente:

// - Sensores escriben nuevos datos al CSV
// - Sistema detecta cambios de archivo (FileSystemWatcher)
// - Lee SOLO las l�neas nuevas (eficiente)
// - Env�a autom�ticamente v�a SignalR
// - Status: "real-time"
// - Timestamp: Tiempo real del sensor
```

---

## ?? **Estructura de Archivos CSV**

### **Ubicaci�n:**
```
sensors/Data/
??? data_punto_1.csv
??? data_punto_2.csv
??? data_punto_3.csv
```

### **Formato de los CSV:**
```csv
timestamp,temperatura,humedad,pm2_5,co3,punto
2025-06-30 20:30:00,23.29,50.4,6.34,0.072,Punto 1
2025-06-30 20:30:02,21.62,48.7,7.49,0.017,Punto 1
2025-06-30 20:30:04,21.41,58.8,13.92,0.040,Punto 1
```

### **C�mo Funcionan los Sensores Reales:**
1. **Sensores f�sicos** escriben nuevas l�neas al final del CSV
2. **FileWatcherService** detecta el cambio autom�ticamente
3. **Sistema** lee solo las l�neas nuevas (no todo el archivo)
4. **SignalR** env�a datos al frontend instant�neamente

---

## ?? **Casos de Uso Frontend**

### **1. ?? Dashboard General**
```javascript
// 1. Conectar SignalR
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/sensordata?access_token=" + token)
    .build();

// 2. Obtener datos iniciales
const response = await fetch('/api/sensordata?limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const initialData = await response.json();

// 3. Suscribirse a actualizaciones en tiempo real
await connection.invoke("JoinSensorGroup", "Punto 1");
connection.on("SensorDataUpdate", updateChart);

// 4. Mostrar datos iniciales + actualizaciones en tiempo real
```

### **2. ?? Modo Testing/Demo**
```javascript
// Iniciar simulaci�n para demo
await fetch('/api/sensordata/simulate/Punto 1/start', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
});

// Los datos llegar�n autom�ticamente v�a SignalR cada 2 segundos
connection.on("SensorDataUpdate", (data) => {
    if (data.status === "simulating") {
        console.log("Datos simulados:", data.latestReading);
    }
});

// Detener simulaci�n cuando termine el demo
await fetch('/api/sensordata/simulate/Punto 1/stop', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
});
```

### **3. ?? Gr�ficos en Tiempo Real**
```javascript
// Configurar Chart.js / D3.js / etc.
const chart = new Chart(ctx, chartConfig);

connection.on("SensorDataUpdate", (data) => {
    const reading = data.latestReading;
    
    // Agregar nuevo punto al gr�fico
    chart.data.labels.push(new Date(reading.timestamp));
    chart.data.datasets[0].data.push(reading.temperatura);
    chart.data.datasets[1].data.push(reading.humedad);
    chart.data.datasets[2].data.push(reading.pm2_5);
    
    // Mantener solo �ltimos 50 puntos
    if (chart.data.labels.length > 50) {
        chart.data.labels.shift();
        chart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    chart.update('none'); // Sin animaci�n para tiempo real
});
```

### **4. ?? Consultas Espec�ficas**
```javascript
// Datos de las �ltimas 2 horas
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
const response = await fetch(
    `/api/sensordata?punto=Punto 1&fromDate=${twoHoursAgo.toISOString()}&limit=200`,
    { headers: { 'Authorization': `Bearer ${token}` } }
);

// Comparar m�ltiples sensores
const punto1 = await fetch('/api/sensordata/latest/Punto 1', headers);
const punto2 = await fetch('/api/sensordata/latest/Punto 2', headers);
const punto3 = await fetch('/api/sensordata/latest/Punto 3', headers);
```

---

## ? **Caracter�sticas T�cnicas**

### **?? Performance:**
- ? Lectura incremental de archivos (solo l�neas nuevas)
- ? Cache en memoria para consultas r�pidas
- ? SignalR con grupos espec�ficos por sensor
- ? Throttling autom�tico si hay muchos datos simult�neos

### **??? Reliability:**
- ? Auto-recovery de FileWatchers si fallan
- ? Manejo robusto de errores
- ? Logging extensivo para debugging
- ? Health checks autom�ticos

### **?? Scalability:**
- ? Soporte para cualquier cantidad de sensores
- ? Maneja de 1 a 100+ nuevos datos simult�neamente
- ? Grupos SignalR independientes por sensor
- ? Background services eficientes

---

## ?? **Debugging y Logs**

### **Health Check del Sistema:**
```http
GET /api/sensordata/health
```

### **Logs Importantes:**
- `?? Archivo {punto} inicializado con {lines} l�neas`
- `?? Nuevos datos detectados en {punto}: {count} lecturas`
- `?? Enviados {count} updates via SignalR para {punto}`
- `? File watchers configurados para {count} archivos`

### **Estados de Simulaci�n:**
```javascript
// Verificar estado
GET /api/sensordata/simulate/Punto 1/status

// Respuesta:
{
  "isActive": true,
  "status": "simulating",  // "simulating" o "stopped"
  "timestamp": "2025-01-15T14:35:00Z"
}
```

---

## ?? **Flujo Completo de Integraci�n**

### **1. Inicializaci�n:**
```javascript
// 1. Autenticar usuario
const authResponse = await login(username, password);
const token = authResponse.accessToken;

// 2. Conectar SignalR
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/sensordata?access_token=" + token)
    .build();
await connection.start();

// 3. Obtener puntos disponibles
const points = await fetch('/api/sensordata/points', {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

### **2. Configurar Tiempo Real:**
```javascript
// 4. Suscribirse a todos los sensores
for (const punto of points) {
    await connection.invoke("JoinSensorGroup", punto);
}

// 5. Configurar listeners
connection.on("SensorDataUpdate", (data) => {
    console.log(`${data.punto}: ${data.latestReading.temperatura}�C [${data.status}]`);
    updateDashboard(data);
});
```

### **3. Cargar Datos Iniciales:**
```javascript
// 6. Cargar datos hist�ricos para cada sensor
for (const punto of points) {
    const historical = await fetch(`/api/sensordata?punto=${punto}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    initializeChart(punto, historical.data);
}
```

### **4. Modo Demo (Opcional):**
```javascript
// 7. Activar simulaci�n para demo
const demoButton = document.getElementById('demo-mode');
demoButton.onclick = async () => {
    for (const punto of points) {
        await fetch(`/api/sensordata/simulate/${punto}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }
};
```

---

## ?? **Notas de Implementaci�n**

### **?? Consideraciones:**
1. **Tokens JWT**: Expiran, implementar refresh autom�tico
2. **SignalR Reconnection**: Configurar auto-reconnect
3. **Error Handling**: Manejar desconexiones de red
4. **Memory Management**: Limpiar datos antiguos en gr�ficos
5. **Performance**: Usar `chart.update('none')` para tiempo real

### **?? Recomendaciones:**
1. **Bufferear datos** si hay muchas actualizaciones simult�neas
2. **Usar Web Workers** para procesamiento pesado de datos
3. **Implementar zoom/pan** en gr�ficos para datos hist�ricos
4. **Cachear consultas** frecuentes en el frontend
5. **Mostrar indicadores** de conexi�n/simulaci�n activa

---

**?? �El sistema est� listo para manejar tanto simulaci�n como datos reales en tiempo real!**