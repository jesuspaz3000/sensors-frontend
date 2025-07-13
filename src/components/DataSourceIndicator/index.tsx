'use client';

import React from 'react';
import { 
  Box, 
  Chip, 
  Tooltip, 
  ButtonGroup, 
  Button, 
  Typography,
  Stack,
  Alert
} from '@mui/material';
import {
  Sensors,
  Computer,
  CheckCircle,
  Error,
  Sync,
  CloudOff
} from '@mui/icons-material';
import { DataSourceType, RealDataState } from '@/hooks/useRealtimeSensorData';

interface DataSourceIndicatorProps {
  dataSource: DataSourceType;
  realDataState: RealDataState;
  isConnected: boolean;
  onSwitchToReal: () => Promise<void>;
  onSwitchToSimulated: () => Promise<void>;
  disabled?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  dataSource,
  realDataState,
  isConnected,
  onSwitchToReal,
  onSwitchToSimulated,
  disabled = false
}) => {
  
  const getSourceConfig = () => {
    switch (dataSource) {
      case 'realtime':
        return {
          label: 'Datos Reales',
          icon: <Sensors />,
          color: 'success' as const,
          description: 'Datos en tiempo real desde sensores físicos'
        };
      case 'simulated':
      case 'historical':
        return {
          label: 'Datos Simulados',
          icon: <Computer />,
          color: 'info' as const,
          description: 'Datos completos desde archivos estáticos del backend'
        };
      default:
        return {
          label: 'Desconocido',
          icon: <Error />,
          color: 'default' as const,
          description: 'Fuente de datos no identificada'
        };
    }
  };

  const sourceConfig = getSourceConfig();

  const getAvailabilityIndicator = () => {
    if (!realDataState.isAvailable) {
      return (
        <Tooltip title="No hay datos reales disponibles">
          <Chip 
            icon={<CloudOff />}
            label="Sin datos"
            size="small"
            color="error"
            variant="outlined"
            sx={{
              borderColor: 'rgba(244, 67, 54, 0.5)',
              color: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              fontSize: '0.7rem',
              height: '22px',
              '& .MuiChip-icon': { 
                color: '#f44336',
                fontSize: '14px' 
              },
              '& .MuiChip-label': {
                px: 0.8
              }
            }}
          />
        </Tooltip>
      );
    }

    if (realDataState.isMonitoring) {
      return (
        <Tooltip title="Monitoreo activo">
          <Chip 
            icon={<Sync />}
            label="Monitoreando"
            size="small"
            color="success"
            variant="filled"
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: '#4caf50',
              fontSize: '0.7rem',
              height: '22px',
              '& .MuiChip-icon': { 
                color: '#4caf50',
                fontSize: '14px' 
              },
              '& .MuiChip-label': {
                px: 0.8
              }
            }}
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip title="Datos disponibles">
        <Chip 
          icon={<CheckCircle />}
          label="Disponible"
          size="small"
          color="warning"
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 152, 0, 0.5)',
            color: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fontSize: '0.7rem',
            height: '22px',
            '& .MuiChip-icon': { 
              color: '#ff9800',
              fontSize: '14px' 
            },
            '& .MuiChip-label': {
              px: 0.8
            }
          }}
        />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ 
      mb: 2,
      p: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 2,
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }}>
      {/* Fila superior compacta con indicadores de estado */}
      <Stack 
        direction="row" 
        spacing={1.5} 
        alignItems="center"
        sx={{ mb: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        {/* Indicador de fuente actual */}
        <Tooltip title={sourceConfig.description}>
          <Chip
            icon={sourceConfig.icon}
            label={sourceConfig.label}
            color={sourceConfig.color}
            variant="filled"
            size="medium"
            sx={{ 
              fontWeight: 'bold',
              fontSize: '0.8rem',
              height: '28px',
              '& .MuiChip-icon': { 
                fontSize: '16px' 
              },
              '& .MuiChip-label': {
                px: 1.5
              }
            }}
          />
        </Tooltip>

        <Stack direction="row" spacing={0.8}>
          {/* Indicador de disponibilidad de datos reales */}
          {getAvailabilityIndicator()}

          {/* Estado de conexión */}
          {!isConnected && (
            <Tooltip title="Sin conexión SignalR">
              <Chip 
                icon={<Error />}
                label="Sin conexión"
                size="small"
                color="error"
                variant="outlined"
                sx={{ 
                  borderColor: 'rgba(244, 67, 54, 0.5)',
                  fontSize: '0.7rem',
                  height: '24px',
                  '& .MuiChip-icon': { 
                    color: '#f44336',
                    fontSize: '14px'
                  },
                  '& .MuiChip-label': {
                    px: 0.8
                  }
                }}
              />
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* Controles de cambio de fuente más compactos */}
      <Box>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 500,
            display: 'block',
            mb: 1,
            fontSize: '0.75rem'
          }}
        >
          Cambiar fuente:
        </Typography>
        
        <Stack 
          direction="row" 
          spacing={0.8}
          sx={{ 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.8
          }}
        >
          <ButtonGroup 
            size="small" 
            variant="outlined" 
            disabled={disabled}
            sx={{ 
              '& .MuiButton-root': {
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                fontSize: '0.75rem',
                px: 1.5,
                py: 0.6,
                minWidth: 'auto',
                height: '32px',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&.Mui-disabled': {
                  opacity: 0.5
                }
              },
              '& .MuiButton-startIcon': {
                fontSize: '16px',
                marginRight: '8px'
              }
            }}
          >
            <Button
              onClick={onSwitchToReal}
              disabled={!realDataState.isAvailable || dataSource === 'realtime'}
              startIcon={<Sensors />}
              sx={{
                ...(dataSource === 'realtime' && {
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    borderColor: '#4caf50'
                  }
                })
              }}
            >
              Datos Reales
            </Button>
            
            <Button
              onClick={onSwitchToSimulated}
              disabled={dataSource === 'simulated' || dataSource === 'historical'}
              startIcon={<Computer />}
              sx={{
                ...((dataSource === 'simulated' || dataSource === 'historical') && {
                  backgroundColor: 'rgba(33, 150, 243, 0.2)',
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.3)',
                    borderColor: '#2196f3'
                  }
                })
              }}
            >
              Datos Simulados
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>

      {/* Información adicional - Solo mostrar si hay algo importante */}
      {realDataState.lastUpdate && dataSource === 'realtime' && (
        <Box sx={{ 
          mt: 1, 
          p: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 0.5,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'block',
              fontSize: '0.6rem'
            }}
          >
            � Actualizado: {realDataState.lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      )}

      {/* Alertas - Solo las críticas */}
      {!realDataState.isAvailable && dataSource === 'realtime' && (
        <Alert 
          severity="warning" 
          sx={{ 
            mt: 1.5,
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: 0.5,
            py: 0.5,
            '& .MuiAlert-message': { 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.65rem'
            },
            '& .MuiAlert-icon': {
              color: '#ff9800',
              fontSize: '16px'
            }
          }}
        >
          Sin datos reales. Usando fallback.
        </Alert>
      )}
    </Box>
  );
};

export default DataSourceIndicator;
