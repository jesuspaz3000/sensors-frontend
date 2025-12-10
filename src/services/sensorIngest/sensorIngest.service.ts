import { ApiService } from '../api.service';
import type { SensorReading } from '../../types/airQuality';

/**
 * Respuesta del endpoint de datos recientes de sensoringest
 * Los datos vienen directamente del endpoint /api/sensoringest/recent/{punto}
 */
export interface SensorIngestReading {
  timestamp: string;
  temperatura: number;
  humedad: number;
  pM2_5: number;
  cO3: number;
  punto: string;
}

/**
 * Respuesta del health check de sensoringest
 */
export interface SensorIngestHealthResponse {
  status: string;
  timestamp: string;
  endpoint: string;
  methods: string[];
}

/**
 * Mensaje recibido por SignalR en el evento ReceiveNewReading
 */
export interface NewReadingMessage {
  type: 'new_reading';
  data: SensorIngestReading;
  punto: string;
  timestamp: string;
}

/**
 * Convierte una lectura de SensorIngest al formato SensorReading del frontend
 */
export const convertToSensorReading = (reading: SensorIngestReading): SensorReading => {
  return {
    timestamp: reading.timestamp,
    temperatura: reading.temperatura,
    humedad: reading.humedad,
    pM2_5: reading.pM2_5,
    cO3: reading.cO3,
    punto: reading.punto,
  };
};

/**
 * Servicio para interactuar con el endpoint /api/sensoringest
 * Este endpoint recibe datos directamente de los sensores físicos
 */
export const SensorIngestService = {
  /**
   * Obtiene los datos históricos recientes de un punto específico
   * @param punto - Número del punto (1, 2, 3, etc.)
   * @param count - Cantidad de registros a obtener (default: 100)
   * @returns Array de lecturas de sensores
   */
  getRecentData: async (punto: number | string, count: number = 100): Promise<SensorReading[]> => {
    const puntoNum = typeof punto === 'string' ? parseInt(punto.replace('Punto ', ''), 10) : punto;
    const response = await ApiService.get<SensorIngestReading[] | { data: SensorIngestReading[] }>(
      `/sensoringest/recent/${puntoNum}?count=${count}`
    );
    
    // Manejar diferentes formatos de respuesta del backend
    let readings: SensorIngestReading[];
    if (Array.isArray(response)) {
      readings = response;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      readings = response.data;
    } else {
      console.warn(`⚠️ Formato de respuesta inesperado de sensoringest para punto ${puntoNum}:`, response);
      return [];
    }
    
    return readings.map(convertToSensorReading);
  },

  /**
   * Verifica el estado del endpoint de sensoringest
   * @returns Estado del servicio
   */
  healthCheck: async (): Promise<SensorIngestHealthResponse> => {
    return await ApiService.get<SensorIngestHealthResponse>('/sensoringest/health');
  },

  /**
   * Obtiene datos recientes de múltiples puntos
   * @param puntos - Array de puntos (ej: ['Punto 1', 'Punto 2'])
   * @param count - Cantidad de registros por punto
   * @returns Objeto con datos por punto
   */
  getMultiplePointsRecentData: async (
    puntos: string[],
    count: number = 100
  ): Promise<{ [punto: string]: SensorReading[] }> => {
    const promises = puntos.map(async (punto) => {
      try {
        const data = await SensorIngestService.getRecentData(punto, count);
        return { punto, data };
      } catch (error) {
        console.error(`Error obteniendo datos de ${punto}:`, error);
        return { punto, data: [] };
      }
    });

    const results = await Promise.all(promises);
    
    const sensorData: { [punto: string]: SensorReading[] } = {};
    results.forEach(({ punto, data }) => {
      sensorData[punto] = data;
    });

    return sensorData;
  },

  /**
   * Elimina el historial de datos de un punto específico
   * @param punto - Número del punto (1, 2, 3, etc.) o nombre completo ('Punto 1')
   * @returns Respuesta del servidor
   */
  clearHistory: async (punto: number | string): Promise<{ message: string }> => {
    const puntoNum = typeof punto === 'string' ? parseInt(punto.replace('Punto ', ''), 10) : punto;
    return await ApiService.delete<{ message: string }>(`/sensoringest/history/${puntoNum}`);
  },

  /**
   * Elimina el historial de datos de todos los puntos
   * @returns Respuesta del servidor
   */
  clearAllHistory: async (): Promise<{ message: string }> => {
    return await ApiService.delete<{ message: string }>('/sensoringest/history/all');
  },
};

export default SensorIngestService;
