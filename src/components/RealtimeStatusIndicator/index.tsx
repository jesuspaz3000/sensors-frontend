import React from 'react';
import { Chip, Box, Typography, Tooltip } from '@mui/material';
import { 
  SignalCellularAlt, 
  SignalCellularConnectedNoInternet0Bar,
  PlayArrow,
  Stop,
  Refresh,
  CloudOff,
  Cloud
} from '@mui/icons-material';
import * as signalR from '@microsoft/signalr';

export interface RealtimeStatusIndicatorProps {
  connectionState: signalR.HubConnectionState;
  isSimulating: boolean;
  punto: string;
  lastUpdate?: string;
  dataMode: 'static' | 'realtime';
  onToggleMode?: () => void;
}

const getConnectionColor = (state: signalR.HubConnectionState) => {
  switch (state) {
    case signalR.HubConnectionState.Connected:
      return 'success';
    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      return 'warning';
    case signalR.HubConnectionState.Disconnected:
    case signalR.HubConnectionState.Disconnecting:
      return 'error';
    default:
      return 'default';
  }
};

const getConnectionText = (state: signalR.HubConnectionState) => {
  switch (state) {
    case signalR.HubConnectionState.Connected:
      return 'Conectado';
    case signalR.HubConnectionState.Connecting:
      return 'Conectando...';
    case signalR.HubConnectionState.Reconnecting:
      return 'Reconectando...';
    case signalR.HubConnectionState.Disconnected:
      return 'Desconectado';
    case signalR.HubConnectionState.Disconnecting:
      return 'Desconectando...';
    default:
      return 'Desconocido';
  }
};

const getConnectionIcon = (state: signalR.HubConnectionState) => {
  switch (state) {
    case signalR.HubConnectionState.Connected:
      return <SignalCellularAlt />;
    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      return <Refresh sx={{ animation: 'spin 1s linear infinite' }} />;
    case signalR.HubConnectionState.Disconnected:
    case signalR.HubConnectionState.Disconnecting:
    default:
      return <SignalCellularConnectedNoInternet0Bar />;
  }
};

export const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({
  connectionState,
  isSimulating,
  punto,
  lastUpdate,
  dataMode,
  onToggleMode
}) => {
  const connectionColor = getConnectionColor(connectionState);
  const connectionText = getConnectionText(connectionState);
  const connectionIcon = getConnectionIcon(connectionState);

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return 'Sin datos';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `hace ${diffSeconds}s`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `hace ${minutes}m`;
    } else {
      return date.toLocaleTimeString('es-ES');
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 1, 
        alignItems: 'center',
        p: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}
    >
      {/* Indicador de conexión */}
      <Tooltip title={`Estado de conexión SignalR: ${connectionText}`}>
        <Chip
          icon={connectionIcon}
          label={connectionText}
          color={connectionColor === 'default' ? undefined : (connectionColor as 'success' | 'warning' | 'error')}
          variant="outlined"
          size="small"
        />
      </Tooltip>

      {/* Indicador de modo de datos */}
      <Tooltip title={`Modo actual: ${dataMode === 'static' ? 'Datos históricos (CSV)' : 'Datos en tiempo real (SignalR)'}`}>
        <Chip
          icon={dataMode === 'static' ? <CloudOff /> : <Cloud />}
          label={dataMode === 'static' ? 'Histórico' : 'Tiempo Real'}
          color={dataMode === 'static' ? 'default' : 'primary'}
          variant={dataMode === 'static' ? 'outlined' : 'filled'}
          size="small"
          onClick={onToggleMode}
          clickable={!!onToggleMode}
        />
      </Tooltip>

      {/* Indicador de simulación */}
      <Tooltip title={`Simulación ${isSimulating ? 'ACTIVA - Enviando datos gradualmente respetando timestamps originales del CSV' : 'INACTIVA'} para ${punto}`}>
        <Chip
          icon={isSimulating ? <PlayArrow /> : <Stop />}
          label={isSimulating ? (dataMode === 'realtime' ? 'Simulación Gradual' : 'Simulando') : 'Sin Simular'}
          color={isSimulating ? 'warning' : 'default'}
          variant={isSimulating ? 'filled' : 'outlined'}
          size="small"
        />
      </Tooltip>

      {/* Última actualización */}
      {lastUpdate && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            minWidth: 'max-content',
            fontSize: '0.7rem'
          }}
        >
          Actualizado: {formatLastUpdate(lastUpdate)}
        </Typography>
      )}

      {/* Información del punto */}
      <Typography 
        variant="caption" 
        color="primary"
        sx={{ 
          fontWeight: 'bold',
          fontSize: '0.7rem'
        }}
      >
        {punto}
      </Typography>
    </Box>
  );
};

// Componente para múltiples puntos
export interface MultiPointStatusIndicatorProps {
  pointsStatus: {
    [punto: string]: {
      connectionState: signalR.HubConnectionState;
      isSimulating: boolean;
      lastUpdate?: string;
      dataMode: 'static' | 'realtime';
    };
  };
  onToggleMode?: (punto: string) => void;
}

export const MultiPointStatusIndicator: React.FC<MultiPointStatusIndicatorProps> = ({
  pointsStatus,
  onToggleMode
}) => {
  const totalPoints = Object.keys(pointsStatus).length;
  const connectedPoints = Object.values(pointsStatus).filter(
    status => status.connectionState === signalR.HubConnectionState.Connected
  ).length;
  const simulatingPoints = Object.values(pointsStatus).filter(
    status => status.isSimulating
  ).length;
  const realtimePoints = Object.values(pointsStatus).filter(
    status => status.dataMode === 'realtime'
  ).length;

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 2 }}>
      {/* Resumen general */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`${connectedPoints}/${totalPoints} Conectados`}
          color={connectedPoints === totalPoints ? 'success' : 'warning'}
          variant="filled"
          size="small"
        />
        <Chip
          label={`${simulatingPoints} Simulando`}
          color={simulatingPoints > 0 ? 'warning' : 'default'}
          variant={simulatingPoints > 0 ? 'filled' : 'outlined'}
          size="small"
        />
        <Chip
          label={`${realtimePoints} Tiempo Real`}
          color={realtimePoints > 0 ? 'primary' : 'default'}
          variant={realtimePoints > 0 ? 'filled' : 'outlined'}
          size="small"
        />
      </Box>

      {/* Estado individual de cada punto */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Object.entries(pointsStatus).map(([punto, status]) => (
          <RealtimeStatusIndicator
            key={punto}
            punto={punto}
            connectionState={status.connectionState}
            isSimulating={status.isSimulating}
            lastUpdate={status.lastUpdate}
            dataMode={status.dataMode}
            onToggleMode={onToggleMode ? () => onToggleMode(punto) : undefined}
          />
        ))}
      </Box>
    </Box>
  );
};

export default RealtimeStatusIndicator;

// CSS para la animación de rotación
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
