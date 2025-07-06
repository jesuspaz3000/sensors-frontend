'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { SensorData, loadSensorData } from '@/utils/csvParser';
import GraphicsComponent from '@/components/graphics';

export default function GraphicsSection() {
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
    const [showGraphs, setShowGraphs] = useState(false);
    const [sensorData, setSensorData] = useState<{ [key: string]: SensorData[] }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await loadSensorData();
                setSensorData(data);
            } catch (error) {
                console.error('Error loading sensor data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handlePointClick = (punto: string) => {
        setSelectedPoint(punto);
        setShowGraphs(true);
    };

    const handleBackToOverview = () => {
        setShowGraphs(false);
        setSelectedPoint(null);
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getChartData = (punto: string, metric: 'temperatura' | 'co3' | 'pm2_5') => {
        const data = sensorData[punto] || [];
        return {
            xAxis: data.map(item => formatTime(item.timestamp)),
            series: data.map(item => item[metric])
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white flex items-center justify-center px-4">
                <Typography 
                    variant="h4" 
                    sx={{ 
                        color: 'white',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                        textAlign: 'center'
                    }}
                >
                    Cargando datos de sensores...
                </Typography>
            </div>
        );
    }

    if (showGraphs && selectedPoint) {
        const tempData = getChartData(selectedPoint, 'temperatura');
        const co2Data = getChartData(selectedPoint, 'co3');
        const pm25Data = getChartData(selectedPoint, 'pm2_5');

        return (
            <div className="min-h-screen bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center sm:text-left">
                            Gráficas detalladas - {selectedPoint}
                        </h1>
                        <Button 
                            variant="contained" 
                            onClick={handleBackToOverview}
                            sx={{ 
                                backgroundColor: 'rgba(255,255,255,0.25)', 
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                px: { xs: 2, sm: 3 },
                                py: { xs: 1, sm: 1.5 },
                                minWidth: 'fit-content',
                                '&:hover': { 
                                    backgroundColor: 'rgba(255,255,255,0.35)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ← Volver al resumen
                        </Button>
                    </div>

                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: { xs: 3, sm: 4 },
                        maxWidth: { xs: '100%', sm: '900px', lg: '1200px' },
                        width: '100%',
                        mx: 'auto'
                    }}>
                        {/* Gráfica de Temperatura */}
                        <GraphicsComponent
                            title="Temperatura (°C)"
                            unit="°C"
                            color="#ff6b6b"
                            label="Temperatura"
                            data={tempData}
                        />

                        {/* Gráfica de CO2 */}
                        <GraphicsComponent
                            title="CO2 (ppm)"
                            unit="ppm"
                            color="#4ecdc4"
                            label="CO2"
                            data={co2Data}
                        />

                        {/* Gráfica de PM2.5 */}
                        <GraphicsComponent
                            title="PM2.5 (μg/m³)"
                            unit="μg/m³"
                            color="#ffa726"
                            label="PM2.5"
                            data={pm25Data}
                        />
                    </Box>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-green-700 via-teal-600 to-teal-700 text-white">
            <div className="flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 pt-6 sm:pt-8 pb-12 sm:pb-16">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12 lg:mb-16 text-center">
                    Visualizando la calidad del aire
                </h1>
                
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 4, sm: 5, md: 6 },
                    maxWidth: '1200px',
                    width: '100%',
                    justifyContent: 'center'
                }}>
                    {Object.keys(sensorData).map((punto) => {
                        const data = sensorData[punto];
                        const latestData = data[data.length - 1];
                        
                        if (!latestData) return null;
                        
                        return (
                            <Box key={punto} sx={{ flex: 1, minWidth: { xs: '100%', sm: '280px', md: '300px' } }}>
                                <Card 
                                    sx={{ 
                                        backgroundColor: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(15px)',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        borderRadius: 3,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            transform: 'translateY(-6px)',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                                            border: '1px solid rgba(255,255,255,0.35)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                        <Typography 
                                            variant="h4" 
                                            component="h2" 
                                            sx={{ 
                                                color: 'white', 
                                                fontWeight: 'bold', 
                                                mb: 3,
                                                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                                            }}
                                        >
                                            {punto}
                                        </Typography>
                                        
                                        {/* Área para la gráfica placeholder */}
                                        <Box 
                                            sx={{ 
                                                height: { xs: 150, sm: 180, md: 200 }, 
                                                backgroundColor: 'rgba(255,255,255,0.08)',
                                                borderRadius: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 3,
                                                border: '2px dashed rgba(255,255,255,0.4)',
                                                gap: 2,
                                                px: 2
                                            }}
                                        >
                                            <TrendingUp 
                                                sx={{ 
                                                    fontSize: { xs: 36, sm: 42, md: 48 }, 
                                                    color: 'rgba(255,255,255,0.8)',
                                                    mb: 1
                                                }} 
                                            />
                                            <Typography 
                                                variant="h6" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.9)',
                                                    fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                                                    textAlign: 'center'
                                                }}
                                            >
                                                Datos en tiempo real
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.7)', 
                                                    textAlign: 'center',
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                                    px: 1
                                                }}
                                            >
                                                Haz clic en &quot;Más información&quot; para ver gráficas detalladas
                                            </Typography>
                                        </Box>

                                        {/* Datos actuales */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.9)', 
                                                    mb: 1,
                                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                                }}
                                            >
                                                <strong>Temperatura:</strong> {latestData.temperatura.toFixed(1)}°C
                                            </Typography>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.9)', 
                                                    mb: 1,
                                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                                }}
                                            >
                                                <strong>Humedad:</strong> {latestData.humedad.toFixed(1)}%
                                            </Typography>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.9)', 
                                                    mb: 1,
                                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                                }}
                                            >
                                                <strong>CO2:</strong> {latestData.co3.toFixed(3)} ppm
                                            </Typography>
                                            <Typography 
                                                variant="body1" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.9)', 
                                                    mb: 1,
                                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                                }}
                                            >
                                                <strong>PM2.5:</strong> {latestData.pm2_5.toFixed(1)} μg/m³
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                    color: 'rgba(255,255,255,0.7)',
                                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                }}
                                            >
                                                Actualizado: {formatTime(latestData.timestamp)}
                                            </Typography>
                                        </Box>

                                        <Button 
                                            variant="contained" 
                                            fullWidth
                                            onClick={() => handlePointClick(punto)}
                                            sx={{ 
                                                backgroundColor: 'rgba(255,255,255,0.25)',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                py: { xs: 1.25, sm: 1.5 },
                                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                '&:hover': { 
                                                    backgroundColor: 'rgba(255,255,255,0.35)',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            Más información
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })}
                </Box>
            </div>
        </div>
    );
}