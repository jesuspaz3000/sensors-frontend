# Sistema de Alertas Críticas - Frontend

## 📋 Resumen

He implementado exitosamente la integración del sistema de alertas críticas en el frontend de la aplicación de sensores. El sistema está diseñado para trabajar con el backend que ya has implementado y proporciona notificaciones en tiempo real cuando se detectan valores críticos.

## 🎯 Funcionalidades Implementadas

### 1. Hook personalizado `useCriticalAlerts`
- **Ubicación**: `src/hooks/useCriticalAlerts.ts`
- **Propósito**: Gestiona el estado de alertas críticas, se conecta con las APIs del backend y maneja eventos de SignalR
- **Características**:
  - Auto-refresh cada 30 segundos
  - Manejo de eventos de SignalR para alertas en tiempo real
  - APIs para obtener y resetear estado de alertas
  - Test de sistema de alertas

### 2. Componente `AlertIndicator`
- **Ubicación**: `src/components/AlertIndicator/index.tsx`
- **Propósito**: Muestra el estado de alertas para un punto específico
- **Características**:
  - Indicadores visuales de estado (normal, monitoreando, alerta activa)
  - Tooltips con información detallada
  - Estados diferenciados por colores

### 3. Componente `AlertsControlPanel`
- **Ubicación**: `src/components/AlertsControlPanel/index.tsx`
- **Propósito**: Panel completo de control y gestión de alertas
- **Características**:
  - Estadísticas del sistema de alertas
  - Lista de alertas activas
  - Controles para resetear alertas
  - Función de test del sistema

### 4. Componente `CriticalAlertsDisplay`
- **Ubicación**: `src/components/CriticalAlertsDisplay/index.tsx`
- **Propósito**: Versión simplificada para mostrar alertas en la vista principal
- **Características**:
  - Resumen de estadísticas
  - Lista compacta de alertas activas
  - Umbrales configurados

### 5. Integración en `GraphicsSection`
- **Ubicación**: `src/views/airQuality/graphicsSection/index.tsx`
- **Funcionalidades añadidas**:
  - Indicadores de alertas en tarjetas de puntos individuales
  - Panel expandible de alertas críticas
  - Notificaciones Snackbar para alertas inmediatas
  - Sonido de alerta (configurable)
  - Manejo de eventos SignalR integrado

## 🔧 APIs Utilizadas

El sistema utiliza los endpoints del backend que implementaste:

```typescript
// Obtener umbrales críticos
GET /api/alerts/thresholds

// Obtener alertas recientes  
GET /api/alerts/recent

// Obtener estado del sistema de alertas
GET /api/alerts/status

// Simular alerta (desarrollo)
POST /api/alerts/simulate

// Resetear estado de alertas (usando el endpoint existente)
POST /sensordata/reset-file-status/{punto}
```

## 📡 Eventos SignalR Escuchados

El sistema escucha los siguientes eventos que el backend envía:

```typescript
// Alerta crítica detectada
connection.on("CriticalAlert", (notification) => {
  // Muestra alerta visual inmediata
  // Reproduce sonido de alerta
  // Actualiza estado local
});

// Confirmación de email enviado
connection.on("AlertEmailSent", (notification) => {
  // Muestra confirmación de email
  // Actualiza estado de alertas
});

// Estado de alertas reseteado
connection.on("AlertStatusReset", (data) => {
  // Limpia alertas previas del UI
  // Muestra mensaje informativo
});
```

## 🎨 Flujo de Funcionamiento

### 1. Detección de Alertas
1. El backend detecta valores críticos en tiempo real
2. Envía notificación por SignalR (`CriticalAlert`)
3. El frontend muestra alerta visual inmediata
4. Se reproduce sonido de alerta (si está habilitado)
5. Se actualiza el estado en el hook `useCriticalAlerts`

### 2. Confirmación de Email
1. El backend envía email al usuario
2. Envía confirmación por SignalR (`AlertEmailSent`)
3. El frontend muestra mensaje de confirmación
4. Se actualiza el indicador de "email enviado"

### 3. Reset de Alertas
1. El backend resetea archivo CSV o estado de alertas
2. Envía notificación por SignalR (`AlertStatusReset`)
3. El frontend limpia alertas de la UI
4. Se muestra mensaje informativo de reset

## 📱 Interfaz de Usuario

### En Modo Static (Datos Históricos)
- Las alertas no se muestran ya que solo monitoreamos tiempo real

### En Modo Realtime
- **Tarjetas de puntos**: Muestran `AlertIndicator` para cada punto
- **Panel de alertas**: Expandible con estadísticas y controles
- **Notificaciones**: Snackbar para alertas inmediatas
- **Alertas activas**: Cards prominentes con animación de pulso

### Indicadores Visuales
- **🟢 Verde**: Normal, monitoreando sin alertas
- **🔴 Rojo**: Alerta crítica activa
- **📧 Azul**: Email de alerta enviado
- **🔄 Naranja**: Sistema reseteado

## 🛠️ Configuración

### Umbrales Críticos (configurados en backend)
```typescript
const thresholds = {
  MaxTemperatura: 35.0,  // °C
  MaxCO3: 0.1,          // ppm (CO2)
  MaxPM2_5: 50.0        // μg/m³
};
```

### Auto-refresh del hook
```typescript
const alertsHook = useCriticalAlerts({
  autoRefresh: true,
  refreshInterval: 30000, // 30 segundos
  maxAlertHistory: 50,
  maxEmailHistory: 100
});
```

## 🚀 Cómo Probar

### 1. Test de Alerta desde Frontend
1. Ir a modo "Tiempo Real"
2. Expandir el panel de alertas
3. Usar el botón "Test" en `AlertsControlPanel`
4. Ingresar valores que excedan los umbrales

### 2. Test de Alerta desde Backend
```typescript
POST /api/alerts/simulate
{
  "timestamp": "2024-01-15T10:30:00Z",
  "temperatura": 40,      // > 35°C
  "humedad": 60,
  "pM2_5": 60,           // > 50 μg/m³
  "cO3": 0.15,           // > 0.1 ppm
  "punto": "Punto 1"
}
```

### 3. Verificar Eventos SignalR
Abrir las herramientas de desarrollador y verificar que los eventos se reciben:
```
🚨 [SignalR] Notificación de alerta crítica recibida: {...}
📧 [SignalR] Notificación de email enviada: {...}
```

## 📊 Estado de Implementación

### ✅ Completado
- [x] Hook `useCriticalAlerts` 
- [x] Componente `AlertIndicator`
- [x] Componente `AlertsControlPanel`
- [x] Componente `CriticalAlertsDisplay`
- [x] Integración en `GraphicsSection`
- [x] Manejo de eventos SignalR
- [x] APIs del backend configuradas
- [x] Notificaciones visuales y sonoras
- [x] Test del sistema de alertas

### 🔄 Pendiente de optimizar
- [ ] Suprimir warnings de TypeScript
- [ ] Configuración de sonido persistente
- [ ] Historial de alertas con persistencia local
- [ ] Configuración de umbrales desde frontend

## 🔗 Archivos Relacionados

```
src/
├── hooks/
│   └── useCriticalAlerts.ts          # Hook principal de alertas
├── components/
│   ├── AlertIndicator/index.tsx      # Indicador por punto
│   ├── AlertsControlPanel/index.tsx  # Panel completo
│   └── CriticalAlertsDisplay/index.tsx # Display simplificado
├── services/
│   └── airQuality/
│       └── graphicsSection.service.ts # APIs de alertas
└── views/
    └── airQuality/
        └── graphicsSection/index.tsx  # Integración principal
```

El sistema está completamente funcional y listo para trabajar con tu backend de alertas críticas! 🎉
