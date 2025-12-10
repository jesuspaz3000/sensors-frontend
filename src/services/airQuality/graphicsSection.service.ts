import { ApiService } from '../api.service';
import type {
  SensorReading,
  SensorDataResponse,
  SensorDataParams,
  SimulationResponse,
  SimulationStatus,
  RealDataAvailability,
  RealDataPointsResponse,
  RealTimeControlResponse,
  RealTimeStatusResponse,
  AlertStatus,
  ActiveAlert,
  MonitoringStatus,
} from '../../types/airQuality';
import { validatePunto, formatChartData, buildSensorDataQuery } from '../../utils/airQuality';

// Re-export types for backward compatibility
export type {
  SensorReading,
  SensorDataResponse,
  RealtimeSensorData,
  SensorDataParams,
  SimulationResponse,
  SimulationStatus,
  RealDataAvailability,
  RealDataPointsResponse,
  RealTimeControlResponse,
  RealTimeStatusResponse,
  AlertStatus,
  ActiveAlert,
  MonitoringStatus,
} from '../../types/airQuality';

import type { SignalRCallbacks } from '../../types/signalr';
import { signalRService } from '../signalr/signalr.service';
import * as signalR from '@microsoft/signalr';

export const SimulationState = {
  STOPPED: 'stopped' as const,
  RUNNING: 'simulating' as const,
  PAUSED: 'paused' as const
} as const;

export type SimulationStateType = typeof SimulationState[keyof typeof SimulationState];

export interface TestAlertResponse {
  alertProcessed: boolean;
  message: string;
  emailSent: boolean;
  criticalParametersDetected: Array<{
    parameter: string;
    value: number;
    threshold: number;
    exceededBy: number;
  }>;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: string;
  activeSimulationsCount: number;
}

export const GraphicsSectionService = {
  getSensorData: async (params: SensorDataParams = {}): Promise<SensorDataResponse> => {
    const endpoint = `/sensordata${buildSensorDataQuery(params)}`;
    return await ApiService.get<SensorDataResponse>(endpoint);
  },

  getAllSensorData: async (punto: string): Promise<{ punto: string; totalRecords: number; data: SensorReading[]; timestamp: string }> => {
    validatePunto(punto);
    return await ApiService.get(`/sensordata/all/${encodeURIComponent(punto)}`);
  },

  getLatestReading: async (punto: string): Promise<SensorReading> => {
    validatePunto(punto);
    return await ApiService.get<SensorReading>(`/sensordata/latest/${encodeURIComponent(punto)}`);
  },

  getAvailablePoints: async (): Promise<string[]> => {
    const response = await ApiService.get<string[]>('/sensordata/points');
    return Array.isArray(response) ? response : [];
  },

  startSimulation: async (punto: string): Promise<SimulationResponse> => {
    validatePunto(punto);
    return await ApiService.post<SimulationResponse>(`/sensordata/simulate/${encodeURIComponent(punto)}/start`, {});
  },

  stopSimulation: async (punto: string): Promise<SimulationResponse> => {
    validatePunto(punto);
    return await ApiService.post<SimulationResponse>(`/sensordata/simulate/${encodeURIComponent(punto)}/stop`, {});
  },

  pauseSimulation: async (punto: string): Promise<SimulationResponse> => {
    validatePunto(punto);
    return await ApiService.post<SimulationResponse>(`/sensordata/simulate/${encodeURIComponent(punto)}/pause`, {});
  },

  resumeSimulation: async (punto: string): Promise<SimulationResponse> => {
    validatePunto(punto);
    return await ApiService.post<SimulationResponse>(`/sensordata/simulate/${encodeURIComponent(punto)}/resume`, {});
  },

  restartSimulation: async (punto: string): Promise<SimulationResponse> => {
    validatePunto(punto);
    return await ApiService.post<SimulationResponse>(`/sensordata/simulate/${encodeURIComponent(punto)}/restart`, {});
  },

  getSimulationStatus: async (punto: string): Promise<SimulationStatus> => {
    validatePunto(punto);
    return await ApiService.get<SimulationStatus>(`/sensordata/simulate/${encodeURIComponent(punto)}/status`);
  },

  getAllData: async (punto: string): Promise<SensorReading[]> => {
    validatePunto(punto);
    return await ApiService.get<SensorReading[]>(`/sensordata/all/${encodeURIComponent(punto)}`);
  },

  getHealthCheck: async (): Promise<HealthCheckResponse> => {
    return await ApiService.get<HealthCheckResponse>('/sensordata/health');
  },

  formatChartData,

  getMultiplePointsData: async (
    puntos: string[], 
    params: Omit<SensorDataParams, 'punto'> = {}
  ): Promise<{ [punto: string]: SensorReading[] }> => {
    const promises = puntos.map(async (punto) => {
      const response = await GraphicsSectionService.getSensorData({ ...params, punto });
      return { punto, data: response.data || [] };
    });

    const results = await Promise.all(promises);
    
    const sensorData: { [punto: string]: SensorReading[] } = {};
    results.forEach(({ punto, data }) => {
      sensorData[punto] = data;
    });

    return sensorData;
  },

  isSimulating: async (punto: string): Promise<boolean> => {
    try {
      const response = await GraphicsSectionService.getSimulationStatus(punto);
      return response?.isActive || false;
    } catch {
      return false;
    }
  },

  // SignalR Methods
  startRealtimeConnection: async (callbacks: SignalRCallbacks): Promise<void> => {
    signalRService.setCallbacks(callbacks);
    await signalRService.start();
  },

  stopRealtimeConnection: async (): Promise<void> => {
    await signalRService.stop();
  },

  subscribeToRealtimeData: async (punto: string): Promise<void> => {
    await signalRService.subscribeToPoint(punto);
  },

  unsubscribeFromRealtimeData: async (punto: string): Promise<void> => {
    await signalRService.unsubscribeFromPoint(punto);
  },

  getRealtimeConnectionState: (): signalR.HubConnectionState => {
    return signalRService.getConnectionState();
  },

  isRealtimeConnected: (): boolean => {
    return signalRService.isConnected();
  },

  subscribeToMultiplePoints: async (puntos: string[]): Promise<void> => {
    const subscriptions = puntos.map(punto => GraphicsSectionService.subscribeToRealtimeData(punto));
    await Promise.all(subscriptions);
  },

  unsubscribeFromMultiplePoints: async (puntos: string[]): Promise<void> => {
    const unsubscriptions = puntos.map(punto => GraphicsSectionService.unsubscribeFromRealtimeData(punto));
    await Promise.all(unsubscriptions);
  },

  // Real Data Methods
  checkRealDataAvailability: async (punto: string): Promise<RealDataAvailability> => {
    return await ApiService.get<RealDataAvailability>(`/sensordata/realdata/${encodeURIComponent(punto)}/availability`);
  },

  getRealDataPoints: async (): Promise<RealDataPointsResponse> => {
    return await ApiService.get<RealDataPointsResponse>('/sensordata/realdata/points');
  },

  getRealData: async (punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }): Promise<SensorReading[]> => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/sensordata/realdata/${encodeURIComponent(punto)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await ApiService.get<SensorReading[]>(url);
  },

  startRealTimeMonitoring: async (punto: string): Promise<RealTimeControlResponse> => {
    return await ApiService.post<RealTimeControlResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/start`);
  },

  stopRealTimeMonitoring: async (punto: string): Promise<RealTimeControlResponse> => {
    return await ApiService.post<RealTimeControlResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/stop`);
  },

  getRealTimeStatus: async (punto: string): Promise<RealTimeStatusResponse> => {
    return await ApiService.get<RealTimeStatusResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/status`);
  },

  getHistoricalData: async (punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }): Promise<SensorReading[]> => {
    const queryParams = new URLSearchParams();
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params?.toDate) queryParams.append('toDate', params.toDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/sensordata/historical/${encodeURIComponent(punto)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await ApiService.get<SensorReading[]>(url);
  },

  getCatchUpData: async (punto: string, fromTime: string): Promise<SensorReading[]> => {
    const url = `/sensordata/catchup/${encodeURIComponent(punto)}?fromTime=${encodeURIComponent(fromTime)}`;
    return await ApiService.get<SensorReading[]>(url);
  },

  getCurrentData: async (punto: string): Promise<SensorReading[]> => {
    return await ApiService.get<SensorReading[]>(`/sensordata/current/${encodeURIComponent(punto)}`);
  },

  // Critical Alerts Methods
  getAlertStatus: async (punto: string): Promise<AlertStatus> => {
    return await ApiService.get<AlertStatus>(`/alerts/status?punto=${encodeURIComponent(punto)}`);
  },

  getActiveAlerts: async (): Promise<ActiveAlert[]> => {
    return await ApiService.get<ActiveAlert[]>('/alerts/recent');
  },

  getMonitoringStatus: async (): Promise<MonitoringStatus> => {
    return await ApiService.get<MonitoringStatus>('/alerts/status');
  },

  getCriticalThresholds: async (): Promise<{ MaxTemperatura: number; MaxCO3: number; MaxPM2_5: number }> => {
    return await ApiService.get<{ MaxTemperatura: number; MaxCO3: number; MaxPM2_5: number }>('/alerts/thresholds');
  },

  resetAlertStatus: async (punto: string): Promise<{ message: string; timestamp: string }> => {
    return await ApiService.post<{ message: string; timestamp: string }>(`/sensordata/reset-file-status/${encodeURIComponent(punto)}`);
  },

  testCriticalAlert: async (testReading: SensorReading): Promise<TestAlertResponse> => {
    return await ApiService.post<TestAlertResponse>('/alerts/simulate', testReading);
  },
};

export default GraphicsSectionService;
