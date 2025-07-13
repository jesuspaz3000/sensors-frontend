import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SensorReading, 
  RealtimeSensorData, 
  GraphicsSectionService, 
  SimulationStatus,
  SimulationState,
  SimulationStateType
} from '../services/airQuality/graphicsSection.service';
import * as signalR from '@microsoft/signalr';
import { 
  CriticalAlertNotification, 
  EmailSentNotification 
} from '../services/signalr/signalr.service';

// Tipos de fuente de datos
export type DataSourceType = 'simulated' | 'realtime' | 'historical';

// Estado de datos reales por punto
export interface RealDataState {
  isAvailable: boolean;
  isMonitoring: boolean;
  lastUpdate?: Date;
  sensorStatus?: string;
}

export interface UseRealtimeSensorDataProps {
  puntos: string[];
  maxDataPoints?: number; // Límite de puntos de datos para mantener en memoria
  autoConnect?: boolean; // Si debe conectar automáticamente
  
  // Callbacks opcionales para alertas críticas
  onCriticalAlert?: (alertData: CriticalAlertNotification) => void;
  onEmailSent?: (emailData: EmailSentNotification) => void;
}

export interface UseRealtimeSensorDataReturn {
  // Estados principales
  realtimeData: { [punto: string]: SensorReading[] };
  latestReadings: { [punto: string]: SensorReading | null };
  simulationStatus: { [punto: string]: boolean }; // Mantener para compatibilidad
  simulationState: { [punto: string]: SimulationStateType }; // Estado de simulación detallado
  simulationProgress: { [punto: string]: number }; // Progreso de simulación
  connectionState: signalR.HubConnectionState;
  isConnected: boolean;
  error: string | null;
  
  // Estados de datos reales
  realDataState: { [punto: string]: RealDataState };
  dataSource: { [punto: string]: DataSourceType }; // Fuente actual de datos por punto
  
  // Acciones de conexión
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Acciones de simulación
  toggleSimulation: (punto: string) => Promise<void>; // Mantener para compatibilidad
  startSimulation: (punto: string) => Promise<void>;
  pauseSimulation: (punto: string) => Promise<void>;
  resumeSimulation: (punto: string) => Promise<void>;
  restartSimulation: (punto: string) => Promise<void>;
  stopSimulation: (punto: string) => Promise<void>;
  getSimulationStatus: (punto: string) => Promise<SimulationStatus | null>;
  
  // Acciones de datos reales
  checkRealDataAvailability: (punto: string) => Promise<boolean>;
  startRealTimeMonitoring: (punto: string) => Promise<void>;
  stopRealTimeMonitoring: (punto: string) => Promise<void>;
  switchToRealData: (punto: string) => Promise<void>;
  switchToSimulatedData: (punto: string) => Promise<void>;
  loadHistoricalData: (punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }) => Promise<void>;
  loadFullStaticData: (punto: string) => Promise<void>; // Nueva función para cargar datos estáticos completos
  
  // Utilidades
  clearData: (punto?: string) => void;
  refreshStaticData: () => Promise<void>;
}

export const useRealtimeSensorData = ({
  puntos,
  maxDataPoints = 100,
  autoConnect = true,
  onCriticalAlert,
  onEmailSent
}: UseRealtimeSensorDataProps): UseRealtimeSensorDataReturn => {
  
  // Estados principales
  const [realtimeData, setRealtimeData] = useState<{ [punto: string]: SensorReading[] }>({});
  const [latestReadings, setLatestReadings] = useState<{ [punto: string]: SensorReading | null }>({});
  const [simulationStatus, setSimulationStatus] = useState<{ [punto: string]: boolean }>({});
  const [simulationState, setSimulationState] = useState<{ [punto: string]: SimulationStateType }>({});
  const [simulationProgress, setSimulationProgress] = useState<{ [punto: string]: number }>({});
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos reales
  const [realDataState, setRealDataState] = useState<{ [punto: string]: RealDataState }>({});
  const [dataSource, setDataSource] = useState<{ [punto: string]: DataSourceType }>({});
  
  // Referencias para evitar re-renders innecesarios
  const puntosRef = useRef<string[]>(puntos);
  const isConnectedRef = useRef(false);

  // Estado derivado
  const isConnected = connectionState === signalR.HubConnectionState.Connected;

  // Callback para manejar nuevos datos de sensores
  const handleSensorDataReceived = useCallback((data: RealtimeSensorData) => {
    const { latestReading, status } = data;
    const punto = latestReading.punto;
    
    // DETECTAR DATOS DE ARCHIVO RESETEADO
    if (status === 'real-time-reset') {
      
      // Actualizar estado para mostrar que estamos recibiendo datos reseteados
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          isAvailable: true,
          isMonitoring: true,
          sensorStatus: 'Recibiendo datos de archivo reseteado',
          lastUpdate: new Date()
        }
      }));
    }
    
    // Actualizar últimas lecturas
    setLatestReadings(prev => ({
      ...prev,
      [punto]: latestReading
    }));
    
    // Agregar a datos en tiempo real
    setRealtimeData(prev => {
      const currentData = prev[punto] || [];
      
      // Si es un reset, empezar con datos limpios
      let baseData = currentData;
      if (status === 'real-time-reset') {
        // Para datos reseteados, empezar con gráfica completamente limpia
        baseData = []; // LIMPIAR TODOS LOS DATOS ANTERIORES
      }
      
      // Verificar si ya existe este timestamp para evitar duplicados
      const existingIndex = baseData.findIndex(item => item.timestamp === latestReading.timestamp);
      
      let newData;
      if (existingIndex >= 0) {
        // Si existe, reemplazar el dato existente
        newData = [...baseData];
        newData[existingIndex] = latestReading;
      } else {
        // Si no existe, agregar al final
        newData = [...baseData, latestReading];
      }
      
      // Solo aplicar límite para simulaciones, no para datos reales históricos + tiempo real
      const currentDataSource = dataSource[punto];
      let trimmedData;
      
      if (currentDataSource === 'realtime' || status === 'real-time-reset') {
        // Para datos reales o reseteados, mantener MUCHOS MÁS datos (históricos + nuevos)
        const maxRealtimeData = maxDataPoints * 5; // Permitir 5x más datos para tiempo real
        trimmedData = newData.length > maxRealtimeData ? newData.slice(-maxRealtimeData) : newData;
        
        if (newData.length > maxRealtimeData) {
          console.log(`⚠️ [useRealtimeSensorData] Datos limitados para ${punto}: ${newData.length} → ${trimmedData.length} (máximo: ${maxRealtimeData})`);
        }
      } else {
        // Para simulación, mantener el límite normal
        trimmedData = newData.slice(-maxDataPoints);
      }
      
      return {
        ...prev,
        [punto]: trimmedData
      };
    });
    
    // Actualizar estado de simulación si viene en los datos
    if (status) {
      setSimulationStatus(prev => ({
        ...prev,
        [punto]: status === 'simulating'
      }));
      
      // Si recibimos datos reales después de estar detenido, quitar estado de "detenido"
      if (status === 'real-time' || status === 'real-time-reset') {
        setRealDataState(prev => ({
          ...prev,
          [punto]: {
            ...prev[punto],
            isMonitoring: true,
            sensorStatus: status === 'real-time-reset' ? 'Archivo reseteado - recibiendo datos' : 'Recibiendo datos en tiempo real'
          }
        }));
      }
    }
  }, [maxDataPoints, dataSource]);

  // Callback para cambios de estado de simulación
  const handleSimulationStatusChanged = useCallback((punto: string, isActive: boolean) => {
    setSimulationStatus(prev => ({
      ...prev,
      [punto]: isActive
    }));
  }, []);

  // Callback para cambios de estado de conexión
  const handleConnectionStateChanged = useCallback((state: signalR.HubConnectionState) => {
    setConnectionState(state);
    isConnectedRef.current = state === signalR.HubConnectionState.Connected;
    
    if (state === signalR.HubConnectionState.Connected) {
      setError(null);
    }
  }, []);

  // ========================
  // NUEVOS CALLBACKS PARA ALERTAS CRÍTICAS
  // ========================

  const handleCriticalAlertNotification = useCallback((alertData: CriticalAlertNotification) => {
    
    // Llamar al callback del componente padre si está disponible
    if (onCriticalAlert) {
      onCriticalAlert(alertData);
    }
  }, [onCriticalAlert]);

  const handleEmailSentNotification = useCallback((emailData: EmailSentNotification) => {
    
    // Llamar al callback del componente padre si está disponible
    if (onEmailSent) {
      onEmailSent(emailData);
    }
  }, [onEmailSent]);

  // NUEVOS CALLBACKS PARA DETECCIÓN MEJORADA DE CAMBIOS
  // ========================

  // Callback para cambios en el caché de datos reales
  const handleRealDataCacheUpdated = useCallback(async (notification: {
    Punto: string;
    RecordCount: number;
    ChangeType: 'cache_reloaded' | 'cache_invalidated';
    Timestamp: string;
    Message: string;
  }) => {
    
    // Extraer con fallbacks para compatibilidad con backend
    const notificationAny = notification as Record<string, unknown>;
    const punto = (notificationAny.Punto || notificationAny.punto) as string;
    const recordCount = ((notificationAny.RecordCount || notificationAny.recordCount) as number) || 0;
    const changeType = (notificationAny.ChangeType || notificationAny.changeType) as string;
    
    if (!punto) {
      console.warn(`⚠️ [useRealtimeSensorData] Notificación sin punto válido:`, notification);
      return;
    }
    
    if (changeType === 'cache_reloaded') {
      
      // Verificar si hay registros antes de intentar cargar
      if (recordCount === 0) {
        
        // Limpiar datos y marcar como no disponible
        setRealtimeData(prev => ({ ...prev, [punto]: [] }));
        setLatestReadings(prev => ({ ...prev, [punto]: null }));
        
        setRealDataState(prev => ({
          ...prev,
          [punto]: {
            ...prev[punto],
            isAvailable: false,
            lastUpdate: new Date()
          }
        }));
        
        setDataSource(prev => ({ ...prev, [punto]: 'simulated' }));
        return; // Salir temprano para evitar intentar cargar datos
      }
      
      // Recargar datos reales del backend - sin límite para obtener todos los datos
      try {
        const response = await GraphicsSectionService.getRealData(punto, { limit: 10000 }); // Límite muy alto para obtener todos los datos
        const newRealData = response.data || [];
        
        // Actualizar datos en tiempo real
        setRealtimeData(prev => ({ ...prev, [punto]: newRealData }));
        
        // Actualizar última lectura
        if (newRealData.length > 0) {
          setLatestReadings(prev => ({ 
            ...prev, 
            [punto]: newRealData[newRealData.length - 1] 
          }));
        }
        
        // Marcar como datos reales disponibles
        setRealDataState(prev => ({
          ...prev,
          [punto]: {
            ...prev[punto],
            isAvailable: true,
            lastUpdate: new Date()
          }
        }));
        
        setDataSource(prev => ({ ...prev, [punto]: 'realtime' }));
        
      } catch (error) {
        console.error(`❌ [useRealtimeSensorData] Error recargando datos para ${punto}:`, error);
        
        // En caso de error, marcar como no disponible
        setRealtimeData(prev => ({ ...prev, [punto]: [] }));
        setLatestReadings(prev => ({ ...prev, [punto]: null }));
        
        setRealDataState(prev => ({
          ...prev,
          [punto]: {
            ...prev[punto],
            isAvailable: false,
            lastUpdate: new Date()
          }
        }));
        
        setDataSource(prev => ({ ...prev, [punto]: 'simulated' }));
      }
      
    } else if (changeType === 'cache_invalidated') {
      
      // Limpiar datos y marcar como no disponible
      setRealtimeData(prev => ({ ...prev, [punto]: [] }));
      setLatestReadings(prev => ({ ...prev, [punto]: null }));
      
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          isAvailable: false,
          lastUpdate: new Date()
        }
      }));
      
      setDataSource(prev => ({ ...prev, [punto]: 'simulated' }));
    }
    
  }, []);

  // Callback para cambios en el estado de datos reales
  const handleRealDataStatusChanged = useCallback((notification: {
    Punto: string;
    RecordCount: number;
    Timestamp: string;
    Message: string;
  }) => {
    
    // Extraer con fallbacks para compatibilidad con backend
    const notificationAny = notification as Record<string, unknown>;
    const punto = (notificationAny.Punto || notificationAny.punto) as string;
    const recordCount = ((notificationAny.RecordCount || notificationAny.recordCount) as number) || 0;
    
    if (!punto) {
      console.warn(`⚠️ [useRealtimeSensorData] Notificación sin punto válido:`, notification);
      return;
    }
    
    const isAvailable = recordCount > 0;
    
    // Actualizar estado de disponibilidad
    setRealDataState(prev => ({
      ...prev,
      [punto]: {
        ...prev[punto],
        isAvailable,
        lastUpdate: new Date()
      }
    }));
    
  }, []);

  // Callback para cambios en archivos de datos reales
  const handleRealDataFileChanged = useCallback((notification: {
    Punto: string;
    ChangeType: 'file_modified' | 'file_deleted' | 'file_created';
    Timestamp: string;
    Message: string;
  }) => {
    
    const { Punto: punto, ChangeType: changeType } = notification;
    
    // Mostrar información al usuario sobre el cambio
    if (changeType === 'file_modified') {
      console.log(`🔄 [useRealtimeSensorData] Archivo de ${punto} modificado - datos actualizados automáticamente`);
    } else if (changeType === 'file_deleted') {
      console.log(`🗑️ [useRealtimeSensorData] Archivo de ${punto} eliminado - cambiando a simulación`);
    } else if (changeType === 'file_created') {
      console.log(`✨ [useRealtimeSensorData] Nuevo archivo de datos reales para ${punto}`);
    }
    
  }, []);

  // NUEVOS CALLBACKS PARA DETECCIÓN MEJORADA DE CAMBIOS
  const handleRealDataFileReset = useCallback(async (notification: {
    Punto: string;
    ChangeType: 'file_reset';
    TotalRecords: number;
    Timestamp: string;
    Message: string;
  }) => {
    
    // Intentar ambas variantes de la propiedad (por si el backend envía diferente)
    const punto = notification.Punto || (notification as unknown as { punto: string }).punto;
    const totalRecords = notification.TotalRecords || (notification as unknown as { totalRecords: number }).totalRecords;
    
    if (!punto) {
      console.error('❌ [Hook] Error: No se pudo obtener el punto del evento de reset:', notification);
      return;
    }
    
    // Limpiar datos actuales
    setRealtimeData(prev => ({ ...prev, [punto]: [] }));
    setLatestReadings(prev => ({ ...prev, [punto]: null }));
    
    // Actualizar estado para indicar que está esperando datos nuevos
    setRealDataState(prev => ({
      ...prev,
      [punto]: {
        ...prev[punto],
        isAvailable: true,
        isMonitoring: true,
        lastUpdate: new Date(),
        sensorStatus: `Archivo reseteado - ${totalRecords} registros nuevos detectados`
      }
    }));
    
    // Marcar como datos en tiempo real
    setDataSource(prev => ({ ...prev, [punto]: 'realtime' }));
    
    
  }, []);

  const handleRealDataFileStop = useCallback((notification: {
    Punto: string;
    ChangeType: 'file_stopped';
    Timestamp: string;
    Message: string;
  }) => {
    
    // Intentar ambas variantes de la propiedad (por si el backend envía diferente)
    const punto = notification.Punto || (notification as unknown as { punto: string }).punto;
    
    if (!punto) {
      console.error('❌ [Hook] Error: No se pudo obtener el punto del evento de stop:', notification);
      return;
    }
    
    // Actualizar estado para mostrar que no hay datos nuevos
    setRealDataState(prev => ({
      ...prev,
      [punto]: {
        ...prev[punto],
        isMonitoring: false, // Ya no está recibiendo datos activamente
        sensorStatus: 'Sin datos nuevos - archivo detuvo crecimiento',
        lastUpdate: new Date()
      }
    }));
    
    
  }, []);

  // Callback para errores
  const handleError = useCallback((error: Error) => {
    console.error('❌ [useRealtimeSensorData] Error:', error);
    setError(error.message);
  }, []);

  // ========================
  // FUNCIONES PARA DATOS REALES (Declaradas antes para evitar problemas de orden)
  // ========================

  const checkRealDataAvailability = useCallback(async (punto: string): Promise<boolean> => {
    try {
      
      const response = await GraphicsSectionService.checkRealDataAvailability(punto);
      
      // Intentar extraer los datos de diferentes lugares en la respuesta
      const responseObj = response as unknown as Record<string, unknown>;
      
      // CORRECCIÓN: El backend devuelve la información en dos lugares:
      // 1. Directamente en response: fileExists, hasData, available
      // 2. En response.data: exists, hasData, available
      
      // Intentar leer desde response principal primero (más confiable)
      let fileExists = false;
      let hasData = false;
      
      if (responseObj && typeof responseObj === 'object') {
        // Priorizar datos del response principal
        if ('fileExists' in responseObj) {
          fileExists = Boolean(responseObj.fileExists);
        }
        if ('hasData' in responseObj) {
          hasData = Boolean(responseObj.hasData);
        }
        
        // Si no encontramos en response principal, buscar en response.data
        if (!fileExists && response.data && typeof response.data === 'object') {
          const dataObj = response.data as unknown as Record<string, unknown>;
          if ('exists' in dataObj) {
            fileExists = Boolean(dataObj.exists);
          }
          if ('hasData' in dataObj) {
            hasData = Boolean(dataObj.hasData);
          }
        }
      }
      
      const isAvailable = fileExists && hasData;
      
      // Extraer timestamp y message de forma segura desde response principal
      const timestampValue = (responseObj && typeof responseObj === 'object' && 
        'timestamp' in responseObj) ? responseObj.timestamp : new Date().toISOString();
      const messageValue = (responseObj && typeof responseObj === 'object' && 
        'message' in responseObj && typeof responseObj.message === 'string') ? 
        responseObj.message : 'Estado de datos reales verificado';
      
      // Actualizar estado de datos reales
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          isAvailable,
          isMonitoring: false, // Se determinará con getRealTimeStatus
          lastUpdate: new Date(timestampValue as string),
          sensorStatus: messageValue
        }
      }));
      
      // Establecer fuente de datos apropiada
      setDataSource(prev => ({ 
        ...prev, 
        [punto]: isAvailable ? 'historical' : 'simulated' 
      }));
      
      return isAvailable;
    } catch (error) {
      console.error(`❌ [useRealtimeSensorData] Error checking real data availability for ${punto}:`, error);
      
      // En caso de error, asumir que no hay datos reales disponibles
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          isAvailable: false,
          isMonitoring: false,
          lastUpdate: new Date(),
          sensorStatus: 'Error al verificar disponibilidad'
        }
      }));
      
      setDataSource(prev => ({ ...prev, [punto]: 'simulated' }));

      return false;
    }
  }, []);

  // ========================
  // FUNCIONES DE CONEXIÓN
  // ========================

  // Función para conectar
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Iniciar conexión SignalR
      await GraphicsSectionService.startRealtimeConnection({
        onSensorDataReceived: handleSensorDataReceived,
        onSimulationStatusChanged: handleSimulationStatusChanged,
        onConnectionStateChanged: handleConnectionStateChanged,
        onError: handleError,
        // CALLBACKS EXISTENTES PARA GESTIÓN DE CACHÉ
        onRealDataCacheUpdated: handleRealDataCacheUpdated,
        onRealDataStatusChanged: handleRealDataStatusChanged,
        onRealDataFileChanged: handleRealDataFileChanged,
        // NUEVOS CALLBACKS PARA DETECCIÓN MEJORADA
        onRealDataFileReset: handleRealDataFileReset,
        onRealDataFileStop: handleRealDataFileStop,
        // NUEVOS CALLBACKS PARA ALERTAS CRÍTICAS
        onCriticalAlertNotification: handleCriticalAlertNotification,
        onEmailSentNotification: handleEmailSentNotification
      });
      
      // Suscribirse a todos los puntos
      await GraphicsSectionService.subscribeToMultiplePoints(puntosRef.current);
      
      for (const punto of puntosRef.current) {
        try {
          const isAvailable = await checkRealDataAvailability(punto);
          console.log(`📊 [useRealtimeSensorData] Post-conexión - ${punto}: Datos reales ${isAvailable ? 'DISPONIBLES' : 'NO DISPONIBLES'}`);
        } catch (error) {
          console.error(`❌ [useRealtimeSensorData] Error verificando ${punto} tras conexión:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ [useRealtimeSensorData] Error al conectar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    }
  }, [handleSensorDataReceived, handleSimulationStatusChanged, handleConnectionStateChanged, handleError, checkRealDataAvailability, handleRealDataCacheUpdated, handleRealDataStatusChanged, handleRealDataFileChanged, handleRealDataFileReset, handleRealDataFileStop, handleCriticalAlertNotification, handleEmailSentNotification]);

  // Función para desconectar
  const disconnect = useCallback(async () => {
    try {
      if (isConnectedRef.current) {
        // Desuscribirse de todos los puntos
        await GraphicsSectionService.unsubscribeFromMultiplePoints(puntosRef.current);
      }
      
      // Detener conexión
      await GraphicsSectionService.stopRealtimeConnection();
      
    } catch (error) {
      console.error('❌ [useRealtimeSensorData] Error al desconectar:', error);
    }
  }, []);

  // Función para alternar simulación
  const toggleSimulation = useCallback(async (punto: string) => {
    try {
      const isCurrentlySimulating = simulationStatus[punto] || false;
      
      if (isCurrentlySimulating) {
        await GraphicsSectionService.stopSimulation(punto);
      } else {
        setRealtimeData(prev => ({ ...prev, [punto]: [] }));
        setLatestReadings(prev => ({ ...prev, [punto]: null }));
        
        await GraphicsSectionService.startSimulation(punto);
      }
    } catch (error) {
      console.error(`❌ [useRealtimeSensorData] Error al alternar simulación para ${punto}:`, error);
      setError(error instanceof Error ? error.message : 'Error al alternar simulación');
    }
  }, [simulationStatus]);

  // Función para limpiar datos
  const clearData = useCallback((punto?: string) => {
    if (punto) {
      // Limpiar datos de un punto específico
      setRealtimeData(prev => ({ ...prev, [punto]: [] }));
      setLatestReadings(prev => ({ ...prev, [punto]: null }));
    } else {
      // Limpiar todos los datos
      setRealtimeData({});
      setLatestReadings({});
    }
  }, []);

  // Función para refrescar datos estáticos (históricos)
  const refreshStaticData = useCallback(async () => {
    try {
      
      const staticData = await GraphicsSectionService.getMultiplePointsData(puntosRef.current, {
        limit: 100 // Obtener últimos 100 registros históricos
      });
      
      // Reemplazar datos en tiempo real con datos estáticos
      setRealtimeData(staticData);
      
      // Actualizar últimas lecturas con el dato más reciente de cada punto
      const newLatestReadings: { [punto: string]: SensorReading | null } = {};
      Object.entries(staticData).forEach(([punto, data]) => {
        if (data.length > 0) {
          newLatestReadings[punto] = data[data.length - 1];
        }
      });
      setLatestReadings(newLatestReadings);
    } catch (error) {
      console.error('❌ [useRealtimeSensorData] Error al refrescar datos estáticos:', error);
      setError(error instanceof Error ? error.message : 'Error al refrescar datos');
    }
  }, []);

  // Efecto para auto-conectar y gestionar cambios en puntos
  useEffect(() => {
    puntosRef.current = puntos;
    
    // Solo auto-conectar si está habilitado Y tenemos puntos
    if (autoConnect && puntos.length > 0) {
      connect();
    }
    
    // Cleanup al desmontar o cambiar puntos
    return () => {
      if (isConnectedRef.current && puntos.length === 0) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos, autoConnect]); // Intencionalmente omitimos connect/disconnect para evitar reconexiones automáticas

  // Funciones de simulación mejoradas
  const startSimulation = async (punto: string) => {
    try {
      setError(null);
      
      // IMPORTANTE: Limpiar datos antes de iniciar simulación gradual
      setRealtimeData(prev => ({ ...prev, [punto]: [] }));
      setLatestReadings(prev => ({ ...prev, [punto]: null }));
      
      await GraphicsSectionService.startSimulation(punto);
      setSimulationStatus(prev => ({ ...prev, [punto]: true }));
      setSimulationState(prev => ({ ...prev, [punto]: SimulationState.RUNNING }));
      
    } catch (error) {
      console.error('Error starting simulation:', error);
      setError(`Error al iniciar simulación para ${punto}`);
    }
  };

  const pauseSimulation = async (punto: string) => {
    try {
      setError(null);
      await GraphicsSectionService.pauseSimulation(punto);
      setSimulationState(prev => ({ ...prev, [punto]: SimulationState.PAUSED }));
    } catch (error) {
      console.error('Error pausing simulation:', error);
      setError(`Error al pausar simulación para ${punto}`);
    }
  };

  const resumeSimulation = async (punto: string) => {
    try {
      setError(null);
      await GraphicsSectionService.resumeSimulation(punto);
      setSimulationState(prev => ({ ...prev, [punto]: SimulationState.RUNNING }));
    } catch (error) {
      console.error('Error resuming simulation:', error);
      setError(`Error al reanudar simulación para ${punto}`);
    }
  };

  const restartSimulation = async (punto: string) => {
    try {
      setError(null);
      
      setRealtimeData(prev => ({ ...prev, [punto]: [] }));
      setLatestReadings(prev => ({ ...prev, [punto]: null }));
      
      await GraphicsSectionService.restartSimulation(punto);
      setSimulationStatus(prev => ({ ...prev, [punto]: true }));
      setSimulationState(prev => ({ ...prev, [punto]: SimulationState.RUNNING }));
      setSimulationProgress(prev => ({ ...prev, [punto]: 0 }));
      
    } catch (error) {
      console.error('Error restarting simulation:', error);
      setError(`Error al reiniciar simulación para ${punto}`);
    }
  };

  const stopSimulation = async (punto: string) => {
    try {
      setError(null);
      
      await GraphicsSectionService.stopSimulation(punto);
      setSimulationStatus(prev => ({ ...prev, [punto]: false }));
      setSimulationState(prev => ({ ...prev, [punto]: SimulationState.STOPPED }));
      setSimulationProgress(prev => ({ ...prev, [punto]: 0 }));

    } catch (error) {
      console.error('Error stopping simulation:', error);
      setError(`Error al detener simulación para ${punto}`);
    }
  };

  // Nueva función para cargar datos estáticos completos
  const loadFullStaticData = async (punto: string) => {
    try {
      setError(null);
      // Cargar datos históricos completos
      const response = await GraphicsSectionService.getSensorData({
        punto,
        limit: 500 // Cargar más datos para vista completa
      });
      
      if (response.data && response.data.length > 0) {
        // Reemplazar los datos en tiempo real con los datos estáticos completos
        setRealtimeData(prev => ({ 
          ...prev, 
          [punto]: response.data 
        }));
        
        // Actualizar última lectura
        const latestReading = response.data[response.data.length - 1];
        setLatestReadings(prev => ({ 
          ...prev, 
          [punto]: latestReading 
        }));
        
      } else {
        console.warn(`⚠️ [useRealtimeSensorData] No se encontraron datos estáticos para: ${punto}`);
      }
      
    } catch (error) {
      console.error(`❌ [useRealtimeSensorData] Error cargando datos estáticos completos para ${punto}:`, error);
      setError(`Error al cargar datos completos para ${punto}`);
    }
  };

  const getSimulationStatus = async (punto: string): Promise<SimulationStatus | null> => {
    try {
      const response = await GraphicsSectionService.getSimulationStatus(punto);
      return response?.data || null;
    } catch (error) {
      console.error('Error getting simulation status:', error);
      return null;
    }
  };

  // ========================
  // FUNCIONES PARA DATOS REALES (continuación)
  // ========================

  const startRealTimeMonitoring = async (punto: string): Promise<void> => {
    try {
      setError(null);
      
      // Verificar disponibilidad primero
      const isAvailable = await checkRealDataAvailability(punto);
      if (!isAvailable) {
        throw new Error(`No hay datos reales disponibles para el punto ${punto}`);
      }
      
      // Iniciar monitoreo en tiempo real
      await GraphicsSectionService.startRealTimeMonitoring(punto);
      
      // Actualizar estado
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          isMonitoring: true
        }
      }));
      
      setDataSource(prev => ({ ...prev, [punto]: 'realtime' }));
      
    } catch (error) {
      console.error(`Error starting real-time monitoring for ${punto}:`, error);
      setError(`Error al iniciar monitoreo en tiempo real para ${punto}`);
    }
  };

  const stopRealTimeMonitoring = async (punto: string): Promise<void> => {
    try {
      setError(null);
      
      await GraphicsSectionService.stopRealTimeMonitoring(punto);
      
      // Actualizar estado
      setRealDataState(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          isMonitoring: false
        }
      }));
      
      setDataSource(prev => ({ ...prev, [punto]: 'historical' }));
      
    } catch (error) {
      console.error(`Error stopping real-time monitoring for ${punto}:`, error);
      setError(`Error al detener monitoreo en tiempo real para ${punto}`);
    }
  };

  const switchToRealData = async (punto: string): Promise<void> => {
    try {
      setError(null);
      
      // Detener simulación si está activa
      if (simulationStatus[punto]) {
        await stopSimulation(punto);
      }
      
      // Verificar disponibilidad de datos reales
      const isAvailable = await checkRealDataAvailability(punto);
      
      if (isAvailable) {
        // VERIFICAR: ¿Cuántos datos reales hay disponibles en total?
        const allRealDataResponse = await GraphicsSectionService.getRealData(punto, {
          limit: 10000 // Límite alto para obtener todos los datos disponibles
        });
        const totalRealAvailable = allRealDataResponse.data?.length || 0;
        
        // PRIMERO: Cargar TODOS los datos REALES históricos disponibles
        const historicalRealDataResponse = await GraphicsSectionService.getRealData(punto, {
          limit: 10000 // Aumentado para obtener todos los datos reales históricos
        });
        
        const historicalRealData = historicalRealDataResponse.data || [];
        
        if (historicalRealData.length < totalRealAvailable) {
          console.log(`⚠️ [useRealtimeSensorData] ADVERTENCIA: Solo se cargaron ${historicalRealData.length} de ${totalRealAvailable} datos REALES disponibles`);
          console.log(`💡 [useRealtimeSensorData] Para ver todos los datos reales, aumenta el límite en la configuración`);
        }
        
        if (historicalRealData.length > 0) {
          const firstRecord = historicalRealData[0];
          const lastRecord = historicalRealData[historicalRealData.length - 1];
          console.log(`📊 [useRealtimeSensorData] - Rango temporal REAL: ${firstRecord.timestamp} → ${lastRecord.timestamp}`);
          console.log(`📊 [useRealtimeSensorData] - Primer registro REAL:`, firstRecord);
          console.log(`📊 [useRealtimeSensorData] - Último registro REAL:`, lastRecord);
        }
        
        // Establecer datos reales históricos como base
        setRealtimeData(prev => ({ ...prev, [punto]: historicalRealData }));
        
        if (historicalRealData.length > 0) {
          setLatestReadings(prev => ({ ...prev, [punto]: historicalRealData[historicalRealData.length - 1] }));
        }
        
        // SEGUNDO: Marcar como datos reales para que los nuevos datos se agreguen
        setDataSource(prev => ({ ...prev, [punto]: 'realtime' }));

      } else {
        // Fallback a datos históricos si no hay datos reales
        await loadHistoricalData(punto, { limit: maxDataPoints });
        setDataSource(prev => ({ ...prev, [punto]: 'historical' }));
        
      }
    } catch (error) {
      console.error(`Error switching to real data for ${punto}:`, error);
      setError(`Error al cambiar a datos reales para ${punto}`);
    }
  };

  const switchToSimulatedData = async (punto: string): Promise<void> => {
    try {
      setError(null);
      
      // Detener monitoreo en tiempo real si está activo
      const realState = realDataState[punto];
      if (realState?.isMonitoring) {
        await stopRealTimeMonitoring(punto);
      }
      
      // Limpiar datos reales
      setRealtimeData(prev => ({ ...prev, [punto]: [] }));
      setLatestReadings(prev => ({ ...prev, [punto]: null }));
      
      setDataSource(prev => ({ ...prev, [punto]: 'simulated' }));
      
    } catch (error) {
      console.error(`Error switching to simulated data for ${punto}:`, error);
      setError(`Error al cambiar a datos simulados para ${punto}`);
    }
  };

  const loadHistoricalData = async (punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }): Promise<void> => {
    try {
      setError(null);
      
      const response = await GraphicsSectionService.getHistoricalData(punto, params);
      const historicalData = response.data || [];
      
      setRealtimeData(prev => ({ ...prev, [punto]: historicalData }));
      
      if (historicalData.length > 0) {
        setLatestReadings(prev => ({ ...prev, [punto]: historicalData[historicalData.length - 1] }));
      }
      
      setDataSource(prev => ({ ...prev, [punto]: 'historical' }));
      
    } catch (error) {
      console.error(`Error loading historical data for ${punto}:`, error);
      setError(`Error al cargar datos históricos para ${punto}`);
    }
  };

  // Efecto para cargar estados de simulación iniciales mejorados
  useEffect(() => {
    const loadSimulationStates = async () => {
      try {
        const states: { [punto: string]: boolean } = {};
        const simStates: { [punto: string]: SimulationStateType } = {};
        const progresses: { [punto: string]: number } = {};
        
        for (const punto of puntos) {
          const status = await getSimulationStatus(punto);
          if (status) {
            states[punto] = status.isActive;
            simStates[punto] = status.isActive ? 
              (status.isPaused ? SimulationState.PAUSED : SimulationState.RUNNING) : 
              SimulationState.STOPPED;
            progresses[punto] = status.progress || 0;
          } else {
            // Fallback al método anterior
            const isSimulating = await GraphicsSectionService.isSimulating(punto);
            states[punto] = isSimulating;
            simStates[punto] = isSimulating ? SimulationState.RUNNING : SimulationState.STOPPED;
            progresses[punto] = 0;
          }
        }
        
        setSimulationStatus(states);
        setSimulationState(simStates);
        setSimulationProgress(progresses);
      } catch (error) {
        console.error('Error loading simulation states:', error);
      }
    };
    
    if (puntos.length > 0) {
      loadSimulationStates();
    }
  }, [puntos]);

  // Efecto para inicializar estados de datos reales
  useEffect(() => {
    const initializeRealDataStates = async () => {
      try {
        
        const initialRealDataStates: { [punto: string]: RealDataState } = {};
        const initialDataSources: { [punto: string]: DataSourceType } = {};
        
        for (const punto of puntos) {
          // Verificar disponibilidad de datos reales
          try {
            
            const response = await GraphicsSectionService.checkRealDataAvailability(punto);
            
            // Usar la misma lógica que en checkRealDataAvailability
            const responseObj = response as unknown as Record<string, unknown>;
            
            // Leer datos de la misma forma que en checkRealDataAvailability
            let fileExists = false;
            let hasData = false;
            
            if (responseObj && typeof responseObj === 'object') {
              // Priorizar datos del response principal
              if ('fileExists' in responseObj) {
                fileExists = Boolean(responseObj.fileExists);
              }
              if ('hasData' in responseObj) {
                hasData = Boolean(responseObj.hasData);
              }
              
              // Si no encontramos en response principal, buscar en response.data
              if (!fileExists && response.data && typeof response.data === 'object') {
                const dataObj = response.data as unknown as Record<string, unknown>;
                if ('exists' in dataObj) {
                  fileExists = Boolean(dataObj.exists);
                }
                if ('hasData' in dataObj) {
                  hasData = Boolean(dataObj.hasData);
                }
              }
            }
            
            const isAvailable = fileExists && hasData;
            
            const timestampValue = (responseObj && typeof responseObj === 'object' && 
              'timestamp' in responseObj) ? responseObj.timestamp : new Date().toISOString();
            const messageValue = (responseObj && typeof responseObj === 'object' && 
              'message' in responseObj && typeof responseObj.message === 'string') ? 
              responseObj.message : 'Estado de datos reales verificado';
              
            initialRealDataStates[punto] = {
              isAvailable,
              isMonitoring: false,
              lastUpdate: new Date(timestampValue as string),
              sensorStatus: messageValue
            };
            
            // Determinar fuente de datos inicial
            initialDataSources[punto] = isAvailable ? 'historical' : 'simulated';
              
          } catch (error) {
            console.warn(`❌ [useRealtimeSensorData] No se pudo verificar disponibilidad de datos reales para ${punto}:`, error);
            initialRealDataStates[punto] = {
              isAvailable: false,
              isMonitoring: false,
              lastUpdate: new Date(),
              sensorStatus: 'Error al verificar disponibilidad'
            };
            initialDataSources[punto] = 'simulated';
          }
        }
        
        setRealDataState(initialRealDataStates);
        setDataSource(initialDataSources);
        
      } catch (error) {
        console.error('❌ [useRealtimeSensorData] Error initializing real data states:', error);
      }
    };
    
    if (puntos.length > 0) {
      initializeRealDataStates();
    }
  }, [puntos]);

  // Efecto adicional para verificar datos reales cuando se conecta
  useEffect(() => {
    const checkDataWhenConnected = async () => {
      if (isConnected && puntos.length > 0) {
        
        try {
          for (const punto of puntos) {
            
            const isAvailable = await checkRealDataAvailability(punto);
            console.log(`📊 [useRealtimeSensorData] ${punto}: Datos reales ${isAvailable ? 'DISPONIBLES' : 'NO DISPONIBLES'} tras conexión`);
          }
        } catch (error) {
          console.error('❌ [useRealtimeSensorData] Error verificando datos tras conexión:', error);
        }
      }
    };
    
    checkDataWhenConnected();
  }, [isConnected, puntos, checkRealDataAvailability]);

  return {
    // Estados principales
    realtimeData,
    latestReadings,
    simulationStatus,
    simulationState,
    simulationProgress,
    connectionState,
    isConnected,
    error,
    
    // Estados de datos reales
    realDataState,
    dataSource,
    
    // Acciones de conexión
    connect,
    disconnect,
    
    // Acciones de simulación
    toggleSimulation,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    restartSimulation,
    stopSimulation,
    getSimulationStatus,
    
    // Acciones de datos reales
    checkRealDataAvailability,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    switchToRealData,
    switchToSimulatedData,
    loadHistoricalData,
    loadFullStaticData,
    
    // Utilidades
    clearData,
    refreshStaticData
  };
};

export default useRealtimeSensorData;
