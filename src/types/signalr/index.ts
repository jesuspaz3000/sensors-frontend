import type { SensorReading } from '../airQuality';

/**
 * Mensaje recibido por el evento ReceiveNewReading de SignalR
 * Este evento se dispara cada vez que llega una nueva lectura del endpoint /api/sensoringest
 */
export interface NewReadingMessage {
  type: 'new_reading';
  data: {
    timestamp: string;
    temperatura: number;
    humedad: number;
    pM2_5: number;
    cO3: number;
    punto: string;
  };
  punto: string;
  timestamp: string;
}

export interface RealDataCacheUpdatedEvent {
  Punto: string;
  RecordCount: number;
  ChangeType: 'cache_reloaded' | 'cache_invalidated';
  Timestamp: string;
  Message: string;
}

export interface RealDataStatusChangedEvent {
  Punto: string;
  RecordCount: number;
  Timestamp: string;
  Message: string;
}

export interface RealDataFileChangedEvent {
  Punto: string;
  ChangeType: 'file_modified' | 'file_deleted' | 'file_created';
  Timestamp: string;
  Message: string;
}

export interface RealDataFileResetEvent {
  Punto: string;
  ChangeType: 'file_reset';
  TotalRecords: number;
  Timestamp: string;
  Message: string;
}

export interface RealDataFileStopEvent {
  Punto: string;
  ChangeType: 'file_stopped';
  Timestamp: string;
  Message: string;
}

export interface CriticalAlertNotification {
  Type: 'critical-alert';
  Punto: string;
  Timestamp: string;
  EmailSent: boolean;
  EmailSentTo: string;
  UserNotified: string;
  UserDisplayName: string;
  CriticalValues: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  Reading: SensorReading;
  Message: string;
  Severity: 1 | 2 | 3;
  ThresholdBreaches: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
    ExceededBy: number;
  }>;
}

export interface EmailSentNotification {
  Type: 'email-sent';
  Punto: string;
  Timestamp: string;
  EmailSentTo: string;
  UserNotified: string;
  Subject: string;
  Message: string;
  CriticalParametersCount: number;
}

export interface BackendCriticalAlertData {
  Punto?: string;
  punto?: string;
  Timestamp?: string;
  timestamp?: string;
  EmailSent?: boolean;
  EmailSentTo?: string;
  userEmail?: string;
  UserNotified?: string;
  userDisplayName?: string;
  UserDisplayName?: string;
  CriticalValues?: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  Reading?: SensorReading;
  Message?: string;
  Severity?: 1 | 2 | 3;
  ThresholdBreaches?: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
    ExceededBy: number;
  }>;
}

export interface BackendEmailSentData {
  Punto?: string;
  punto?: string;
  Timestamp?: string;
  timestamp?: string;
  EmailSentTo?: string;
  userEmail?: string;
  UserNotified?: string;
  Subject?: string;
  subject?: string;
  Message?: string;
  CriticalParametersCount?: number;
}

export interface SignalRCallbacks {
  onSensorDataReceived?: (data: { latestReading: SensorReading; status: 'real-time' | 'simulating' | 'real-time-reset' }) => void;
  onSimulationStatusChanged?: (punto: string, isActive: boolean) => void;
  onConnectionStateChanged?: (state: string) => void;
  onError?: (error: Error) => void;
  onRealDataCacheUpdated?: (data: RealDataCacheUpdatedEvent) => void;
  onRealDataStatusChanged?: (data: RealDataStatusChangedEvent) => void;
  onRealDataFileChanged?: (data: RealDataFileChangedEvent) => void;
  onRealDataFileReset?: (data: RealDataFileResetEvent) => void;
  onRealDataFileStop?: (data: RealDataFileStopEvent) => void;
  onCriticalAlertNotification?: (data: CriticalAlertNotification) => void;
  onEmailSentNotification?: (data: EmailSentNotification) => void;
  // Nuevo callback para el evento ReceiveNewReading del endpoint /api/sensoringest
  onNewReadingReceived?: (data: NewReadingMessage) => void;
}
