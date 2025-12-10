import type { SensorReading } from '../../types/airQuality';
import type {
  CriticalAlertNotification,
  EmailSentNotification,
  BackendCriticalAlertData,
  BackendEmailSentData,
} from '../../types/signalr';

/**
 * Formats backend critical alert data to frontend format
 */
export const formatCriticalAlertData = (data: BackendCriticalAlertData): CriticalAlertNotification => {
  return {
    Type: 'critical-alert',
    Punto: data.Punto || data.punto || '',
    Timestamp: data.Timestamp || data.timestamp || new Date().toISOString(),
    EmailSent: data.EmailSent || false,
    EmailSentTo: data.EmailSentTo || data.userEmail || '',
    UserNotified: data.UserNotified || '',
    UserDisplayName: data.UserDisplayName || data.userDisplayName || '',
    CriticalValues: data.CriticalValues || [],
    Reading: data.Reading || {} as SensorReading,
    Message: data.Message || 'Alerta crítica detectada',
    Severity: data.Severity || 1,
    ThresholdBreaches: data.ThresholdBreaches || []
  };
};

/**
 * Formats backend email sent data to frontend format
 */
export const formatEmailSentData = (data: BackendEmailSentData): EmailSentNotification => {
  return {
    Type: 'email-sent',
    Punto: data.Punto || data.punto || '',
    Timestamp: data.Timestamp || data.timestamp || new Date().toISOString(),
    EmailSentTo: data.EmailSentTo || data.userEmail || '',
    UserNotified: data.UserNotified || '',
    Subject: data.Subject || data.subject || '',
    Message: data.Message || '',
    CriticalParametersCount: data.CriticalParametersCount || 0
  };
};

/**
 * Calculates exponential backoff delay for reconnection attempts
 */
export const calculateReconnectDelay = (
  attemptNumber: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number => {
  return Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
};

/**
 * Builds SignalR hub URL from API base URL
 */
export const buildHubUrl = (apiUrl: string): string => {
  const baseUrl = apiUrl.replace('/api/', '').replace('/api', '');
  return `${baseUrl}/hubs/sensordata`;
};
