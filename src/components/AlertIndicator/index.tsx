import React from 'react';
import { Box, Chip, Typography, Tooltip } from '@mui/material';
import { 
  Warning, 
  Email, 
  CheckCircle, 
  Error,
  Visibility,
  VisibilityOff,
  Refresh
} from '@mui/icons-material';
import { AlertStatus } from '../../services/airQuality/graphicsSection.service';

interface AlertIndicatorProps {
  punto: string;
  alertStatus?: AlertStatus;
  isLoading?: boolean;
  className?: string;
  onRefresh?: () => void;
}

export const AlertIndicator: React.FC<AlertIndicatorProps> = ({
  punto,
  alertStatus,
  isLoading = false,
  className = '',
  onRefresh
}) => {
  if (isLoading) {
    return (
      <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          size="small"
          label="Cargando..."
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>
    );
  }

  if (!alertStatus) {
    return (
      <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={`Información de alertas no disponible para ${punto}. Haz clic para cargar.`} arrow>
          <Chip 
            size="small"
            label="Sin información"
            variant="outlined"
            color="warning"
            icon={<Refresh />}
            onClick={onRefresh}
            sx={{ 
              fontSize: '0.75rem',
              cursor: onRefresh ? 'pointer' : 'default',
              '&:hover': onRefresh ? {
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderColor: '#ff9800'
              } : {}
            }}
          />
        </Tooltip>
      </Box>
    );
  }

  const getStatusColor = () => {
    switch (alertStatus.Status) {
      case 'alert-sent':
        return 'error';
      case 'monitoring':
        return 'success';
      case 'normal':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (alertStatus.Status) {
      case 'alert-sent':
        return <Error />;
      case 'monitoring':
        return <Visibility />;
      case 'normal':
        return <CheckCircle />;
      default:
        return <VisibilityOff />;
    }
  };

  const getStatusText = () => {
    switch (alertStatus.Status) {
      case 'alert-sent':
        return 'Alerta Enviada';
      case 'monitoring':
        return 'Monitoreando';
      case 'normal':
        return 'Normal';
      default:
        return 'Desconocido';
    }
  };

  const getTooltipContent = () => {
    const lines = [];
    
    if (alertStatus.HasActiveAlert) {
      lines.push(`🚨 ALERTA ACTIVA`);
      if (alertStatus.LastAlertTime) {
        lines.push(`Última alerta: ${new Date(alertStatus.LastAlertTime).toLocaleString()}`);
      }
      if (alertStatus.CurrentCriticalValues.length > 0) {
        lines.push('Valores críticos:');
        alertStatus.CurrentCriticalValues.forEach(cv => {
          lines.push(`• ${cv.Parameter}: ${cv.Value} ${cv.Unit} (umbral: ${cv.Threshold})`);
        });
      }
    } else if (alertStatus.IsMonitoring) {
      lines.push('👁️ Monitoreando valores críticos');
      lines.push('Umbrales configurados:');
      lines.push(`• Temperatura: ≤ ${alertStatus.Thresholds.MaxTemperatura}°C`);
      lines.push(`• CO3: ≤ ${alertStatus.Thresholds.MaxCO3} ppm`);
      lines.push(`• PM2.5: ≤ ${alertStatus.Thresholds.MaxPM2_5} μg/m³`);
    } else {
      lines.push('ℹ️ Monitoreo inactivo');
    }

    return lines.join('\\n');
  };

  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {alertStatus.HasActiveAlert && (
        <Tooltip title={getTooltipContent()} arrow>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            p: 1,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: 2
          }}>
            <Warning sx={{ color: '#f44336', fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 'bold' }}>
              Alerta Activa
            </Typography>
            <Email sx={{ color: '#f44336', fontSize: '0.875rem' }} />
            <Typography variant="caption" sx={{ color: '#f44336', fontSize: '0.7rem' }}>
              Email enviado
            </Typography>
            <Typography variant="caption" sx={{ color: '#f44336', fontSize: '0.7rem' }}>
              {new Date(alertStatus.LastAlertTime!).toLocaleTimeString()}
            </Typography>
          </Box>
        </Tooltip>
      )}

      {alertStatus.IsMonitoring && !alertStatus.HasActiveAlert && (
        <Tooltip title={getTooltipContent()} arrow>
          <Chip
            size="small"
            icon={getStatusIcon()}
            label={getStatusText()}
            color={getStatusColor()}
            variant="filled"
            sx={{ 
              fontSize: '0.75rem',
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Tooltip>
      )}

      {!alertStatus.IsMonitoring && !alertStatus.HasActiveAlert && (
        <Tooltip title={getTooltipContent()} arrow>
          <Chip
            size="small"
            icon={<VisibilityOff />}
            label="Sin Monitoreo"
            color="default"
            variant="outlined"
            sx={{ 
              fontSize: '0.75rem',
              opacity: 0.7,
              '& .MuiChip-icon': {
                fontSize: '0.875rem'
              }
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default AlertIndicator;
