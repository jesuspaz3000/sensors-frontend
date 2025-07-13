import { api, ApiResponse } from '../api.service';
import { signalRService, SignalRCallbacks } from '../signalr/signalr.service';
import * as signalR from '@microsoft/signalr';

// Tipos para SensorReading basados en la documentación de la API
export interface SensorReading {
  timestamp: string;
  temperatura: number;
  humedad: number;
  pM2_5: number;     // ← Cambio: pascalCase como devuelve el backend
  cO3: number;       // ← Cambio: pascalCase como devuelve el backend
  punto: string;
}

// Tipo para la respuesta de datos de sensores
export interface SensorDataResponse {
  data: SensorReading[];
  punto: string;
  lastUpdate: string;
  totalRecords: number;
  isRealTime: boolean;
}

// Tipo para datos en tiempo real via SignalR
export interface RealtimeSensorData {
  latestReading: SensorReading;
  status: 'real-time' | 'simulating' | 'real-time-reset';
}

// Parámetros para consultar datos de sensores
export interface SensorDataParams {
  punto?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  simulate?: boolean;
}

// Respuestas de simulación
export interface SimulationResponse {
  message: string;
  startTime?: string;
  stopTime?: string;
}

// Estado de simulación mejorado
export interface SimulationStatus {
  punto: string;
  isActive: boolean;
  isPaused: boolean;
  status: 'stopped' | 'paused' | 'simulating';
  currentIndex: number;
  totalRecords: number;
  progress: number; // Porcentaje de progreso
  timestamp: string;
}

// Nuevas interfaces para datos reales
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

// Interfaces para Sistema de Alertas Críticas
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

// Estados posibles de simulación
export const SimulationState = {
  STOPPED: 'stopped' as const,
  RUNNING: 'simulating' as const,
  PAUSED: 'paused' as const
} as const;

export type SimulationStateType = typeof SimulationState[keyof typeof SimulationState];

export interface HealthCheckResponse {
  status: string;
  activeSimulationsCount: number;
}

// Clase principal del servicio de gráficas de calidad del aire
export class GraphicsSectionService {

  /**
   * Obtiene datos de sensores con filtros opcionales
   * @param params - Parámetros de consulta (punto, fechas, límite, etc.)
   * @returns Promise con los datos de sensores
   */
  static async getSensorData(params: SensorDataParams = {}): Promise<SensorDataResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.punto) queryParams.append('punto', params.punto);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.simulate !== undefined) queryParams.append('simulate', params.simulate.toString());

      const endpoint = `sensordata${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await api.secureGet<SensorDataResponse>(endpoint);
      
      // El backend devuelve directamente el objeto, no envuelto en ApiResponse
      return response as unknown as SensorDataResponse;
    } catch (error) {
      console.error('Error getting sensor data:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los datos de un sensor (para testing)
   * @param punto - Nombre del punto de sensor
   * @returns Promise con todos los datos disponibles
   */
  static async getAllSensorData(punto: string): Promise<ApiResponse<{ punto: string; totalRecords: number; data: SensorReading[]; timestamp: string }>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.secureGet<{ punto: string; totalRecords: number; data: SensorReading[]; timestamp: string }>(`sensordata/all/${encodeURIComponent(punto)}`);
      
      return response;
    } catch (error) {
      console.error(`Error getting all sensor data for ${punto}:`, error);
      throw error;
    }
  }
  static async getLatestReading(punto: string): Promise<ApiResponse<SensorReading>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.secureGet<SensorReading>(`sensordata/latest/${encodeURIComponent(punto)}`);
      return response;
    } catch (error) {
      console.error(`Error getting latest reading for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de puntos de sensores disponibles
   * @returns Promise con la lista de puntos disponibles
   */
  static async getAvailablePoints(): Promise<string[]> {
    try {
      // Primero hacer health check para ver el estado del sistema
      try {
        const healthResponse = await api.get('sensordata/health');
        console.log('🏥 [Health Check] Estado del sistema:', healthResponse);
      } catch (healthError) {
        console.warn('⚠️ [Health Check] No se pudo obtener estado del sistema:', healthError);
      }
      
      const response = await api.secureGet<string[]>('sensordata/points');
      
      // El backend devuelve directamente el array, no envuelto en ApiResponse
      if (Array.isArray(response)) {
        return response;
      }
      
      // Si viene envuelto en ApiResponse, extraer .data
      return (response as ApiResponse<string[]>).data || [];
    } catch (error) {
      console.error('Error getting available points:', error);
      throw error;
    }
  }

  /**
   * Inicia la simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con la respuesta de inicio de simulación
   */
  static async startSimulation(punto: string): Promise<ApiResponse<SimulationResponse>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.securePost<SimulationResponse>(
        `sensordata/simulate/${encodeURIComponent(punto)}/start`,
        {}
      );
      return response;
    } catch (error) {
      console.error(`Error starting simulation for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Detiene la simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con la respuesta de detener simulación
   */
  static async stopSimulation(punto: string): Promise<ApiResponse<SimulationResponse>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.securePost<SimulationResponse>(
        `sensordata/simulate/${encodeURIComponent(punto)}/stop`,
        {}
      );
      return response;
    } catch (error) {
      console.error(`Error stopping simulation for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Pausa la simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con la respuesta de pausa de simulación
   */
  static async pauseSimulation(punto: string): Promise<ApiResponse<SimulationResponse>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.securePost<SimulationResponse>(
        `sensordata/simulate/${encodeURIComponent(punto)}/pause`,
        {}
      );
      return response;
    } catch (error) {
      console.error(`Error pausing simulation for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Reanuda la simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con la respuesta de reanudar simulación
   */
  static async resumeSimulation(punto: string): Promise<ApiResponse<SimulationResponse>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.securePost<SimulationResponse>(
        `sensordata/simulate/${encodeURIComponent(punto)}/resume`,
        {}
      );
      return response;
    } catch (error) {
      console.error(`Error resuming simulation for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Reinicia la simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con la respuesta de reiniciar simulación
   */
  static async restartSimulation(punto: string): Promise<ApiResponse<SimulationResponse>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.securePost<SimulationResponse>(
        `sensordata/simulate/${encodeURIComponent(punto)}/restart`,
        {}
      );
      return response;
    } catch (error) {
      console.error(`Error restarting simulation for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de simulación para un punto específico
   * @param punto - Nombre del punto de sensor
   * @returns Promise con el estado de simulación
   */
  static async getSimulationStatus(punto: string): Promise<ApiResponse<SimulationStatus>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.secureGet<SimulationStatus>(
        `sensordata/simulate/${encodeURIComponent(punto)}/status`
      );
      return response;
    } catch (error) {
      console.error(`Error getting simulation status for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los datos de un punto específico (para testing)
   * @param punto - Nombre del punto de sensor
   * @returns Promise con todos los datos del punto
   */
  static async getAllData(punto: string): Promise<ApiResponse<SensorReading[]>> {
    try {
      if (!punto) {
        throw new Error('Punto is required');
      }
      
      const response = await api.secureGet<SensorReading[]>(
        `sensordata/all/${encodeURIComponent(punto)}`
      );
      return response;
    } catch (error) {
      console.error(`Error getting all data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de salud del sistema de sensores
   * @returns Promise con el estado de salud (endpoint público)
   */
  static async getHealthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      // Usar apiRequest directamente ya que este endpoint es público
      const response = await api.secureGet<HealthCheckResponse>('sensordata/health');
      return response;
    } catch (error) {
      console.error('Error getting health check:', error);
      throw error;
    }
  }

  /**
   * Método auxiliar para formatear datos para gráficas
   * @param data - Array de lecturas de sensores
   * @param metric - Métrica específica a extraer
   * @returns Datos formateados para gráficas
   */
  static formatChartData(
    data: SensorReading[], 
    metric: 'temperatura' | 'cO3' | 'pM2_5' | 'humedad'
  ): { xAxis: string[]; series: number[] } {
    return {
      xAxis: data.map(item => new Date(item.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })),
      series: data.map(item => item[metric])
    };
  }

  /**
   * Método auxiliar para obtener datos de múltiples puntos
   * @param puntos - Array de nombres de puntos
   * @param params - Parámetros adicionales para la consulta
   * @returns Promise con datos de todos los puntos solicitados
   */
  static async getMultiplePointsData(
    puntos: string[], 
    params: Omit<SensorDataParams, 'punto'> = {}
  ): Promise<{ [punto: string]: SensorReading[] }> {
    try {
      const promises = puntos.map(async (punto) => {
        const response = await this.getSensorData({ ...params, punto });
        return { punto, data: response.data || [] };
      });

      const results = await Promise.all(promises);
      
      const sensorData: { [punto: string]: SensorReading[] } = {};
      results.forEach(({ punto, data }) => {
        sensorData[punto] = data;
      });

      return sensorData;
    } catch (error) {
      console.error('Error getting multiple points data:', error);
      throw error;
    }
  }

  /**
   * Método auxiliar para verificar si un punto está en modo simulación
   * @param punto - Nombre del punto de sensor
   * @returns Promise con boolean indicando si está simulando
   */
  static async isSimulating(punto: string): Promise<boolean> {
    try {
      const response = await this.getSimulationStatus(punto);
      return response.data?.isActive || false;
    } catch (error) {
      console.error(`Error checking if ${punto} is simulating:`, error);
      return false;
    }
  }

  // ====================================
  // MÉTODOS DE SIGNALR PARA TIEMPO REAL
  // ====================================

  /**
   * Inicia el cliente SignalR para recibir datos en tiempo real
   * @param callbacks - Callbacks para manejar eventos de SignalR
   */
  static async startRealtimeConnection(callbacks: SignalRCallbacks): Promise<void> {
    try {
      signalRService.setCallbacks(callbacks);
      await signalRService.start();
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      throw error;
    }
  }

  /**
   * Detiene el cliente SignalR
   */
  static async stopRealtimeConnection(): Promise<void> {
    try {
      await signalRService.stop();
    } catch (error) {
      console.error('Error stopping SignalR connection:', error);
      throw error;
    }
  }

  /**
   * Suscribe a datos en tiempo real de un punto específico
   * @param punto - Nombre del punto de sensor
   */
  static async subscribeToRealtimeData(punto: string): Promise<void> {
    try {
      await signalRService.subscribeToPoint(punto);
    } catch (error) {
      console.error(`Error subscribing to realtime data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Desuscribe de datos en tiempo real de un punto específico
   * @param punto - Nombre del punto de sensor
   */
  static async unsubscribeFromRealtimeData(punto: string): Promise<void> {
    try {
      await signalRService.unsubscribeFromPoint(punto);
    } catch (error) {
      console.error(`Error unsubscribing from realtime data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de la conexión SignalR
   * @returns Estado actual de la conexión
   */
  static getRealtimeConnectionState(): signalR.HubConnectionState {
    return signalRService.getConnectionState();
  }

  /**
   * Verifica si la conexión SignalR está activa
   * @returns Boolean indicando si está conectado
   */
  static isRealtimeConnected(): boolean {
    return signalRService.isConnected();
  }

  /**
   * Configura múltiples suscripciones a puntos
   * @param puntos - Array de nombres de puntos
   */
  static async subscribeToMultiplePoints(puntos: string[]): Promise<void> {
    try {
      const subscriptions = puntos.map(punto => this.subscribeToRealtimeData(punto));
      await Promise.all(subscriptions);
    } catch (error) {
      console.error('Error subscribing to multiple points:', error);
      throw error;
    }
  }

  /**
   * Desuscribe de múltiples puntos
   * @param puntos - Array de nombres de puntos
   */
  static async unsubscribeFromMultiplePoints(puntos: string[]): Promise<void> {
    try {
      const unsubscriptions = puntos.map(punto => this.unsubscribeFromRealtimeData(punto));
      await Promise.all(unsubscriptions);
    } catch (error) {
      console.error('Error unsubscribing from multiple points:', error);
      throw error;
    }
  }

  // ========================
  // MÉTODOS PARA DATOS REALES
  // ========================

  /**
   * Verificar disponibilidad de datos reales para un punto
   * @param punto - Nombre del punto de monitoreo
   * @returns Información sobre disponibilidad de datos reales
   */
  static async checkRealDataAvailability(punto: string): Promise<ApiResponse<RealDataAvailability>> {
    try {
      return await api.get<RealDataAvailability>(`/sensordata/realdata/${encodeURIComponent(punto)}/availability`);
    } catch (error) {
      console.error(`Error checking real data availability for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener lista de puntos con datos reales disponibles
   * @returns Lista de puntos con datos reales
   */
  static async getRealDataPoints(): Promise<ApiResponse<RealDataPointsResponse>> {
    try {
      return await api.get<RealDataPointsResponse>('/sensordata/realdata/points');
    } catch (error) {
      console.error('Error getting real data points:', error);
      throw error;
    }
  }

  /**
   * Obtener datos reales directamente
   * @param punto - Nombre del punto de monitoreo
   * @param params - Parámetros de consulta opcionales
   * @returns Datos reales del sensor
   */
  static async getRealData(punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }): Promise<ApiResponse<SensorReading[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params?.toDate) queryParams.append('toDate', params.toDate);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/sensordata/realdata/${encodeURIComponent(punto)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await api.get<SensorReading[]>(url);
    } catch (error) {
      console.error(`Error getting real data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Activar monitoreo en tiempo real
   * @param punto - Nombre del punto de monitoreo
   * @returns Respuesta de activación
   */
  static async startRealTimeMonitoring(punto: string): Promise<ApiResponse<RealTimeControlResponse>> {
    try {
      return await api.post<RealTimeControlResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/start`);
    } catch (error) {
      console.error(`Error starting real-time monitoring for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Desactivar monitoreo en tiempo real
   * @param punto - Nombre del punto de monitoreo
   * @returns Respuesta de desactivación
   */
  static async stopRealTimeMonitoring(punto: string): Promise<ApiResponse<RealTimeControlResponse>> {
    try {
      return await api.post<RealTimeControlResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/stop`);
    } catch (error) {
      console.error(`Error stopping real-time monitoring for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estado del monitoreo en tiempo real
   * @param punto - Nombre del punto de monitoreo
   * @returns Estado del monitoreo
   */
  static async getRealTimeStatus(punto: string): Promise<ApiResponse<RealTimeStatusResponse>> {
    try {
      return await api.get<RealTimeStatusResponse>(`/sensordata/realtime/${encodeURIComponent(punto)}/status`);
    } catch (error) {
      console.error(`Error getting real-time status for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener datos históricos (automáticamente usa datos reales si están disponibles)
   * @param punto - Nombre del punto de monitoreo
   * @param params - Parámetros de consulta
   * @returns Datos históricos
   */
  static async getHistoricalData(punto: string, params?: { fromDate?: string; toDate?: string; limit?: number }): Promise<ApiResponse<SensorReading[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params?.toDate) queryParams.append('toDate', params.toDate);
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `/sensordata/historical/${encodeURIComponent(punto)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await api.get<SensorReading[]>(url);
    } catch (error) {
      console.error(`Error getting historical data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener datos de "catch-up" desde un tiempo específico hasta ahora
   * @param punto - Nombre del punto de monitoreo
   * @param fromTime - Tiempo desde el cual obtener datos
   * @returns Datos desde el tiempo especificado
   */
  static async getCatchUpData(punto: string, fromTime: string): Promise<ApiResponse<SensorReading[]>> {
    try {
      const url = `/sensordata/catchup/${encodeURIComponent(punto)}?fromTime=${encodeURIComponent(fromTime)}`;
      return await api.get<SensorReading[]>(url);
    } catch (error) {
      console.error(`Error getting catch-up data for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los datos actuales para graficar
   * @param punto - Nombre del punto de monitoreo
   * @returns Todos los datos actuales
   */
  static async getCurrentData(punto: string): Promise<ApiResponse<SensorReading[]>> {
    try {
      return await api.get<SensorReading[]>(`/sensordata/current/${encodeURIComponent(punto)}`);
    } catch (error) {
      console.error(`Error getting current data for ${punto}:`, error);
      throw error;
    }
  }

  // ========================
  // APIs PARA SISTEMA DE ALERTAS CRÍTICAS
  // ========================

  /**
   * Obtener estado de alertas de un punto específico
   * @param punto - Nombre del punto de monitoreo
   * @returns Estado actual de alertas para el punto
   */
  static async getAlertStatus(punto: string): Promise<ApiResponse<AlertStatus>> {
    try {
      return await api.get<AlertStatus>(`/alerts/status?punto=${encodeURIComponent(punto)}`);
    } catch (error) {
      console.error(`Error getting alert status for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las alertas activas
   * @returns Lista de alertas activas en el sistema
   */
  static async getActiveAlerts(): Promise<ApiResponse<ActiveAlert[]>> {
    try {
      return await api.get<ActiveAlert[]>('/alerts/recent');
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de monitoreo de todos los puntos
   * @returns Estado general del sistema de monitoreo
   */
  static async getMonitoringStatus(): Promise<ApiResponse<MonitoringStatus>> {
    try {
      return await api.get<MonitoringStatus>('/alerts/status');
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      throw error;
    }
  }

  /**
   * Obtener umbrales críticos configurados
   * @returns Umbrales críticos del sistema
   */
  static async getCriticalThresholds(): Promise<ApiResponse<{ MaxTemperatura: number; MaxCO3: number; MaxPM2_5: number }>> {
    try {
      return await api.get<{ MaxTemperatura: number; MaxCO3: number; MaxPM2_5: number }>('/alerts/thresholds');
    } catch (error) {
      console.error('Error getting critical thresholds:', error);
      throw error;
    }
  }

  /**
   * Resetear estado de alerta (permite enviar nuevas alertas)
   * @param punto - Nombre del punto para resetear
   * @returns Confirmación del reset
   */
  static async resetAlertStatus(punto: string): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    try {
      // Para resetear, simplemente llamamos al endpoint de reset del file watcher que maneja el estado de alertas
      return await api.post<{ message: string; timestamp: string }>(`/sensordata/reset-file-status/${encodeURIComponent(punto)}`);
    } catch (error) {
      console.error(`Error resetting alert status for ${punto}:`, error);
      throw error;
    }
  }

  /**
   * Probar el sistema de alertas con datos simulados
   * @param testReading - Datos de prueba para generar alerta
   * @returns Resultado del test de alerta
   */
  static async testCriticalAlert(testReading: SensorReading): Promise<ApiResponse<TestAlertResponse>> {
    try {
      return await api.post<TestAlertResponse>('/alerts/simulate', testReading);
    } catch (error) {
      console.error('Error testing critical alert:', error);
      throw error;
    }
  }

}

export default GraphicsSectionService;