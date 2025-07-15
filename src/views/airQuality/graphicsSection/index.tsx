'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, CardContent, Typography, Box, Chip, Switch, FormControlLabel, Alert, LinearProgress, ButtonGroup, Tooltip, Snackbar, Badge } from '@mui/material';
import { TrendingUp, PlayArrow, Stop, Pause, RestartAlt, Refresh, Cloud, CloudOff, Speed, Timeline, Computer, RadioButtonChecked, FiberManualRecord, Warning, Email, NotificationsActive } from '@mui/icons-material';
import GraphicsComponent from '@/components/graphics';
import DataSourceIndicator from '@/components/DataSourceIndicator';
import DataSourceSummary from '@/components/DataSourceSummary';
import AlertIndicator from '@/components/AlertIndicator';
import CriticalAlertsDisplay from '@/components/CriticalAlertsDisplay';
import GraphicsSectionService, {
    SensorReading,
    SimulationState
} from '@/services/airQuality/graphicsSection.service';
import { useRealtimeSensorData } from '@/hooks/useRealtimeSensorData';
import { useCriticalAlerts } from '@/hooks/useCriticalAlerts';
import { MultiPointStatusIndicator } from '@/components/RealtimeStatusIndicator';

// Interfaces para las nuevas señales SignalR mejoradas
// Interfaces para las nuevas señales de SignalR del backend mejorado
interface CriticalValue {
    Parameter: string;
    Value: number;
    Unit: string;
    Threshold: number;
}

interface CriticalAlertSignal {
    Punto: string;
    Timestamp: string;
    CriticalValues: CriticalValue[];
}

interface EmailSentSignal {
    Punto: string;
    UserEmail: string;
    EmailSentTo?: string;
    Timestamp: string;
}

export default function GraphicsSection() {
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
    const [showGraphs, setShowGraphs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [switchingMode, setSwitchingMode] = useState(false);
    const [availablePoints, setAvailablePoints] = useState<string[]>([]);
    const [dataMode, setDataMode] = useState<'static' | 'realtime'>('static');
    
    // Estado para notificaciones de cambios en archivos
    const [fileNotifications, setFileNotifications] = useState<{ [key: string]: {
        type: 'reset' | 'stopped' | 'active';
        message: string;
        timestamp: Date;
    } }>({});

    // Estado para controlar pausa de gráficas en tiempo real
    const [pausedGraphs, setPausedGraphs] = useState<{ [key: string]: boolean }>({});
    const [frozenData, setFrozenData] = useState<{ [key: string]: SensorReading[] }>({});

    // Estados para datos estáticos (históricos)
    const [staticSensorData, setStaticSensorData] = useState<{ [key: string]: SensorReading[] }>({});
    const [staticDataStatus, setStaticDataStatus] = useState<{ [key: string]: 'real-time' | 'simulating' | 'unknown' }>({});

    // Estados para alertas críticas y notificaciones
    const [alertSnackbar, setAlertSnackbar] = useState<{
        open: boolean;
        type: 'critical' | 'email' | 'reset';
        message: string;
        punto: string;
        autoHide: boolean;
    }>({
        open: false,
        type: 'critical',
        message: '',
        punto: '',
        autoHide: true
    });

    const [showAlertsPanel, setShowAlertsPanel] = useState(false);

    // Estado para notificaciones de email
    const [emailNotifications, setEmailNotifications] = useState<Array<{
        id: string;
        punto: string;
        email: string;
        timestamp: Date;
        message: string;
    }>>([]);

    // Hook para datos en tiempo real con SignalR
    const {
        realtimeData,
        latestReadings,
        simulationStatus,
        simulationState,
        simulationProgress,
        connectionState,
        isConnected,
        // Estados de datos reales
        realDataState,
        dataSource,
        // Acciones de conexión
        connect,
        disconnect,
        // Acciones de simulación
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        restartSimulation,
        stopSimulation,
        startRealTimeMonitoring,
        switchToRealData,
        switchToSimulatedData,
        loadFullStaticData
    } = useRealtimeSensorData({
        puntos: availablePoints,
        maxDataPoints: 500,
        autoConnect: false,
        // Callbacks para alertas críticas
        onCriticalAlert: (alertData) => {
            // Convertir al formato local
            const criticalAlertSignal: CriticalAlertSignal = {
                Punto: alertData.Punto,
                Timestamp: alertData.Timestamp,
                CriticalValues: alertData.CriticalValues.map(cv => ({
                    Parameter: cv.Parameter,
                    Value: cv.Value,
                    Unit: cv.Unit,
                    Threshold: cv.Threshold
                }))
            };
            handleCriticalAlertReceived(criticalAlertSignal);
        },
        onEmailSent: (emailData) => {
            // Convertir al formato local
            const emailSentSignal: EmailSentSignal = {
                Punto: emailData.Punto,
                UserEmail: emailData.EmailSentTo,
                EmailSentTo: emailData.EmailSentTo,
                Timestamp: emailData.Timestamp
            };
            handleEmailSentReceived(emailSentSignal);
        }
    });

    // Hook para gestión de alertas críticas
    const {
        activeAlerts,
        alertStatus,
        monitoringStatus,
        isLoading: alertsLoading,
        resetAlert,
        getAlertStatusForPoint,
        getAlertsForPoint
    } = useCriticalAlerts({
        autoRefresh: true,
        refreshInterval: 30000,
        maxAlertHistory: 50,
        maxEmailHistory: 100
    });

    // ========================
    // INTEGRACIÓN CON SIGNALR PARA ALERTAS
    // ========================

    // Función para manejar alertas críticas recibidas por SignalR
    const handleCriticalAlertReceived = useCallback((alertData: CriticalAlertSignal) => {
        
        // Mostrar notificación visual prominente
        const criticalParams = alertData.CriticalValues
            ?.map((cv: CriticalValue) => `${cv.Parameter}: ${cv.Value} ${cv.Unit}`)
            .join(', ') || 'Valores críticos detectados';
            
        setAlertSnackbar({
            open: true,
            type: 'critical',
            message: `🚨 ALERTA CRÍTICA en ${alertData.Punto}: ${criticalParams}`,
            punto: alertData.Punto,
            autoHide: false // No ocultar automáticamente las alertas críticas
        });
        
        // Marcar el punto como crítico en las notificaciones locales
        setFileNotifications(prev => ({
            ...prev,
            [alertData.Punto]: {
                type: 'active',
                message: `🚨 ALERTA CRÍTICA: ${criticalParams}`,
                timestamp: new Date(alertData.Timestamp)
            }
        }));
        
        // Refrescar estado de alertas para obtener los datos actualizados
        setTimeout(() => {
            getAlertStatusForPoint(alertData.Punto);
        }, 1000);
        
    }, [getAlertStatusForPoint]);

    // Función para manejar confirmaciones de email enviado
    const handleEmailSentReceived = useCallback((emailData: EmailSentSignal) => {
        
        // Agregar a la lista de notificaciones de email
        const emailNotification = {
            id: Date.now().toString(),
            punto: emailData.Punto || 'Sistema',
            email: emailData.UserEmail || emailData.EmailSentTo || 'usuario',
            timestamp: new Date(emailData.Timestamp),
            message: `Email de alerta crítica enviado exitosamente`
        };
        
        setEmailNotifications(prev => [emailNotification, ...prev.slice(0, 9)]); // Mantener solo las últimas 10
        
        // Delay para asegurar que la notificación se muestre después de otras notificaciones
        setTimeout(() => {
            // Mostrar notificación de confirmación con alta prioridad
            setAlertSnackbar({
                open: true,
                type: 'email',
                message: `📧 ¡Email de alerta enviado exitosamente! Destinatario: ${emailData.UserEmail || emailData.EmailSentTo || 'usuario'}`,
                punto: emailData.Punto || 'Sistema',
                autoHide: false // Cambiar a false para que sea más visible
            });
            
        }, 1500); // Delay de 1.5 segundos para asegurar visibilidad
        
        // Refrescar estado de alertas para mostrar la información del email
        if (emailData.Punto) {
            setTimeout(() => {
                getAlertStatusForPoint(emailData.Punto);
            }, 2000); // Delay mayor para el refresh
        }
        
    }, [getAlertStatusForPoint]);

    // Los eventos de SignalR para alertas se manejan automáticamente dentro del hook useRealtimeSensorData
    // pero necesitamos conectar los manejadores locales con los eventos recibidos
    useEffect(() => {
        if (isConnected) {
            
            // Las funciones handleCriticalAlertReceived y handleEmailSentReceived están listas
            // para ser utilizadas cuando el hook useRealtimeSensorData las necesite
        }
    }, [isConnected]);

    // Cargar estado de alertas cuando cambien los puntos disponibles
    useEffect(() => {
        if (availablePoints.length > 0 && dataMode === 'realtime') {
            availablePoints.forEach(punto => {
                getAlertStatusForPoint(punto);
            });
        }
    }, [availablePoints, dataMode, getAlertStatusForPoint]);

    // Determinar qué datos usar según el modo - memorizado para evitar re-cálculos
    const currentSensorData = useMemo(() => {
        if (dataMode === 'static') {
            return staticSensorData;
        } else {
            // En modo realtime, crear un objeto que contenga todos los puntos disponibles
            const mergedData: { [key: string]: SensorReading[] } = {};
            
            // Asegurar que todos los puntos disponibles estén representados
            availablePoints.forEach(punto => {
                // Verificar si el punto tiene datos reales disponibles
                const hasRealData = realDataState[punto]?.isAvailable;
                const dataSourceType = dataSource[punto];
                const isPaused = pausedGraphs[punto] || false;
                
                // Solo logging ocasional para debugging sin spam
                if (Math.random() < 0.1) { // Solo 10% de las veces
                    
                    // Información adicional para datos en tiempo real
                    if (dataSourceType === 'realtime' && realtimeData[punto]?.length) {
                        const realtimeDataArray = realtimeData[punto];
                        const firstTimestamp = realtimeDataArray[0]?.timestamp;
                        const lastTimestamp = realtimeDataArray[realtimeDataArray.length - 1]?.timestamp;
                        console.log(`⏰ [${punto}] Datos desde: ${firstTimestamp} hasta: ${lastTimestamp}`);
                        console.log(`📈 [${punto}] Total datos disponibles: ${realtimeDataArray.length}`);
                    }
                }
                
                if (hasRealData && (dataSourceType === 'realtime' || dataSourceType === 'historical')) {
                    // Para puntos con datos reales disponibles
                    if (isPaused && frozenData[punto]) {
                        // Si está pausado, usar datos congelados
                        mergedData[punto] = frozenData[punto];
                        if (Math.random() < 0.05) { // Solo 5% de las veces para evitar spam
                            console.log(`❄️ [${punto}] Usando datos congelados: ${frozenData[punto].length} registros`);
                        }
                    } else {
                        // Si no está pausado, usar datos en tiempo real
                        mergedData[punto] = realtimeData[punto] || [];
                    }
                } else {
                    // Para puntos sin datos reales, usar simulación o datos estáticos
                    mergedData[punto] = realtimeData[punto] || staticSensorData[punto] || [];
                }
            });
            
            return mergedData;
        }
    }, [dataMode, staticSensorData, availablePoints, realDataState, dataSource, realtimeData, pausedGraphs, frozenData]);

    const currentDataStatus = useMemo(() => {
        if (dataMode === 'static') {
            return staticDataStatus;
        } else {
            // En modo realtime, asegurar que todos los puntos tengan estado
            const mergedStatus: { [key: string]: 'real-time' | 'simulating' | 'unknown' } = {};
            
            availablePoints.forEach(punto => {
                const isSimulating = simulationStatus[punto] || false;
                const hasRealData = realDataState[punto]?.isAvailable;
                const dataSourceType = dataSource[punto];
                
                if (isSimulating) {
                    mergedStatus[punto] = 'simulating';
                } else if (hasRealData && (dataSourceType === 'realtime' || dataSourceType === 'historical')) {
                    mergedStatus[punto] = 'real-time';
                } else {
                    mergedStatus[punto] = 'unknown';
                }
                
                // Solo logging ocasional para debugging sin spam
                if (Math.random() < 0.1) { // Solo 10% de las veces
                    console.log(`📊 [${punto}] Estado final: ${mergedStatus[punto]} (isSimulating: ${isSimulating}, hasRealData: ${hasRealData}, dataSource: ${dataSourceType})`);
                }
            });
            
            return mergedStatus;
        }
    }, [dataMode, staticDataStatus, availablePoints, simulationStatus, realDataState, dataSource]);

    // Función auxiliar para obtener el estado de simulación mejorado
    const getEnhancedStatus = (punto: string) => {
        if (dataMode === 'static') {
            return {
                state: SimulationState.STOPPED,
                progress: 0,
                isActive: false,
                status: staticDataStatus[punto] || 'unknown'
            };
        }

        return {
            state: simulationState[punto] || SimulationState.STOPPED,
            progress: simulationProgress[punto] || 0,
            isActive: simulationStatus[punto] || false,
            status: simulationState[punto] === SimulationState.RUNNING ? 'simulating' as const : 'real-time' as const
        };
    };

    // Función mejorada para control de simulación
    const handleSimulationControl = async (punto: string, action: 'start' | 'pause' | 'resume' | 'restart' | 'stop') => {
        try {
            switch (action) {
                case 'start':
                    await startSimulation(punto);
                    break;
                case 'pause':
                    await pauseSimulation(punto);
                    break;
                case 'resume':
                    await resumeSimulation(punto);
                    break;
                case 'restart':
                    await restartSimulation(punto);
                    break;
                case 'stop':
                    await stopSimulation(punto);
                    break;
            }
        } catch (error) {
            console.error(`Error en acción ${action} para ${punto}:`, error);
        }
    };

    // ========================
    // FUNCIONES PARA CONTROL DE TIEMPO REAL
    // ========================

    const handleRealTimeControl = useCallback(async (punto: string, action: 'start' | 'pause') => {
        try {
            switch (action) {
                case 'start':
                    
                    // Quitar de pausa local
                    setPausedGraphs(prev => ({ ...prev, [punto]: false }));
                    
                    // Iniciar monitoreo real en el backend
                    await startRealTimeMonitoring(punto);
                    
                    break;
                    
                case 'pause':
                    
                    // Congelar datos actuales
                    const currentData = realtimeData[punto] || [];
                    setFrozenData(prev => ({ ...prev, [punto]: [...currentData] }));
                    
                    // Marcar como pausado localmente
                    setPausedGraphs(prev => ({ ...prev, [punto]: true }));
                    
                    // NO detener el monitoreo en el backend - los datos siguen llegando
                    // await stopRealTimeMonitoring(punto); // <-- Comentado para que sigan llegando datos
                    
                    break;
            }
        } catch (error) {
            console.error(`❌ Error en acción de tiempo real ${action} para ${punto}:`, error);
        }
    }, [startRealTimeMonitoring, realtimeData]);

    // ========================
    // EFECTOS PARA AUTO-INICIO DE TIEMPO REAL
    // ========================

    // Auto-iniciar monitoreo en tiempo real cuando hay datos reales disponibles
    useEffect(() => {
        if (selectedPoint && 
            showGraphs && 
            dataMode === 'realtime' && 
            realDataState[selectedPoint]?.isAvailable && 
            !isConnected) {
            
            console.log(`🚀 [AutoStart] Auto-iniciando monitoreo en tiempo real para: ${selectedPoint}`);
            console.log(`📊 [AutoStart] Estado de datos reales:`, realDataState[selectedPoint]);
            
            // Asegurar que no esté pausado cuando auto-inicia
            setPausedGraphs(prev => ({ ...prev, [selectedPoint]: false }));
            
            // Auto-iniciar después de un pequeño delay para permitir que la UI se estabilice
            const autoStartTimer = setTimeout(() => {
                handleRealTimeControl(selectedPoint, 'start');
            }, 1000);

            return () => clearTimeout(autoStartTimer);
        }
    }, [selectedPoint, showGraphs, dataMode, realDataState, isConnected, handleRealTimeControl]);

    // Limpiar estado de pausa cuando se cambia de punto
    useEffect(() => {
        if (selectedPoint) {
            // Asegurar que el nuevo punto empiece sin pausa
            setPausedGraphs(prev => ({ ...prev, [selectedPoint]: false }));
        }
    }, [selectedPoint]);

    const handleSwitchToRealData = useCallback(async (punto: string) => {
        try {
            setSwitchingMode(true);
            await switchToRealData(punto);
        } catch (error) {
            console.error(`❌ Error switching to real data for ${punto}:`, error);
        } finally {
            setSwitchingMode(false);
        }
    }, [switchToRealData]);

    const handleSwitchToSimulatedData = async (punto: string) => {
        try {
            setSwitchingMode(true);
            await switchToSimulatedData(punto);
        } catch (error) {
            console.error(`❌ Error switching to simulated data for ${punto}:`, error);
        } finally {
            setSwitchingMode(false);
        }
    };

    const handleLoadFullStaticData = async (punto: string) => {
        try {
            setSwitchingMode(true);
            await loadFullStaticData(punto);
        } catch (error) {
            console.error(`❌ Error loading full static data for ${punto}:`, error);
        } finally {
            setSwitchingMode(false);
        }
    };

    // Cargar puntos disponibles y datos estáticos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {

                // Obtener puntos disponibles
                const points = await GraphicsSectionService.getAvailablePoints();
                setAvailablePoints(points);

                if (points.length === 0) {
                    console.warn('⚠️ No se encontraron puntos disponibles');
                    return;
                }

                // Cargar datos estáticos iniciales
                await loadStaticData(points);

            } catch (error) {
                console.error('❌ Error loading initial data:', error);
                // Datos por defecto en caso de error
                const defaultPoints = ['Punto 1', 'Punto 2', 'Punto 3'];
                setAvailablePoints(defaultPoints);
                createDefaultData(defaultPoints);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Efecto para asegurar que todos los puntos estén disponibles cuando cambien los datos
    useEffect(() => {
        if (availablePoints.length > 0) {
            // En modo estático, asegurar que todos los puntos tengan datos
            if (dataMode === 'static') {
                const missingPoints = availablePoints.filter(punto => !staticSensorData[punto]);
                if (missingPoints.length > 0) {
                    // Crear datos por defecto para puntos faltantes
                    const updatedData = { ...staticSensorData };
                    const updatedStatus = { ...staticDataStatus };
                    
                    missingPoints.forEach(punto => {
                        const sampleData: SensorReading = {
                            timestamp: new Date().toISOString(),
                            temperatura: 20 + Math.random() * 10,
                            humedad: 40 + Math.random() * 20,
                            pM2_5: 5 + Math.random() * 10,
                            cO3: 0.01 + Math.random() * 0.05,
                            punto: punto
                        };
                        updatedData[punto] = [sampleData];
                        updatedStatus[punto] = 'unknown';
                    });
                    
                    setStaticSensorData(updatedData);
                    setStaticDataStatus(updatedStatus);
                }
            }
        }
    }, [availablePoints, dataMode, staticSensorData, staticDataStatus]);

    // Efecto para detectar cambios en el estado de datos reales y mostrar notificaciones
    useEffect(() => {
        availablePoints.forEach(punto => {
            const state = realDataState[punto];
            if (state && state.sensorStatus) {
                const currentNotification = fileNotifications[punto];
                
                // Detectar diferentes tipos de estado
                if (state.sensorStatus.includes('reseteado')) {
                    if (!currentNotification || currentNotification.type !== 'reset') {
                        setFileNotifications(prev => ({
                            ...prev,
                            [punto]: {
                                type: 'reset',
                                message: `📊 ${punto}: Archivo reseteado - nuevos datos detectados`,
                                timestamp: new Date()
                            }
                        }));
                    }
                } else if (state.sensorStatus.includes('detuvo crecimiento') || state.sensorStatus.includes('Sin datos nuevos')) {
                    if (!currentNotification || currentNotification.type !== 'stopped') {
                        setFileNotifications(prev => ({
                            ...prev,
                            [punto]: {
                                type: 'stopped',
                                message: `⏸️ ${punto}: Sin nuevos datos - archivo detuvo crecimiento`,
                                timestamp: new Date()
                            }
                        }));
                    }
                } else if (state.isMonitoring && (state.sensorStatus.includes('tiempo real') || state.sensorStatus.includes('Recibiendo datos'))) {
                    if (!currentNotification || currentNotification.type !== 'active') {
                        setFileNotifications(prev => ({
                            ...prev,
                            [punto]: {
                                type: 'active',
                                message: `✅ ${punto}: Recibiendo datos en tiempo real`,
                                timestamp: new Date()
                            }
                        }));
                    }
                }
            }
        });
    }, [realDataState, availablePoints, fileNotifications]);

    // Cargar datos estáticos
    const loadStaticData = async (points: string[]) => {
        try {
            const dataPromises = points.map(async (punto) => {
                try {
                    const dataResponse = await GraphicsSectionService.getSensorData({
                        punto,
                        limit: 100
                    });

                    const isSimulating = await GraphicsSectionService.isSimulating(punto);

                    return {
                        punto,
                        data: dataResponse.data || [],
                        status: (isSimulating ? 'simulating' : 'real-time') as 'real-time' | 'simulating' | 'unknown'
                    };
                } catch (error) {
                    console.error(`❌ Error loading data for ${punto}:`, error);
                    return { punto, data: [], status: 'unknown' as const };
                }
            });

            const results = await Promise.all(dataPromises);

            const newSensorData: { [key: string]: SensorReading[] } = {};
            const newDataStatus: { [key: string]: 'real-time' | 'simulating' | 'unknown' } = {};

            results.forEach(({ punto, data, status }) => {
                newSensorData[punto] = data;
                newDataStatus[punto] = status;
            });

            setStaticSensorData(newSensorData);
            setStaticDataStatus(newDataStatus);
        } catch (error) {
            console.error('❌ Error loading static data:', error);
        }
    };

    // Crear datos por defecto
    const createDefaultData = (points: string[]) => {
        const defaultSensorData: { [key: string]: SensorReading[] } = {};
        const defaultDataStatus: { [key: string]: 'real-time' | 'simulating' | 'unknown' } = {};

        points.forEach(punto => {
            const sampleData: SensorReading = {
                timestamp: new Date().toISOString(),
                temperatura: 20 + Math.random() * 10,
                humedad: 40 + Math.random() * 20,
                pM2_5: 5 + Math.random() * 10,
                cO3: 0.01 + Math.random() * 0.05,
                punto: punto
            };

            defaultSensorData[punto] = [sampleData];
            defaultDataStatus[punto] = 'unknown';
        });

        setStaticSensorData(defaultSensorData);
        setStaticDataStatus(defaultDataStatus);
    };

    // Alternar entre modo estático y tiempo real
    const toggleDataMode = async () => {
        const newMode = dataMode === 'static' ? 'realtime' : 'static';

        setSwitchingMode(true);

        try {
            if (newMode === 'realtime') {
                
                // Conectar ANTES de cambiar el modo para evitar efectos no deseados
                await connect();
                
                // Cambiar modo después de conectar exitosamente
                setDataMode(newMode);

                
            } else {
                
                // Desconectar ANTES de cambiar el modo
                await disconnect();
                
                // Cambiar modo después de desconectar exitosamente
                setDataMode(newMode);
                
            }
        } catch (error) {
            console.error('❌ Error en toggleDataMode:', error);
            
            // En caso de error, revertir cualquier cambio
            if (newMode === 'realtime') {
                setDataMode('static');
                // Asegurar desconexión en caso de error
                try {
                    await disconnect();
                } catch (disconnectError) {
                    console.error('❌ Error adicional al desconectar:', disconnectError);
                }
            } else {
                setDataMode('realtime');
                // Intentar reconectar si falló la desconexión
                try {
                    await connect();
                } catch (connectError) {
                    console.error('❌ Error adicional al reconectar:', connectError);
                }
            }
        } finally {
            setSwitchingMode(false);
        }
    };

    // Alternar simulación (función mejorada)
    const toggleSimulation = async (punto: string) => {
        try {
            if (dataMode === 'realtime') {
                const currentState = simulationState[punto] || SimulationState.STOPPED;

                if (currentState === SimulationState.STOPPED) {
                    // Iniciar simulación
                    await handleSimulationControl(punto, 'start');
                } else if (currentState === SimulationState.RUNNING) {
                    // Detener simulación
                    await handleSimulationControl(punto, 'stop');
                } else if (currentState === SimulationState.PAUSED) {
                    // Reanudar simulación
                    await handleSimulationControl(punto, 'resume');
                }
            } else {
                // Modo estático: NO PERMITIR simulación, solo cambiar a tiempo real
                alert('Para simulación gradual (datos uno por uno), cambia a modo "Tiempo Real" usando el interruptor de arriba.');
            }
        } catch (error) {
            console.error(`Error toggling simulation for ${punto}:`, error);
        }
    };

    // Refrescar todos los datos
    const refreshAllData = async () => {
        setLoading(true);
        try {
            if (dataMode === 'static') {
                await loadStaticData(availablePoints);
            } else {
                // En modo tiempo real, no refrescamos datos históricos
                // Pero nos aseguramos de que todos los puntos estén representados
                if (availablePoints.length > 0) {
                    console.log('📊 Puntos disponibles para tiempo real:', availablePoints);
                }
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePointClick = (punto: string) => {
        setSelectedPoint(punto);
        setShowGraphs(true);
    };

    const handleBackToOverview = () => {
        setShowGraphs(false);
        setSelectedPoint(null);
        // Refrescar datos para asegurar que las tarjetas se muestren correctamente
        refreshAllData();
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getChartData = (punto: string, metric: 'temperatura' | 'cO3' | 'pM2_5') => {
        const data = currentSensorData[punto] || [];
        return {
            xAxis: data.map(item => formatTime(item.timestamp)),
            series: data.map(item => item[metric])
        };
    };

    // Preparar datos para el indicador de estado
    const pointsStatus = Object.fromEntries(
        availablePoints.map(punto => [
            punto,
            {
                connectionState,
                isSimulating: currentDataStatus[punto] === 'simulating',
                lastUpdate: dataMode === 'realtime'
                    ? latestReadings[punto]?.timestamp
                    : currentSensorData[punto]?.[currentSensorData[punto].length - 1]?.timestamp,
                dataMode
            }
        ])
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white flex items-center justify-center px-4">
                <Typography
                    variant="h4"
                    sx={{
                        color: 'white',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                        textAlign: 'center'
                    }}
                >
                    Cargando datos de sensores...
                </Typography>
            </div>
        );
    }

    if (showGraphs && selectedPoint) {
        const tempData = getChartData(selectedPoint, 'temperatura');
        const co2Data = getChartData(selectedPoint, 'cO3');
        const pm25Data = getChartData(selectedPoint, 'pM2_5');
        
        // Umbrales críticos definidos en el sistema
        const criticalThresholds = {
            temperatura: 35, // °C
            cO3: 0.1, // ppm 
            pM2_5: 50 // μg/m³
        };

        return (
            <div className="min-h-screen bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <Typography
                                variant="h2"
                                component="h1"
                                sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' }
                                }}
                            >
                                {selectedPoint}
                            </Typography>
                            <Chip
                                label={(() => {
                                    const status = getEnhancedStatus(selectedPoint);
                                    const currentDataSourceForPoint = dataSource[selectedPoint] || 'simulated';
                                    
                                    if (status.state === SimulationState.RUNNING) {
                                        return `🔄 Simulación Gradual Activa (${Math.round(status.progress)}%)`;
                                    } else if (status.state === SimulationState.PAUSED) {
                                        return `⏸️ Simulación Pausada (${Math.round(status.progress)}%)`;
                                    } else if (status.state === SimulationState.STOPPED) {
                                        if (currentDataSourceForPoint === 'realtime') {
                                            return '🟢 Datos Reales';
                                        } else {
                                            return '📊 Datos Simulados (Completos)';
                                        }
                                    } else {
                                        return '❓ Estado Desconocido';
                                    }
                                })()}
                                color={(() => {
                                    const status = getEnhancedStatus(selectedPoint);
                                    const currentDataSourceForPoint = dataSource[selectedPoint] || 'simulated';
                                    
                                    if (status.state === SimulationState.RUNNING) {
                                        return 'success';
                                    } else if (status.state === SimulationState.PAUSED) {
                                        return 'warning';
                                    } else if (status.state === SimulationState.STOPPED) {
                                        if (currentDataSourceForPoint === 'realtime') {
                                            return 'success';
                                        } else if (currentDataSourceForPoint === 'simulated') {
                                            return 'info';
                                        } else if (currentDataSourceForPoint === 'historical') {
                                            return 'secondary';
                                        } else {
                                            return dataMode === 'realtime' ? 'success' : 'default';
                                        }
                                    } else {
                                        return 'error';
                                    }
                                })()}
                                variant="filled"
                                icon={(() => {
                                    const status = getEnhancedStatus(selectedPoint);
                                    const currentDataSourceForPoint = dataSource[selectedPoint] || 'simulated';
                                    
                                    if (status.state === SimulationState.RUNNING) {
                                        return <Timeline />;
                                    } else if (status.state === SimulationState.PAUSED) {
                                        return <Pause />;
                                    } else if (status.state === SimulationState.STOPPED) {
                                        if (currentDataSourceForPoint === 'realtime') {
                                            return <Speed />;
                                        } else if (currentDataSourceForPoint === 'simulated') {
                                            return <Computer />;
                                        } else if (currentDataSourceForPoint === 'historical') {
                                            return <TrendingUp />;
                                        } else {
                                            return dataMode === 'realtime' ? <Speed /> : <TrendingUp />;
                                        }
                                    } else {
                                        return undefined;
                                    }
                                })()}
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            {dataMode === 'realtime' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: '200px' }}>
                                    {realDataState[selectedPoint]?.isAvailable ? (
                                        // CONTROLES PARA TIEMPO REAL
                                        <>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.8)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    mb: 1
                                                }}
                                            >
                                                📡 MONITOREO EN TIEMPO REAL
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center' }}>
                                                {/* Indicador de estado en vivo - no es un botón */}
                                                <Chip
                                                    size="medium"
                                                    label={!pausedGraphs[selectedPoint] ? "🔴 EN VIVO" : "⚫ PAUSADO"}
                                                    color={!pausedGraphs[selectedPoint] ? "error" : "default"}
                                                    icon={!pausedGraphs[selectedPoint] ? <FiberManualRecord /> : <RadioButtonChecked />}
                                                    variant="filled"
                                                    sx={{
                                                        animation: !pausedGraphs[selectedPoint] ? 'pulse 2s infinite' : 'none',
                                                        '@keyframes pulse': {
                                                            '0%': { opacity: 1 },
                                                            '50%': { opacity: 0.7 },
                                                            '100%': { opacity: 1 }
                                                        },
                                                        backgroundColor: !pausedGraphs[selectedPoint] ? '#d32f2f' : '#424242',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        minWidth: '120px'
                                                    }}
                                                />
                                                
                                                {/* Botón de Pausar/Reanudar */}
                                                <Tooltip title={!pausedGraphs[selectedPoint] ? "Pausar gráfica (los datos siguen llegando en segundo plano)" : "Reanudar gráfica desde los últimos datos"}>
                                                    <Button
                                                        onClick={() => handleRealTimeControl(selectedPoint, pausedGraphs[selectedPoint] ? 'start' : 'pause')}
                                                        startIcon={pausedGraphs[selectedPoint] ? <PlayArrow /> : <Pause />}
                                                        variant="outlined"
                                                        color={pausedGraphs[selectedPoint] ? "success" : "warning"}
                                                        sx={{
                                                            color: 'white',
                                                            borderColor: pausedGraphs[selectedPoint] ? '#4caf50' : '#ff9800',
                                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                            px: { xs: 1.5, sm: 2 },
                                                            py: { xs: 0.5, sm: 1 },
                                                            minWidth: '120px',
                                                            '&:hover': {
                                                                borderColor: pausedGraphs[selectedPoint] ? '#66bb6a' : '#ffb74d',
                                                                backgroundColor: pausedGraphs[selectedPoint] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'
                                                            }
                                                        }}
                                                    >
                                                        {pausedGraphs[selectedPoint] ? 'Reanudar' : 'Pausar'}
                                                    </Button>
                                                </Tooltip>
                                            </Box>

                                            {/* Mensaje informativo */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.6)',
                                                    fontSize: '0.65rem',
                                                    textAlign: 'center',
                                                    mt: 1,
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                {!pausedGraphs[selectedPoint] 
                                                    ? "Gráfica actualizándose en tiempo real" 
                                                    : "Gráfica pausada - datos acumulándose en segundo plano"
                                                }
                                            </Typography>
                                        </>
                                    ) : (
                                        // CONTROLES PARA SIMULACIÓN
                                        <>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'rgba(255,255,255,0.8)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    mb: 1
                                                }}
                                            >
                                                🎮 SIMULACIÓN GRADUAL
                                            </Typography>
                                            
                                            <ButtonGroup variant="outlined"
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    gap: 2,
                                                    '& .MuiButton-root': {
                                                        color: 'white',
                                                        borderColor: 'rgba(255,255,255,0.5)',
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        px: { xs: 1, sm: 2 },
                                                        py: { xs: 0.5, sm: 1 },
                                                        '&:hover': {
                                                            borderColor: 'white',
                                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                                        }
                                                    }
                                                }}>
                                                {getEnhancedStatus(selectedPoint).state === SimulationState.STOPPED ? (
                                                    <Tooltip title="Iniciar simulación gradual - los datos aparecerán uno por uno">
                                                        <Button
                                                            onClick={() => handleSimulationControl(selectedPoint, 'start')}
                                                            startIcon={<PlayArrow />}
                                                        >
                                                            Simular Gradual
                                                        </Button>
                                                    </Tooltip>
                                                ) : getEnhancedStatus(selectedPoint).state === SimulationState.RUNNING ? (
                                                    <>
                                                        <Tooltip title="Pausar simulación gradual">
                                                            <Button
                                                                onClick={() => handleSimulationControl(selectedPoint, 'pause')}
                                                                startIcon={<Pause />}
                                                            >
                                                                Pausar
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Detener simulación gradual - mantener datos acumulados">
                                                            <Button
                                                                onClick={() => handleSimulationControl(selectedPoint, 'stop')}
                                                                startIcon={<Stop />}
                                                            >
                                                                Detener
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                ) : getEnhancedStatus(selectedPoint).state === SimulationState.PAUSED ? (
                                                    <>
                                                        <Tooltip title="Reanudar simulación gradual">
                                                            <Button
                                                                onClick={() => handleSimulationControl(selectedPoint, 'resume')}
                                                                startIcon={<PlayArrow />}
                                                            >
                                                                Reanudar
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Reiniciar simulación desde el principio">
                                                            <Button
                                                                onClick={() => handleSimulationControl(selectedPoint, 'restart')}
                                                                startIcon={<RestartAlt />}
                                                            >
                                                                Reiniciar
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip title="Detener simulación gradual - mantener datos acumulados">
                                                            <Button
                                                                onClick={() => handleSimulationControl(selectedPoint, 'stop')}
                                                                startIcon={<Stop />}
                                                            >
                                                                Detener
                                                            </Button>
                                                        </Tooltip>
                                                    </>
                                                ) : null}
                                            </ButtonGroup>
                                        </>
                                    )}

                                    {/* Botones adicionales para cargar datos completos y limpiar - solo para simulación */}
                                    {!realDataState[selectedPoint]?.isAvailable && getEnhancedStatus(selectedPoint).state === SimulationState.STOPPED && (
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Tooltip title="Cargar todos los datos estáticos disponibles en la gráfica">
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleLoadFullStaticData(selectedPoint)}
                                                    startIcon={<TrendingUp />}
                                                    disabled={switchingMode}
                                                    size="small"
                                                    sx={{
                                                        color: 'white',
                                                        borderColor: 'rgba(255,255,255,0.5)',
                                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                        px: { xs: 1, sm: 1.5 },
                                                        py: { xs: 0.3, sm: 0.5 },
                                                        '&:hover': {
                                                            borderColor: 'white',
                                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                                        }
                                                    }}
                                                >
                                                    Ver Datos Completos
                                                </Button>
                                            </Tooltip>
                                            <Tooltip title="Limpiar gráfica para empezar simulación desde cero">
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => {
                                                        // Limpiar datos en tiempo real para este punto - función por implementar
                                                        console.log(`🧹 Solicitud de limpieza de datos para ${selectedPoint}`);
                                                    }}
                                                    startIcon={<CloudOff />}
                                                    disabled={switchingMode}
                                                    size="small"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.8)',
                                                        borderColor: 'rgba(255,255,255,0.4)',
                                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                                        px: { xs: 1, sm: 1.5 },
                                                        py: { xs: 0.3, sm: 0.5 },
                                                        '&:hover': {
                                                            borderColor: 'rgba(255,255,255,0.6)',
                                                            backgroundColor: 'rgba(255,255,255,0.05)'
                                                        }
                                                    }}
                                                >
                                                    Limpiar Gráfica
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    )}

                                    {/* Barra de progreso para simulación activa */}
                                    {(getEnhancedStatus(selectedPoint).state === SimulationState.RUNNING ||
                                        getEnhancedStatus(selectedPoint).state === SimulationState.PAUSED) && (
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5, display: 'block' }}>
                                                    Progreso: {Math.round(getEnhancedStatus(selectedPoint).progress)}%
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={getEnhancedStatus(selectedPoint).progress}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: getEnhancedStatus(selectedPoint).state === SimulationState.PAUSED
                                                                ? '#ff9800'
                                                                : '#4caf50'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        )}
                                </Box>
                            ) : (
                                <Button
                                    variant="outlined"
                                    onClick={() => toggleSimulation(selectedPoint)}
                                    startIcon={<PlayArrow />}
                                    disabled={true}
                                    sx={{
                                        color: 'rgba(255,255,255,0.5)',
                                        borderColor: 'rgba(255,255,255,0.3)',
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        px: { xs: 2, sm: 3 },
                                        py: { xs: 1, sm: 1.5 }
                                    }}
                                >
                                    Simulación Gradual (solo en Tiempo Real)
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                onClick={handleBackToOverview}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    px: { xs: 2, sm: 3 },
                                    py: { xs: 1, sm: 1.5 },
                                    '&:hover': {
                                        borderColor: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                Volver al Resumen
                            </Button>
                        </div>
                    </div>

                    {/* Indicador adicional del modo de datos actual */}
                    <Box sx={{ 
                        mb: 4, 
                        p: 2, 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <DataSourceIndicator
                            dataSource={dataSource[selectedPoint] || 'simulated'}
                            realDataState={realDataState[selectedPoint] || { isAvailable: false, isMonitoring: false }}
                            isConnected={isConnected}
                            onSwitchToReal={() => handleSwitchToRealData(selectedPoint)}
                            onSwitchToSimulated={() => handleSwitchToSimulatedData(selectedPoint)}
                            disabled={switchingMode}
                        />
                    </Box>

                    {/* Notificaciones de cambios en archivos */}
                    {selectedPoint && fileNotifications[selectedPoint] && (
                        <Box sx={{ 
                            mb: 3, 
                            p: 2, 
                            backgroundColor: (() => {
                                const type = fileNotifications[selectedPoint].type;
                                switch (type) {
                                    case 'reset': return 'rgba(33, 150, 243, 0.2)'; // Azul para reset
                                    case 'stopped': return 'rgba(255, 152, 0, 0.2)'; // Naranja para detenido
                                    case 'active': return 'rgba(76, 175, 80, 0.2)'; // Verde para activo
                                    default: return 'rgba(255,255,255,0.1)';
                                }
                            })(),
                            borderRadius: 2,
                            border: `1px solid ${(() => {
                                const type = fileNotifications[selectedPoint].type;
                                switch (type) {
                                    case 'reset': return 'rgba(33, 150, 243, 0.5)';
                                    case 'stopped': return 'rgba(255, 152, 0, 0.5)';
                                    case 'active': return 'rgba(76, 175, 80, 0.5)';
                                    default: return 'rgba(255,255,255,0.2)';
                                }
                            })()}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                        }}>
                            <Box sx={{ 
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {fileNotifications[selectedPoint].type === 'reset' && '🔄'}
                                {fileNotifications[selectedPoint].type === 'stopped' && '⏸️'}
                                {fileNotifications[selectedPoint].type === 'active' && '✅'}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                    {fileNotifications[selectedPoint].message}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {fileNotifications[selectedPoint].timestamp.toLocaleTimeString('es-ES')}
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                onClick={() => setFileNotifications(prev => {
                                    const updated = { ...prev };
                                    delete updated[selectedPoint];
                                    return updated;
                                })}
                                sx={{ 
                                    color: 'rgba(255,255,255,0.8)',
                                    minWidth: 'auto',
                                    p: 0.5
                                }}
                            >
                                ✕
                            </Button>
                        </Box>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:gap-8">
                        <Card sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                                    Temperatura (°C)
                                </Typography>
                                <Box sx={{ height: { xs: 350, sm: 400, md: 600 } }}>
                                    <GraphicsComponent
                                        title="Temperatura"
                                        unit="°C"
                                        color="#ff8c42"
                                        label="Temperatura"
                                        data={tempData}
                                        criticalThreshold={criticalThresholds.temperatura}
                                    />
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                                    CO2 (ppm)
                                </Typography>
                                <Box sx={{ height: { xs: 350, sm: 400, md: 600 } }}>
                                    <GraphicsComponent
                                        title="CO2"
                                        unit="ppm"
                                        color="#4ecdc4"
                                        label="CO2"
                                        data={co2Data}
                                        criticalThreshold={criticalThresholds.cO3}
                                    />
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                                    PM2.5 (μg/m³)
                                </Typography>
                                <Box sx={{ height: { xs: 350, sm: 400, md: 600 } }}>
                                    <GraphicsComponent
                                        title="PM2.5"
                                        unit="μg/m³"
                                        color="#ffe66d"
                                        label="PM2.5"
                                        data={pm25Data}
                                        criticalThreshold={criticalThresholds.pM2_5}
                                    />
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                                    Información Adicional
                                </Typography>
                                <Box sx={{
                                    color: 'rgba(255,255,255,0.9)',
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                                    gap: 3
                                }}>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            Punto:
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedPoint}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            Total de lecturas:
                                        </Typography>
                                        <Typography variant="body2">
                                            {currentSensorData[selectedPoint]?.length || 0}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            Modo de datos:
                                        </Typography>
                                        <Typography variant="body2">
                                            {(() => {
                                                if (dataMode === 'static') return 'Datos Simulados (Archivos Backend)';
                                                const status = getEnhancedStatus(selectedPoint);
                                                switch (status.state) {
                                                    case SimulationState.RUNNING:
                                                        return 'Simulación Gradual Activa (SignalR)';
                                                    case SimulationState.PAUSED:
                                                        return 'Simulación Gradual Pausada (SignalR)';
                                                    default:
                                                        return 'Datos Reales (SignalR)';
                                                }
                                            })()}
                                        </Typography>
                                    </Box>
                                    {dataMode === 'realtime' && (
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                Estado conexión:
                                            </Typography>
                                            <Typography variant="body2">
                                                {isConnected ? 'Conectado' : 'Desconectado'}
                                            </Typography>
                                        </Box>
                                    )}
                                    {dataMode === 'realtime' && getEnhancedStatus(selectedPoint).state !== SimulationState.STOPPED && (
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                Progreso de simulación:
                                            </Typography>
                                            <Typography variant="body2">
                                                {Math.round(getEnhancedStatus(selectedPoint).progress)}% completado
                                            </Typography>
                                        </Box>
                                    )}
                                    {dataMode === 'realtime' && getEnhancedStatus(selectedPoint).state !== SimulationState.STOPPED && (
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                Estado de simulación:
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: getEnhancedStatus(selectedPoint).state === SimulationState.RUNNING ? '#4caf50' : '#ff9800'
                                            }}>
                                                {getEnhancedStatus(selectedPoint).state === SimulationState.RUNNING ? 'En ejecución' : 'Pausada'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Snackbar para notificaciones de alertas - También en vista de gráficas */}
                <Snackbar
                    open={alertSnackbar.open}
                    autoHideDuration={alertSnackbar.autoHide ? 6000 : null}
                    onClose={() => setAlertSnackbar(prev => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    sx={{
                        '& .MuiSnackbarContent-root': {
                            backgroundColor: alertSnackbar.type === 'critical' ? '#d32f2f' :
                                           alertSnackbar.type === 'email' ? '#2196f3' : '#4caf50',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            maxWidth: '90vw'
                        }
                    }}
                    message={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {alertSnackbar.type === 'critical' && <Warning />}
                            {alertSnackbar.type === 'email' && <Email />}
                            {alertSnackbar.type === 'reset' && <Refresh />}
                            {alertSnackbar.message}
                        </Box>
                    }
                    action={
                        !alertSnackbar.autoHide && (
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={() => setAlertSnackbar(prev => ({ ...prev, open: false }))}
                            >
                                CERRAR
                            </Button>
                        )
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="text-center mb-8 sm:mb-12">
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            mb: 2,
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' }
                        }}
                    >
                        Monitoreo de Calidad del Aire
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            mb: 4,
                            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }
                        }}
                    >
                        Visualiza datos de sensores en tiempo real
                    </Typography>

                    {/* Resumen del estado del sistema */}
                    <DataSourceSummary
                        dataSources={dataSource}
                        realDataStates={realDataState}
                        connectionState={connectionState}
                        isConnected={isConnected}
                        puntos={availablePoints}
                    />

                    {/* Control de modo de datos */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        mb: 4,
                        flexWrap: 'wrap'
                    }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dataMode === 'realtime'}
                                    onChange={toggleDataMode}
                                    disabled={switchingMode}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: '#4ecdc4',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: '#4ecdc4',
                                        },
                                    }}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {dataMode === 'static' ? <CloudOff /> : <Cloud />}
                                    <Typography sx={{ color: 'white' }}>
                                        {switchingMode
                                            ? (dataMode === 'static' ? 'Activando Datos Reales...' : 'Activando Datos Simulados...')
                                            : (dataMode === 'static' ? 'Datos Simulados (Backend)' : 'Datos Reales (SignalR)')
                                        }
                                    </Typography>
                                </Box>
                            }
                        />
                        <Button
                            variant="outlined"
                            onClick={refreshAllData}
                            startIcon={<Refresh />}
                            disabled={loading || switchingMode}
                            sx={{
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.5)',
                                '&:hover': {
                                    borderColor: 'white',
                                    backgroundColor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            Actualizar Todo
                        </Button>
                    </Box>

                    {/* Mensaje explicativo */}
                    <Box sx={{
                        textAlign: 'center',
                        mb: 4,
                        p: 2,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.2)',
                        maxWidth: 800,
                        mx: 'auto'
                    }}>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1, fontWeight: 'bold' }}>
                            ℹ️ Información sobre los datos:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {dataMode === 'static' 
                                ? '📊 Los datos simulados muestran los archivos completos almacenados en el backend. Cambia a "Datos Reales" para usar simulación gradual o datos en tiempo real.'
                                : '🔄 En modo de datos reales, puedes activar la simulación gradual (datos uno por uno) desde las gráficas individuales o conectar con sensores reales.'
                            }
                        </Typography>
                    </Box>

                    {/* Indicadores de estado */}
                    {dataMode === 'realtime' && (
                        <MultiPointStatusIndicator
                            pointsStatus={pointsStatus}
                            onToggleMode={toggleDataMode}
                        />
                    )}
                </div>

                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 3, sm: 4, md: 4 },
                    maxWidth: '1600px',
                    width: '100%',
                    mx: 'auto',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start'
                }}>
                    {(() => {
                        // CAMBIO: Usar availablePoints en lugar de Object.keys(currentSensorData)
                        // Esto asegura que se muestren TODAS las tarjetas, tengan datos o no
                        
                        // Logging reducido para debugging ocasional
                        if (Math.random() < 0.05) { // Solo 5% de las veces
                            console.log('🔍 Renderizando tarjetas:', {
                                dataMode,
                                availablePointsCount: availablePoints.length,
                                sensorDataKeysCount: Object.keys(currentSensorData).length,
                                realtimeDataKeysCount: Object.keys(realtimeData).length
                            });
                        }
                        
                        if (availablePoints.length === 0) {
                            return (
                                <Box sx={{
                                    textAlign: 'center',
                                    color: 'rgba(255,255,255,0.8)',
                                    py: 4
                                }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        No se encontraron puntos de sensores disponibles
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 3 }}>
                                        Verifica que el servidor esté ejecutándose y que haya archivos de datos
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        onClick={refreshAllData}
                                        startIcon={<Refresh />}
                                        sx={{
                                            color: 'white',
                                            borderColor: 'rgba(255,255,255,0.5)',
                                            '&:hover': {
                                                borderColor: 'white',
                                                backgroundColor: 'rgba(255,255,255,0.1)'
                                            }
                                        }}
                                    >
                                        Reintentar
                                    </Button>
                                </Box>
                            );
                        }
                        
                        // RENDERIZAR TODAS LAS TARJETAS DISPONIBLES
                        return availablePoints.map((punto) => {
                            const data = currentSensorData[punto] || [];
                            const realState = realDataState[punto];
                            const hasRealData = realState?.isAvailable || false;
                            
                            const latestData = dataMode === 'realtime'
                                ? latestReadings[punto] || (data.length > 0 ? data[data.length - 1] : null)
                                : (data.length > 0 ? data[data.length - 1] : null);

                            // Determinar si hay datos válidos para mostrar
                            const hasValidData = latestData !== null;
                            
                            // Datos para mostrar en la tarjeta
                            const displayData = hasValidData ? latestData : {
                                temperatura: 0,
                                humedad: 0,
                                cO3: 0,
                                pM2_5: 0,
                                timestamp: new Date().toISOString(),
                                punto: punto
                            };
                            
                            // Determinar el estado de la tarjeta
                            const cardStatus = (() => {
                                if (!hasValidData && !hasRealData) {
                                    return 'no-data'; // No hay datos ni archivos reales
                                } else if (!hasValidData && hasRealData) {
                                    return 'no-current-data'; // Hay archivos pero no datos actuales
                                } else {
                                    return 'has-data'; // Hay datos válidos
                                }
                            })();
                            
                            // Logging reducido para debugging ocasional
                            if (Math.random() < 0.02) { // Solo 2% de las veces
                                console.log(`🎯 [${punto}] Estado: ${cardStatus}, hasValidData: ${hasValidData}, hasRealData: ${hasRealData}, dataLength: ${data.length}`);
                            }

                            return (
                                <Box key={punto} sx={{ flex: 1, minWidth: { xs: '100%', sm: '320px', md: '380px' } }}>
                                    <Card
                                        sx={{
                                            backgroundColor: cardStatus === 'no-data' 
                                                ? 'rgba(255,152,0,0.15)' // Orange tint for no data
                                                : cardStatus === 'no-current-data'
                                                ? 'rgba(156,39,176,0.15)' // Purple tint for file exists but no current data
                                                : 'rgba(255,255,255,0.15)', // Normal for has data
                                            backdropFilter: 'blur(15px)',
                                            border: `1px solid ${
                                                cardStatus === 'no-data' 
                                                    ? 'rgba(255,152,0,0.4)'
                                                    : cardStatus === 'no-current-data'
                                                    ? 'rgba(156,39,176,0.4)'
                                                    : 'rgba(255,255,255,0.25)'
                                            }`,
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            height: 'fit-content',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                transform: 'translateY(-6px)',
                                                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.35)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                                            {/* Indicador de fuente de datos */}
                                            <DataSourceIndicator
                                                dataSource={dataSource[punto] || 'simulated'}
                                                realDataState={realDataState[punto] || { isAvailable: false, isMonitoring: false }}
                                                isConnected={isConnected}
                                                onSwitchToReal={() => handleSwitchToRealData(punto)}
                                                onSwitchToSimulated={() => handleSwitchToSimulatedData(punto)}
                                                disabled={switchingMode}
                                            />

                                            {/* Indicador de alertas críticas */}
                                            {dataMode === 'realtime' && (
                                                <Box sx={{ mb: 2 }}>
                                                    <AlertIndicator 
                                                        punto={punto}
                                                        alertStatus={alertStatus[punto]}
                                                        isLoading={alertsLoading}
                                                        onRefresh={() => getAlertStatusForPoint(punto)}
                                                    />
                                                </Box>
                                            )}

                                            {/* Indicador de estado del punto */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Box>
                                                    <Typography
                                                        variant="h4"
                                                        component="h2"
                                                        sx={{
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                                        }}
                                                    >
                                                        {punto}
                                                    </Typography>
                                                    
                                                    {/* Información de estado de datos */}
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            color: cardStatus === 'no-data' 
                                                                ? 'rgba(255,152,0,0.9)'
                                                                : cardStatus === 'no-current-data'
                                                                ? 'rgba(156,39,176,0.9)'
                                                                : 'rgba(255,255,255,0.7)',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'medium'
                                                        }}
                                                    >
                                                        {cardStatus === 'no-data' 
                                                            ? `Sin archivo de datos (${realState?.sensorStatus || 'Archivo no encontrado'})`
                                                            : cardStatus === 'no-current-data'
                                                            ? `Archivo existe pero sin datos actuales (${data.length} registros totales)`
                                                            : `${data.length} registros disponibles`
                                                        }
                                                    </Typography>
                                                </Box>

                                                {/* Indicador de estado */}
                                                <Chip
                                                    label={currentDataStatus[punto] === 'simulating' ? 'Simulando' : dataMode === 'realtime' ? 'Tiempo Real' : 'Histórico'}
                                                    color={currentDataStatus[punto] === 'simulating' ? 'warning' : dataMode === 'realtime' ? 'success' : 'default'}
                                                    variant="filled"
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </Box>

                                            {/* Área para la gráfica placeholder */}
                                            <Box
                                                sx={{
                                                    height: { xs: 150, sm: 180, md: 200 },
                                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mb: 3,
                                                    border: '2px dashed rgba(255,255,255,0.4)',
                                                    gap: 2,
                                                    px: 2
                                                }}
                                            >
                                                <TrendingUp
                                                    sx={{
                                                        fontSize: { xs: 36, sm: 42, md: 48 },
                                                        color: 'rgba(255,255,255,0.8)',
                                                        mb: 1
                                                    }}
                                                />
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {dataMode === 'realtime' ? 'Datos en tiempo real' : 'Datos históricos'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        textAlign: 'center',
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                        px: 1
                                                    }}
                                                >
                                                    Haz clic en &quot;Más información&quot; para ver gráficas detalladas
                                                </Typography>
                                            </Box>

                                            {/* Datos actuales */}
                                            <Box sx={{ mb: 3 }}>
                                                {!latestData && (
                                                    <Alert severity="warning" sx={{ mb: 2, backgroundColor: 'rgba(255, 152, 0, 0.1)' }}>
                                                        Sin datos disponibles para este punto
                                                    </Alert>
                                                )}
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        mb: 1,
                                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                                    }}
                                                >
                                                    <strong>Temperatura:</strong> {displayData.temperatura.toFixed(1)}°C
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        mb: 1,
                                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                                    }}
                                                >
                                                    <strong>Humedad:</strong> {displayData.humedad.toFixed(1)}%
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        mb: 1,
                                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                                    }}
                                                >
                                                    <strong>CO2:</strong> {displayData.cO3.toFixed(3)} ppm
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        mb: 1,
                                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                                    }}
                                                >
                                                    <strong>PM2.5:</strong> {displayData.pM2_5.toFixed(1)} μg/m³
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.7)',
                                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                    }}
                                                >
                                                    Actualizado: {latestData ? formatTime(displayData.timestamp) : 'Sin datos'}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.6)',
                                                        fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                                    }}
                                                >
                                                    {data.length} lecturas disponibles
                                                </Typography>
                                            </Box>

                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => handlePointClick(punto)}
                                                startIcon={<TrendingUp />}
                                                sx={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                                    py: { xs: 1.5, sm: 2 },
                                                    mb: process.env.NODE_ENV === 'development' ? 1 : 0,
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                                                    },
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                Más información
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Box>
                            );
                        });
                    })()}
                </Box>

                {/* Panel de Alertas Críticas - Solo visible en modo realtime */}
                {dataMode === 'realtime' && (
                    <Box sx={{ mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning sx={{ color: '#ff9800' }} />
                                Sistema de Alertas Críticas
                                {activeAlerts.length > 0 && (
                                    <Badge badgeContent={activeAlerts.length} color="error" sx={{ ml: 2 }}>
                                        <NotificationsActive sx={{ color: '#f44336' }} />
                                    </Badge>
                                )}
                            </Typography>
                            
                            <Button
                                variant="outlined"
                                onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                                sx={{
                                    color: 'white',
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    mr: 1,
                                    '&:hover': {
                                        borderColor: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                {showAlertsPanel ? 'Ocultar Panel' : 'Ver Alertas'}
                            </Button>
                        </Box>

                        {/* Panel expandible de alertas */}
                        {showAlertsPanel && (
                            <>
                                <CriticalAlertsDisplay 
                                    monitoringStatus={monitoringStatus}
                                    isLoading={alertsLoading}
                                    emailNotifications={emailNotifications}
                                />
                            </>
                        )}

                        {/* Resumen de alertas en tarjetas de puntos */}
                        {availablePoints.map((punto) => {
                            const pointAlerts = getAlertsForPoint(punto);
                            const pointStatus = alertStatus[punto];
                            
                            if (!pointStatus?.HasActiveAlert && pointAlerts.length === 0) {
                                return null;
                            }
                            
                            return (
                                <Card
                                    key={`alert-${punto}`}
                                    sx={{
                                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                        backdropFilter: 'blur(15px)',
                                        border: '2px solid rgba(244, 67, 54, 0.3)',
                                        borderRadius: 3,
                                        mb: 2,
                                        animation: 'pulse 2s infinite',
                                        '@keyframes pulse': {
                                            '0%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
                                            '70%': { boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
                                            '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Warning />
                                                ALERTA CRÍTICA - {punto}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {pointStatus?.LastAlertTime && (
                                                    <Chip
                                                        icon={<Email />}
                                                        label="Email enviado"
                                                        color="info"
                                                        size="small"
                                                        variant="filled"
                                                    />
                                                )}
                                                <Button
                                                    size="small"
                                                    onClick={() => resetAlert(punto)}
                                                    disabled={alertsLoading}
                                                    sx={{ color: 'white', borderColor: 'white' }}
                                                    variant="outlined"
                                                >
                                                    Resetear
                                                </Button>
                                            </Box>
                                        </Box>
                                        
                                        <AlertIndicator 
                                            punto={punto}
                                            alertStatus={pointStatus}
                                            isLoading={alertsLoading}
                                            onRefresh={() => getAlertStatusForPoint(punto)}
                                        />
                                        
                                        {pointStatus?.CurrentCriticalValues.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                                                    Valores Críticos Detectados:
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {pointStatus.CurrentCriticalValues.map((cv, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={`${cv.Parameter}: ${cv.Value} ${cv.Unit} (máx: ${cv.Threshold})`}
                                                            color="error"
                                                            size="small"
                                                            variant="filled"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                        
                                        {pointStatus?.LastAlertTime && (
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, display: 'block' }}>
                                                Última alerta: {new Date(pointStatus.LastAlertTime).toLocaleString('es-ES')}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}

                {/* Snackbar para notificaciones de alertas */}
                <Snackbar
                    open={alertSnackbar.open}
                    autoHideDuration={alertSnackbar.autoHide ? 6000 : null}
                    onClose={() => setAlertSnackbar(prev => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    sx={{
                        '& .MuiSnackbarContent-root': {
                            backgroundColor: alertSnackbar.type === 'critical' ? '#d32f2f' :
                                           alertSnackbar.type === 'email' ? '#2196f3' : '#4caf50',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            maxWidth: '90vw'
                        }
                    }}
                    message={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {alertSnackbar.type === 'critical' && <Warning />}
                            {alertSnackbar.type === 'email' && <Email />}
                            {alertSnackbar.type === 'reset' && <Refresh />}
                            {alertSnackbar.message}
                        </Box>
                    }
                    action={
                        !alertSnackbar.autoHide && (
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={() => setAlertSnackbar(prev => ({ ...prev, open: false }))}
                            >
                                CERRAR
                            </Button>
                        )
                    }
                />
            </div>
        </div>
    );
}
