export interface SensorData {
    timestamp: string;
    temperatura: number;
    humedad: number;
    pm2_5: number;
    co3: number;
    punto: string;
}

export const parseCsvData = (csvText: string): SensorData[] => {
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

export const loadSensorData = async (): Promise<{ [key: string]: SensorData[] }> => {
    try {
        const responses = await Promise.all([
            fetch('/constants/data_punto_1.csv'),
            fetch('/constants/data_punto_2.csv'),
            fetch('/constants/data_punto_3.csv')
        ]);

        const csvTexts = await Promise.all(
            responses.map(response => response.text())
        );

        const data: { [key: string]: SensorData[] } = {};
        
        csvTexts.forEach((csvText, index) => {
            const pointData = parseCsvData(csvText);
            const pointName = `Punto ${index + 1}`;
            data[pointName] = pointData;
        });

        return data;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        // Fallback a datos por defecto si no se pueden cargar los CSV
        return getDefaultData();
    }
};

// Datos por defecto como fallback
const getDefaultData = (): { [key: string]: SensorData[] } => {
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
