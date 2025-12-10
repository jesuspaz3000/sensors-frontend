import { useState, useEffect, useCallback } from 'react';
import { 
  GraphicsSectionService, 
  AlertStatus, 
  MonitoringStatus, 
  TestAlertResponse,
  SensorReading
} from '../services/airQuality/graphicsSection.service';
import type { 
  CriticalAlertNotification, 
  EmailSentNotification 
} from '../types/signalr';

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
    setActiveAlerts(prev => {
      const newAlerts = [alertData, ...prev];
      return newAlerts.slice(0, maxAlertHistory);
    });
    
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
  }, [maxAlertHistory]);

  const handleEmailSent = useCallback((emailData: EmailSentNotification) => {
    setEmailNotifications(prev => {
      const newEmails = [emailData, ...prev];
      return newEmails.slice(0, maxEmailHistory);
    });
  }, [maxEmailHistory]);

  // ========================
  // FUNCIONES DE API
  // ========================

  const resetAlert = useCallback(async (punto: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await GraphicsSectionService.resetAlertStatus(punto);
      
      setAlertStatus(prev => ({
        ...prev,
        [punto]: {
          ...prev[punto],
          HasActiveAlert: false,
          Status: 'monitoring'
        } as AlertStatus
      }));
      
      setActiveAlerts(prev => prev.filter(alert => alert.Punto !== punto));
    } catch (error) {
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
      return response || null;
    } catch (error) {
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
      setMonitoringStatus(response || null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error obteniendo estado de monitoreo');
    }
  }, []);

  const refreshActiveAlerts = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const response = await GraphicsSectionService.getActiveAlerts();
      
      const alerts: CriticalAlertNotification[] = response?.map((alert: { Punto: string; Timestamp: string; EmailSent: boolean; EmailSentTo: string; Message: string; Severity: 1 | 2 | 3; CriticalValues: Array<{ Parameter: string; Value: number; Threshold: number; Unit: string }> }) => ({
        Type: 'critical-alert' as const,
        Punto: alert.Punto,
        Timestamp: alert.Timestamp,
        EmailSent: alert.EmailSent,
        EmailSentTo: alert.EmailSentTo,
        UserNotified: '',
        UserDisplayName: '',
        CriticalValues: alert.CriticalValues,
        Reading: {} as SensorReading,
        Message: alert.Message,
        Severity: alert.Severity,
        ThresholdBreaches: alert.CriticalValues.map((cv: { Parameter: string; Value: number; Threshold: number; Unit: string }) => ({
          Parameter: cv.Parameter,
          Value: cv.Value,
          Threshold: cv.Threshold,
          Unit: cv.Unit,
          ExceededBy: cv.Value - cv.Threshold
        }))
      })) || [];
      
      setActiveAlerts(alerts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error obteniendo alertas activas');
    }
  }, []);

  const getAlertStatusForPoint = useCallback(async (punto: string): Promise<void> => {
    try {
      setError(null);
      const response = await GraphicsSectionService.getAlertStatus(punto);
      
      if (response) {
        setAlertStatus(prev => ({
          ...prev,
          [punto]: response
        }));
      }
    } catch (error) {
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
