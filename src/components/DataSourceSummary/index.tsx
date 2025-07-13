'use client';

import React from 'react';
import { 
  Box, 
  Card,
  CardContent,
  Typography, 
  Chip,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import {
  Sensors,
  Computer,
  History,
  CheckCircle,
  SignalWifi4Bar,
  SignalWifiOff
} from '@mui/icons-material';
import { DataSourceType, RealDataState } from '@/hooks/useRealtimeSensorData';
import * as signalR from '@microsoft/signalr';

interface DataSourceSummaryProps {
  dataSources: { [punto: string]: DataSourceType };
  realDataStates: { [punto: string]: RealDataState };
  connectionState: signalR.HubConnectionState;
  isConnected: boolean;
  puntos: string[];
}

export const DataSourceSummary: React.FC<DataSourceSummaryProps> = ({
  dataSources,
  realDataStates,
  connectionState,
  isConnected,
  puntos
}) => {
  
  // Calcular estadísticas
  const stats = {
    total: puntos.length,
    realtime: Object.values(dataSources).filter(source => source === 'realtime').length,
    simulated: Object.values(dataSources).filter(source => source === 'simulated').length,
    historical: Object.values(dataSources).filter(source => source === 'historical').length,
    realDataAvailable: Object.values(realDataStates).filter(state => state.isAvailable).length,
    monitoring: Object.values(realDataStates).filter(state => state.isMonitoring).length
  };

  const getConnectionStatusChip = () => {
    if (isConnected) {
      return (
        <Chip 
          icon={<SignalWifi4Bar />}
          label="Conectado"
          color="success"
          size="small"
          variant="filled"
        />
      );
    } else {
      return (
        <Chip 
          icon={<SignalWifiOff />}
          label="Desconectado"
          color="error"
          size="small"
          variant="filled"
        />
      );
    }
  };

  const getConnectionDescription = () => {
    switch (connectionState) {
      case signalR.HubConnectionState.Connected:
        return "Conexión SignalR establecida - Recibiendo datos en tiempo real";
      case signalR.HubConnectionState.Connecting:
        return "Estableciendo conexión SignalR...";
      case signalR.HubConnectionState.Disconnected:
        return "Sin conexión SignalR - Solo datos estáticos disponibles";
      case signalR.HubConnectionState.Disconnecting:
        return "Cerrando conexión SignalR...";
      case signalR.HubConnectionState.Reconnecting:
        return "Reestableciendo conexión SignalR...";
      default:
        return "Estado de conexión desconocido";
    }
  };

  return (
    <Card sx={{ 
      mb: 3, 
      backgroundColor: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)'
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
          Estado General del Sistema
        </Typography>
        
        {/* Estado de conexión */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'white' }}>
              Conexión:
            </Typography>
            {getConnectionStatusChip()}
          </Stack>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {getConnectionDescription()}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {/* Estadísticas de fuentes de datos */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            justifyContent: 'space-around'
          }}
        >
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <Chip 
              icon={<Sensors />}
              label={`${stats.realtime} Tiempo Real`}
              color="success"
              variant={stats.realtime > 0 ? "filled" : "outlined"}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Datos en vivo
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <Chip 
              icon={<Computer />}
              label={`${stats.simulated} Simulación`}
              color="info"
              variant={stats.simulated > 0 ? "filled" : "outlined"}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Datos simulados
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <Chip 
              icon={<History />}
              label={`${stats.historical} Históricos`}
              color="secondary"
              variant={stats.historical > 0 ? "filled" : "outlined"}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Datos almacenados
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1, minWidth: '120px' }}>
            <Chip 
              icon={<CheckCircle />}
              label={`${stats.realDataAvailable}/${stats.total} Disponibles`}
              color={stats.realDataAvailable > 0 ? "success" : "default"}
              variant={stats.realDataAvailable > 0 ? "filled" : "outlined"}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
              Datos reales
            </Typography>
          </Box>
        </Stack>

        {/* Alertas */}
        {stats.realDataAvailable === 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            No hay datos reales disponibles. El sistema está usando datos simulados o históricos.
          </Alert>
        )}
        
        {!isConnected && stats.realtime > 0 && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2, 
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            Sin conexión en tiempo real. Los datos pueden no estar actualizados.
          </Alert>
        )}

        {stats.monitoring > 0 && (
          <Alert 
            severity="success" 
            sx={{ 
              mt: 2, 
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            {stats.monitoring} punto{stats.monitoring > 1 ? 's' : ''} monitoreando en tiempo real.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSourceSummary;
