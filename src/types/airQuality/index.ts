export interface SensorReading {
  timestamp: string;
  temperatura: number;
  humedad: number;
  pM2_5: number;
  cO3: number;
  punto: string;
}

export interface SensorDataResponse {
  data: SensorReading[];
  punto: string;
  lastUpdate: string;
  totalRecords: number;
  isRealTime: boolean;
}

export interface RealtimeSensorData {
  latestReading: SensorReading;
  status: 'real-time' | 'simulating' | 'real-time-reset';
}

export interface SensorDataParams {
  punto?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  simulate?: boolean;
}

export interface SimulationResponse {
  message: string;
  startTime?: string;
  stopTime?: string;
}

export interface SimulationStatus {
  punto: string;
  isActive: boolean;
  isPaused: boolean;
  status: 'stopped' | 'paused' | 'simulating';
  currentIndex: number;
  totalRecords: number;
  progress: number;
  timestamp: string;
}

export interface RealDataAvailability {
  punto: string;
  fileExists: boolean;
  hasData: boolean;
  message: string;
  timestamp: string;
}

export interface RealDataPointsResponse {
  availableRealDataPoints: string[];
  count: number;
  timestamp: string;
}

export interface RealTimeControlResponse {
  punto: string;
  action: 'started' | 'stopped';
  message: string;
  timestamp: string;
}

export interface RealTimeStatusResponse {
  punto: string;
  isActive: boolean;
  startTime?: string;
  message: string;
  timestamp: string;
}

export interface AlertStatus {
  Punto: string;
  IsMonitoring: boolean;
  HasActiveAlert: boolean;
  LastAlertTime?: string;
  CurrentCriticalValues: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  Thresholds: {
    MaxTemperatura: number;
    MaxCO3: number;
    MaxPM2_5: number;
  };
  LastReading?: SensorReading;
  Status: 'monitoring' | 'alert-sent' | 'normal';
}

export interface ActiveAlert {
  Punto: string;
  Timestamp: string;
  Severity: 1 | 2 | 3;
  Message: string;
  CriticalValues: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  EmailSent: boolean;
  EmailSentTo: string;
}

export interface MonitoringStatus {
  monitoringPoints: number;
  pointsWithAlerts: number;
  totalEmailsSentToday: number;
  thresholds: {
    maxTemperatura: number;
    maxCO3: number;
    maxPM2_5: number;
  };
  points: {
    [punto: string]: {
      isMonitoring: boolean;
      hasActiveAlert: boolean;
      lastAlertTime?: string;
    };
  };
}

// UI State types for graphics section
export interface FileNotification {
  type: 'reset' | 'stopped' | 'active';
  message: string;
  timestamp: Date;
}

export interface AlertSnackbarState {
  open: boolean;
  type: 'critical' | 'email' | 'reset';
  message: string;
  punto: string;
  autoHide: boolean;
}

export interface EmailNotification {
  id: string;
  punto: string;
  email: string;
  timestamp: Date;
  message: string;
}

// CSV Parser types
export interface CsvSensorData {
  timestamp: string;
  temperatura: number;
  humedad: number;
  pm2_5: number;
  co3: number;
  punto: string;
}