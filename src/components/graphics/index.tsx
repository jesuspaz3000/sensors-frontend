'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface ChartData {
    xAxis: string[];
    series: number[];
}

interface GraphicsComponentProps {
    title: string;
    unit: string;
    color: string;
    label: string;
    data: ChartData;
    criticalThreshold?: number;
}

export default function GraphicsComponent({ 
    title, 
    unit, 
    color, 
    label, 
    data,
    criticalThreshold
}: GraphicsComponentProps) {
    return (
        <Card sx={{ 
            backgroundColor: 'rgba(255,255,255,0.15)', 
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.25)',
            '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)'
            },
            transition: 'all 0.3s ease'
        }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        color: 'white', 
                        mb: { xs: 2, sm: 3 }, 
                        fontWeight: 'bold',
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
                    }}
                >
                    {title}
                </Typography>
                <Box sx={{ 
                    height: { xs: 250, sm: 300, md: 400, lg: 450 }, 
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    <LineChart
                        xAxis={[{
                            data: data.xAxis,
                            scaleType: 'point',
                            label: 'Tiempo',
                            labelStyle: { fill: 'white', fontSize: 12 },
                            tickLabelStyle: { fill: 'white', fontSize: 10 }
                        }]}
                        yAxis={[{
                            label: `${label} (${unit})`,
                            labelStyle: { fill: 'white', fontSize: 12 },
                            tickLabelStyle: { fill: 'white', fontSize: 10 }
                        }]}
                        series={[
                            {
                                data: data.series,
                                color: color,
                                label: label
                            },
                            ...(criticalThreshold !== undefined ? [{
                                data: Array(data.xAxis.length).fill(criticalThreshold),
                                color: '#ff4444',
                                label: `⚠️ Umbral Crítico (${criticalThreshold} ${unit})`,
                                curve: 'linear' as const
                            }] : [])
                        ]}
                        sx={{
                            width: '100%',
                            height: '100%',
                            '& .MuiChartsAxis-tick': {
                                stroke: 'white'
                            },
                            '& .MuiChartsAxis-line': {
                                stroke: 'white'
                            },
                            '& .MuiChartsLegend-mark': {
                                rx: 6
                            },
                            '& .MuiChartsLegend-series text': {
                                fill: 'white !important',
                                fontSize: '12px'
                            },
                            // Aplicar estilo punteado a la segunda línea (umbral crítico)
                            '& .MuiLineChart-path:nth-of-type(2)': {
                                strokeDasharray: '8 4',
                                strokeWidth: '3px'
                            },
                            // Alternativa: aplicar a todas las líneas con color específico
                            '& path[stroke="#ff4444"]': {
                                strokeDasharray: '8 4',
                                strokeWidth: '3px'
                            }
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}
