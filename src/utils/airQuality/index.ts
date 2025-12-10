import type { SensorReading, CsvSensorData } from '../../types/airQuality';

export const validatePunto = (punto: string): void => {
  if (!punto) {
    throw new Error('Punto is required');
  }
};

export const formatChartData = (
  data: SensorReading[],
  metric: 'temperatura' | 'cO3' | 'pM2_5' | 'humedad'
): { xAxis: string[]; series: number[] } => {
  return {
    xAxis: data.map(item => new Date(item.timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })),
    series: data.map(item => item[metric])
  };
};

export const buildSensorDataQuery = (params: {
  punto?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  simulate?: boolean;
}): string => {
  const queryParams = new URLSearchParams();

  if (params.punto) queryParams.append('punto', params.punto);
  if (params.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params.toDate) queryParams.append('toDate', params.toDate);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.simulate !== undefined) queryParams.append('simulate', params.simulate.toString());

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

// ============================================
// CSV PARSER UTILITIES
// ============================================

/**
 * Parses CSV text into sensor data array
 */
export const parseCsvData = (csvText: string): CsvSensorData[] => {
  const lines = csvText.trim().split('\n');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      timestamp: values[0],
      temperatura: parseFloat(values[1]),
      humedad: parseFloat(values[2]),
      pm2_5: parseFloat(values[3]),
      co3: parseFloat(values[4]),
      punto: values[5]
    };
  });
};

/**
 * Loads sensor data from CSV files
 */
export const loadSensorData = async (): Promise<{ [key: string]: CsvSensorData[] }> => {
  try {
    const responses = await Promise.all([
      fetch('/constants/data_punto_1.csv'),
      fetch('/constants/data_punto_2.csv'),
      fetch('/constants/data_punto_3.csv')
    ]);

    const csvTexts = await Promise.all(
      responses.map(response => response.text())
    );

    const data: { [key: string]: CsvSensorData[] } = {};
    
    csvTexts.forEach((csvText, index) => {
      const pointData = parseCsvData(csvText);
      const pointName = `Punto ${index + 1}`;
      data[pointName] = pointData;
    });

    return data;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    // Fallback a datos por defecto si no se pueden cargar los CSV
    return getDefaultCsvData();
  }
};

/**
 * Returns default CSV data as fallback
 */
export const getDefaultCsvData = (): { [key: string]: CsvSensorData[] } => {
  return {
    'Punto 1': [
      { timestamp: '2025-06-30 20:30:00', temperatura: 23.29, humedad: 50.4, pm2_5: 6.34, co3: 0.072, punto: 'Punto 1' },
      { timestamp: '2025-06-30 20:30:02', temperatura: 21.62, humedad: 48.7, pm2_5: 7.49, co3: 0.017, punto: 'Punto 1' },
      { timestamp: '2025-06-30 20:30:04', temperatura: 21.41, humedad: 58.8, pm2_5: 13.92, co3: 0.040, punto: 'Punto 1' },
      { timestamp: '2025-06-30 20:30:06', temperatura: 27.27, humedad: 42.3, pm2_5: 46.28, co3: 0.019, punto: 'Punto 1' },
      { timestamp: '2025-06-30 20:30:08', temperatura: 23.48, humedad: 59.1, pm2_5: 31.56, co3: 0.105, punto: 'Punto 1' },
    ],
    'Punto 2': [
      { timestamp: '2025-06-30 20:30:00', temperatura: 27.09, humedad: 43.0, pm2_5: 15.80, co3: 0.106, punto: 'Punto 2' },
      { timestamp: '2025-06-30 20:30:02', temperatura: 22.61, humedad: 48.9, pm2_5: 8.18, co3: 0.086, punto: 'Punto 2' },
      { timestamp: '2025-06-30 20:30:04', temperatura: 28.00, humedad: 53.2, pm2_5: 21.01, co3: 0.076, punto: 'Punto 2' },
      { timestamp: '2025-06-30 20:30:06', temperatura: 20.91, humedad: 53.9, pm2_5: 43.44, co3: 0.054, punto: 'Punto 2' },
      { timestamp: '2025-06-30 20:30:08', temperatura: 22.28, humedad: 45.9, pm2_5: 16.43, co3: 0.039, punto: 'Punto 2' },
    ],
    'Punto 3': [
      { timestamp: '2025-06-30 20:30:00', temperatura: 25.86, humedad: 58.8, pm2_5: 47.50, co3: 0.054, punto: 'Punto 3' },
      { timestamp: '2025-06-30 20:30:02', temperatura: 22.50, humedad: 55.9, pm2_5: 17.90, co3: 0.103, punto: 'Punto 3' },
      { timestamp: '2025-06-30 20:30:04', temperatura: 23.02, humedad: 55.5, pm2_5: 10.88, co3: 0.064, punto: 'Punto 3' },
      { timestamp: '2025-06-30 20:30:06', temperatura: 25.84, humedad: 46.3, pm2_5: 51.45, co3: 0.092, punto: 'Punto 3' },
      { timestamp: '2025-06-30 20:30:08', temperatura: 20.91, humedad: 57.7, pm2_5: 26.18, co3: 0.020, punto: 'Punto 3' },
    ]
  };
};
