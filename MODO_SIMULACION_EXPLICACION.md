# 🎯 Explicación de Modos: Datos Históricos vs Simulación Gradual

## ❌ El Problema Detectado

Había **confusión entre dos comportamientos diferentes**:

1. **Modo Histórico (Static)**: Cuando hacías clic en "Simular", se cargaban 100 datos de golpe del CSV
2. **Modo Tiempo Real**: Los datos deberían llegar uno por uno vía SignalR

## ✅ Solución Implementada

### 📊 **Modo "Datos Históricos" (Static)**
- **Propósito**: Ver datos del CSV completos de una vez
- **Comportamiento**: 
  - Carga datos históricos del backend (100 registros)
  - NO hay simulación gradual
  - Botón "Simular" ahora te sugiere cambiar a "Tiempo Real"
- **Uso**: Para análisis de datos pasados

### 🔴 **Modo "Tiempo Real" (Realtime)**
- **Propósito**: Simulación gradual y datos en vivo
- **Comportamiento**:
  - Se conecta vía SignalR
  - **Simulación Gradual**: Los datos llegan UNO POR UNO respetando timestamps del CSV
  - **Datos Reales**: Si los sensores están conectados físicamente
- **Uso**: Para ver simulación en tiempo real

## 🧪 Cómo Probar la Simulación Gradual Correcta

### Paso 1: Cambiar a Modo Tiempo Real
1. En la pantalla principal, usa el **interruptor** para cambiar de "Datos Históricos" a "Tiempo Real"
2. Verás que se conecta vía SignalR

### Paso 2: Iniciar Simulación Gradual
1. Haz clic en **"Simular Gradual"** en cualquier punto de sensor
2. **Resultado esperado**: 
   - La gráfica se limpia (queda vacía)
   - Los datos empiezan a llegar UNO POR UNO
   - Cada dato respeta el timestamp original del CSV
   - En la consola verás: `"Status: simulating (SIMULACIÓN GRADUAL)"`

### Paso 3: Verificar en la Consola
Abre la consola del navegador y verás:
```
🧹 [useRealtimeSensorData] Limpiando datos antes de iniciar simulación para: Punto 1
🚀 [useRealtimeSensorData] Simulación iniciada para: Punto 1 - Los datos llegarán uno por uno vía SignalR
📊 [useRealtimeSensorData] Datos recibidos para Punto 1: {timestamp: "...", temperatura: 25.3, ...}
📊 [useRealtimeSensorData] Status: simulating (SIMULACIÓN GRADUAL)
📈 [useRealtimeSensorData] Total datos acumulados para Punto 1: 1
📊 [useRealtimeSensorData] Datos recibidos para Punto 1: {timestamp: "...", temperatura: 25.5, ...}
📈 [useRealtimeSensorData] Total datos acumulados para Punto 1: 2
...
```

## 🔍 Diferencias Clave

| Aspecto | Modo Histórico | Modo Tiempo Real |
|---------|----------------|-----------------|
| **Fuente de datos** | API REST (GET) | SignalR (WebSocket) |
| **Carga de datos** | 100 registros de golpe | Uno por uno gradualmente |
| **Propósito** | Ver historial completo | Simulación/datos en vivo |
| **Botón Simular** | Sugiere cambiar a tiempo real | Inicia simulación gradual |
| **Timestamps** | Todos visibles inmediatamente | Respeta tiempos originales |

## 🐛 Lo que estaba pasando antes

- En modo histórico, al hacer clic en "Simular":
  1. Se llamaba `startSimulation()` en el backend
  2. Se hacía `getSensorData(limit: 100)` 
  3. Se mostraban los 100 datos inmediatamente
  4. **NO era simulación gradual, era carga masiva**

## ✨ Lo que pasa ahora

- **Modo Histórico**: Solo para consultar datos pasados, sin simulación
- **Modo Tiempo Real**: 
  1. Se limpia la gráfica
  2. Se inicia simulación en el backend
  3. Los datos llegan vía SignalR uno por uno
  4. **SÍ es simulación gradual real**

## 🎯 Recomendación

Para ver la **simulación gradual trabajando correctamente**:
1. Cambia a "Tiempo Real" 
2. Haz clic en "Simular Gradual"
3. Observa cómo la gráfica se va llenando dato por dato
4. Monitorea los logs en la consola

¡Ahora la simulación funciona como debería! 🎉
