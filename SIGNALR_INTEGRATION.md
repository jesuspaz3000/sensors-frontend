# Integración SignalR - Datos de Sensores en Tiempo Real

## 🚀 Funcionalidades Implementadas

### 1. **Servicio SignalR** (`src/services/signalr/signalr.service.ts`)
- ✅ Conexión automática con reconexión
- ✅ Suscripción a datos de sensores específicos
- ✅ Manejo de eventos de simulación
- ✅ Gestión de estados de conexión
- ✅ Callbacks configurables

### 2. **Hook de Tiempo Real** (`src/hooks/useRealtimeSensorData.ts`)
- ✅ Gestión de datos en tiempo real vs estáticos
- ✅ Limitación automática de datos en memoria
- ✅ Control de simulaciones
- ✅ Estados de conexión integrados
- ✅ Sincronización con múltiples puntos

### 3. **Componente de Estado** (`src/components/RealtimeStatusIndicator`)
- ✅ Indicadores visuales de conexión
- ✅ Estado de simulación por punto
- ✅ Último timestamp de actualización
- ✅ Modo de datos (estático vs tiempo real)
- ✅ Resumen multipoint

### 4. **Vista Principal Actualizada** (`src/views/airQuality/graphicsSection/index.tsx`)
- ✅ Toggle entre modo estático y tiempo real
- ✅ Indicadores de estado integrados
- ✅ Control de simulaciones por punto
- ✅ Manejo de errores
- ✅ UI mejorada con feedback visual

## 🔧 Cómo Usar

### Modo Estático (Por defecto)
```typescript
// Carga datos históricos desde CSV/API REST
// Sin conexión SignalR
// Actualización manual o por refresh
```

### Modo Tiempo Real
```typescript
// Activa el toggle "Tiempo Real" en la UI
// Se conecta automáticamente a SignalR Hub
// Recibe datos cada 2 segundos durante simulación
// Muestra estados de conexión en tiempo real
```

### Controles de Simulación

#### Para cada punto individual:
- **Botón "Simular"**: Inicia la simulación en el backend
- **Botón "Detener"**: Detiene la simulación
- **Estado visual**: Chip que muestra "Simulando" o estado actual

#### En modo tiempo real:
- Los datos llegan automáticamente vía SignalR
- No necesita refrescar manualmente
- Conexión se mantiene activa

#### En modo estático:
- Usa API REST para obtener datos
- Requiere botón "Actualizar" para ver cambios
- No hay conexión SignalR

## 📡 Endpoints de SignalR Utilizados

### Hub URL
```
http://localhost:5191/hubs/sensordata
```

### Eventos que Recibe el Frontend:
- `ReceiveSensorData`: Nuevos datos de sensor
- `SimulationStatusChanged`: Cambio en estado de simulación

### Métodos que Llama el Frontend:
- `SubscribeToPoint(punto)`: Suscribirse a un punto
- `UnsubscribeFromPoint(punto)`: Desuscribirse

## 🎯 Estados de Conexión

### Estados Posibles:
1. **Disconnected** (Rojo): No conectado
2. **Connecting** (Amarillo): Conectando...
3. **Connected** (Verde): Conectado y funcionando
4. **Reconnecting** (Amarillo): Reconectando automáticamente

### Indicadores Visuales:
- **Chip de Conexión**: Muestra estado actual
- **Chip de Modo**: Estático vs Tiempo Real
- **Chip de Simulación**: Activa/Inactiva por punto
- **Timestamp**: Última actualización

## 🔍 Debugging y Logs

### Console Logs Importantes:
```javascript
// SignalR
🚀 [SignalR] Iniciando conexión...
✅ [SignalR] Conexión establecida
📡 [SignalR] Suscribiéndose a punto: Punto 1
📊 [SignalR] Datos recibidos para Punto 1

// Hook de Tiempo Real
📊 [useRealtimeSensorData] Datos recibidos para Punto 1
🎮 [useRealtimeSensorData] Estado de simulación cambiado

// Servicio de Gráficas
🔍 [GraphicsService] Iniciando conexión SignalR...
📡 [GraphicsService] Suscribiéndose a datos en tiempo real
```

## 🛠️ Configuración Backend Requerida

### SignalR Hub debe estar configurado en:
```csharp
// Startup.cs o Program.cs
app.MapHub<SensorDataHub>("/hubs/sensordata");
```

### Autenticación:
- El frontend envía el JWT token automáticamente
- Se obtiene de `localStorage.getItem('authToken')`

## 🐛 Solución de Problemas

### Si no se conecta SignalR:
1. ✅ Verificar que el backend esté corriendo
2. ✅ Confirmar URL del hub: `localhost:5191/hubs/sensordata`
3. ✅ Verificar que el JWT token sea válido
4. ✅ Revisar logs de consola

### Si no llegan datos:
1. ✅ Verificar suscripción a puntos
2. ✅ Confirmar que la simulación esté activa
3. ✅ Verificar que el backend envíe datos cada 2s

### Si hay problemas de reconexión:
1. ✅ El sistema reintenta automáticamente
2. ✅ Máximo 5 intentos con backoff exponencial
3. ✅ Reiniciar navegador si persiste

## 📋 Checklist de Funcionalidad

### ✅ Implementado:
- [x] Servicio SignalR completo
- [x] Hook de tiempo real
- [x] Componentes de estado
- [x] Toggle modo estático/tiempo real
- [x] Control de simulaciones
- [x] Reconexión automática
- [x] Indicadores visuales
- [x] Manejo de errores
- [x] Limitación de datos en memoria
- [x] Múltiples puntos simultáneos

### 🔄 Próximas Mejoras Posibles:
- [ ] Configuración de intervalos de actualización
- [ ] Exportar datos en tiempo real
- [ ] Alertas por valores críticos
- [ ] Histórico de conexiones
- [ ] Métricas de rendimiento

## 📞 Uso en Código

### Inicializar Conexión:
```typescript
const { connect, disconnect, isConnected } = useRealtimeSensorData({
  puntos: ['Punto 1', 'Punto 2', 'Punto 3'],
  maxDataPoints: 100,
  autoConnect: true
});
```

### Toggle Simulación:
```typescript
await toggleSimulation('Punto 1');
```

### Cambiar Modo:
```typescript
setDataMode(dataMode === 'static' ? 'realtime' : 'static');
```

La implementación está completa y lista para usar. El sistema detecta automáticamente si el backend tiene SignalR habilitado y se degrada graciosamente al modo estático si no está disponible.
