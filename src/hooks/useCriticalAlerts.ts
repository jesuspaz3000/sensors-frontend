import { useState, useEffect, useCallback } from 'react';
import { 
  GraphicsSectionService, 
  AlertStatus, 
  MonitoringStatus, 
  TestAlertResponse,
  SensorReading
} from '../services/airQuality/graphicsSection.service';
import { 
  CriticalAlertNotification, 
  EmailSentNotification 
} from '../services/signalr/signalr.service';

// Estado interno del hook
export interface CriticalAlertsState {
  activeAlerts: CriticalAlertNotification[];
  emailNotifications: EmailSentNotification[];
  alertStatus: { [punto: string]: AlertStatus };
  monitoringStatus: MonitoringStatus | null;
  isLoading: boolean;
  error: string | null;
}

// Configuración del hook
export interface UseCriticalAlertsProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
  maxAlertHistory?: number; // máximo número de alertas a mantener en historial
  maxEmailHistory?: number; // máximo número de notificaciones de email a mantener
}

// Valor de retorno del hook
export interface UseCriticalAlertsReturn extends CriticalAlertsState {
  // Acciones para gestionar alertas
  resetAlert: (punto: string) => Promise<void>;
  testAlert: (testReading: SensorReading) => Promise<TestAlertResponse | null>;
  refreshMonitoringStatus: () => Promise<void>;
  refreshActiveAlerts: () => Promise<void>;
  getAlertStatusForPoint: (punto: string) => Promise<void>;
  
  // Funciones para manejar eventos de SignalR (deben ser llamadas desde el componente padre)
  handleCriticalAlert: (alertData: CriticalAlertNotification) => void;
  handleEmailSent: (emailData: EmailSentNotification) => void;
  
  // Utilidades
  clearAlertHistory: () => void;
  clearEmailHistory: () => void;
  getAlertsForPoint: (punto: string) => CriticalAlertNotification[];
  getEmailsForPoint: (punto: string) => EmailSentNotification[];
  getTodaysEmailCount: () => number;
}

export const useCriticalAlerts = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos por defecto
  maxAlertHistory = 50,
  maxEmailHistory = 100
}: UseCriticalAlertsProps = {}): UseCriticalAlertsReturn => {
  
  // Estados principales
  const [activeAlerts, setActiveAlerts] = useState<CriticalAlertNotification[]>([]);
  const [emailNotifications, setEmailNotifications] = useState<EmailSentNotification[]>([]);
  const [alertStatus, setAlertStatus] = useState<{ [punto: string]: AlertStatus }>({});
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================
  // FUNCIONES PARA MANEJAR EVENTOS DE SIGNALR
  // ========================

  const handleCriticalAlert = useCallback((alertData: CriticalAlertNotification) => {
    console.log('🚨 [useCriticalAlerts] Nueva alerta crítica recibida:', alertData);
    
    // Agregar la nueva alerta al historial
    setActiveAlerts(prev => {
      const newAlerts = [alertData, ...prev];
      // Mantener solo las alertas más recientes
      return newAlerts.slice(0, maxAlertHistory);
    });
    
    // Actualizar el estado de alertas para el punto específico
    setAlertStatus(prev => ({
      ...prev,
      [alertData.Punto]: {
        ...prev[alertData.Punto],
        HasActiveAlert: true,
        LastAlertTime: alertData.Timestamp,
        CurrentCriticalValues: alertData.CriticalValues,
        Status: 'alert-sent'
      } as AlertStatus
    }));
    
    // Mostrar notificación visual (esto puede ser personalizado por el componente padre)
    console.log(`🚨 ALERTA CRÍTICA en ${alertData.Punto}: ${alertData.Message}`);
    
  }, [maxAlertHistory]);

  const handleEmailSent = useCallback((emailData: EmailSentNotification) => {
    console.log('📧 [useCriticalAlerts] Notificación de email recibida:', emailData);
    
    // Agregar la notificación de email al historial
    setEmailNotifications(prev => {
      const newEmails = [emailData, ...prev];
      // Mantener solo las notificaciones más recientes
      return newEmails.slice(0, maxEmailHistory);
    });
    
    // Mostrar notificación de confirmación
    console.log(`📧 Email de alerta enviado a ${emailData.EmailSentTo} para ${emailData.Punto}`);
    
  }, [maxEmailHistory]);

  // ========================
  // FUNCIONES DE API
  // ========================

  const resetAlert = useCallback(async (punto: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await GraphicsSectionService.resetAlertStatus(punto);
      console.log(`✅ [useCriticalAlerts] Alerta reseteada para ${punto}:`, response);
      
      // Actualizar estado local
      setAlertStatus(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          HasActiveAlert: false,
          Status: 'monitoring'
        } as AlertStatus
      }));
      
      // Remover alertas activas para este punto
      setActiveAlerts(prev => prev.filter(alert => alert.Punto !== punto));
      
    } catch (error) {
      console.error(`❌ [useCriticalAlerts] Error reseteando alerta para ${punto}:`, error);
      setError(error instanceof Error ? error.message : 'Error reseteando alerta');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testAlert = useCallback(async (testReading: SensorReading): Promise<TestAlertResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await GraphicsSectionService.testCriticalAlert(testReading);
      console.log('🧪 [useCriticalAlerts] Resultado del test de alerta:', response);
      
      return response.data || null;
      
    } catch (error) {
      console.error('❌ [useCriticalAlerts] Error en test de alerta:', error);
      setError(error instanceof Error ? error.message : 'Error en test de alerta');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMonitoringStatus = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await GraphicsSectionService.getMonitoringStatus();
      setMonitoringStatus(response.data || null);
      
    } catch (error) {
      console.error('❌ [useCriticalAlerts] Error obteniendo estado de monitoreo:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo estado de monitoreo');
    }
  }, []);

  const refreshActiveAlerts = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await GraphicsSectionService.getActiveAlerts();
      // Convertir ActiveAlert[] a CriticalAlertNotification[] para compatibilidad
      const alerts = response.data?.map(alert => ({
        Type: 'critical-alert' as const,
        Punto: alert.Punto,
        Timestamp: alert.Timestamp,
        EmailSent: alert.EmailSent,
        EmailSentTo: alert.EmailSentTo,
        UserNotified: '',
        UserDisplayName: '',
        CriticalValues: alert.CriticalValues,
        Reading: {} as SensorReading, // Se puede mejorar si el backend envía más datos
        Message: alert.Message,
        Severity: alert.Severity,
        ThresholdBreaches: alert.CriticalValues.map(cv => ({
          Parameter: cv.Parameter,
          Value: cv.Value,
          Threshold: cv.Threshold,
          Unit: cv.Unit,
          ExceededBy: cv.Value - cv.Threshold
        }))
      })) || [];
      
      setActiveAlerts(alerts);
      
    } catch (error) {
      console.error('❌ [useCriticalAlerts] Error obteniendo alertas activas:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo alertas activas');
    }
  }, []);

  const getAlertStatusForPoint = useCallback(async (punto: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await GraphicsSectionService.getAlertStatus(punto);
      if (response.data) {
        setAlertStatus(prev => ({
          ...prev,
          [punto]: response.data!
        }));
      }
      
    } catch (error) {
      console.error(`❌ [useCriticalAlerts] Error obteniendo estado de alerta para ${punto}:`, error);
      setError(error instanceof Error ? error.message : `Error obteniendo estado de alerta para ${punto}`);
    }
  }, []);

  // ========================
  // FUNCIONES DE UTILIDAD
  // ========================

  const clearAlertHistory = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const clearEmailHistory = useCallback(() => {
    setEmailNotifications([]);
  }, []);

  const getAlertsForPoint = useCallback((punto: string): CriticalAlertNotification[] => {
    return activeAlerts.filter(alert => alert.Punto === punto);
  }, [activeAlerts]);

  const getEmailsForPoint = useCallback((punto: string): EmailSentNotification[] => {
    return emailNotifications.filter(email => email.Punto === punto);
  }, [emailNotifications]);

  const getTodaysEmailCount = useCallback((): number => {
    const today = new Date().toDateString();
    return emailNotifications.filter(email => 
      new Date(email.Timestamp).toDateString() === today
    ).length;
  }, [emailNotifications]);

  // ========================
  // EFECTOS
  // ========================

  // Auto-refresh del estado de monitoreo
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshMonitoringStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshMonitoringStatus]);

  // Cargar datos iniciales
  useEffect(() => {
    console.log('🚨 [useCriticalAlerts] Inicializando hook de alertas críticas...');
    refreshMonitoringStatus();
    refreshActiveAlerts();
  }, [refreshMonitoringStatus, refreshActiveAlerts]);

  return {
    // Estado
    activeAlerts,
    emailNotifications,
    alertStatus,
    monitoringStatus,
    isLoading,
    error,
    
    // Acciones
    resetAlert,
    testAlert,
    refreshMonitoringStatus,
    refreshActiveAlerts,
    getAlertStatusForPoint,
    
    // Manejadores de eventos SignalR
    handleCriticalAlert,
    handleEmailSent,
    
    // Utilidades
    clearAlertHistory,
    clearEmailHistory,
    getAlertsForPoint,
    getEmailsForPoint,
    getTodaysEmailCount
  };
};
