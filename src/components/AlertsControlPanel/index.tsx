import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Warning,
  Email,
  Refresh,
  Delete,
  Science,
  CheckCircle,
  Error,
  Timeline
} from '@mui/icons-material';
import { useCriticalAlerts } from '../../hooks/useCriticalAlerts';
import { SensorReading } from '../../services/airQuality/graphicsSection.service';

interface AlertsControlPanelProps {
  availablePoints: string[];
  className?: string;
}

export const AlertsControlPanel: React.FC<AlertsControlPanelProps> = ({
  className = ''
}) => {
  const {
    activeAlerts,
    monitoringStatus,
    isLoading,
    error,
    resetAlert,
    testAlert,
    refreshMonitoringStatus,
    refreshActiveAlerts,
    clearAlertHistory,
    getTodaysEmailCount
  } = useCriticalAlerts();

  // Estado para dialog de test
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testData, setTestData] = useState({
    punto: 'Punto 1',
    temperatura: '35.0',
    humedad: '60.0',
    pM2_5: '50.0',
    cO3: '0.09'
  });

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMonitoringStatus();
      refreshActiveAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshMonitoringStatus, refreshActiveAlerts]);

  const handleResetAlert = async (punto: string) => {
    try {
      await resetAlert(punto);
      // Refrescar datos después del reset
      setTimeout(() => {
        refreshMonitoringStatus();
        refreshActiveAlerts();
      }, 1000);
    } catch (error) {
      console.error('Error reseteando alerta:', error);
    }
  };

  const handleTestAlert = async () => {
    try {
      const testReading: SensorReading = {
        timestamp: new Date().toISOString(),
        temperatura: parseFloat(testData.temperatura),
        humedad: parseFloat(testData.humedad),
        pM2_5: parseFloat(testData.pM2_5),
        cO3: parseFloat(testData.cO3),
        punto: testData.punto
      };

      const result = await testAlert(testReading);
      
      if (result?.alertProcessed) {
        alert('🚨 Alerta de prueba procesada! Revisa tu email y las notificaciones.');
        // Refrescar datos después del test
        setTimeout(() => {
          refreshMonitoringStatus();
          refreshActiveAlerts();
        }, 2000);
      } else {
        alert('ℹ️ Test ejecutado, pero no se activaron alertas. Verifica los valores.');
      }
      
      setTestDialogOpen(false);
    } catch (error) {
      console.error('Error en test de alerta:', error);
      alert('❌ Error ejecutando test de alerta');
    }
  };

  return (
    <Box className={className}>
      <Card sx={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(15px)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ color: '#ff9800' }} />
              Sistema de Alertas Críticas
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refrescar datos">
                <IconButton 
                  onClick={() => {
                    refreshMonitoringStatus();
                    refreshActiveAlerts();
                  }}
                  disabled={isLoading}
                  sx={{ color: 'white' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Probar sistema de alertas">
                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={() => setTestDialogOpen(true)}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { borderColor: '#90caf9', backgroundColor: 'rgba(144, 202, 249, 0.1)' }
                  }}
                  size="small"
                >
                  Test
                </Button>
              </Tooltip>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          {/* Estadísticas generales */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              <Card sx={{ backgroundColor: 'rgba(33, 150, 243, 0.2)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                    {monitoringStatus?.monitoringPoints || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Puntos Monitoreados
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              <Card sx={{ backgroundColor: 'rgba(244, 67, 54, 0.2)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                    {monitoringStatus?.pointsWithAlerts || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Alertas Activas
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              <Card sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {getTodaysEmailCount()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Emails Enviados Hoy
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Umbrales configurados */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline />
              Umbrales Críticos Configurados
            </Typography>
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    🌡️ Temperatura: <strong>≤ {monitoringStatus?.thresholds.maxTemperatura || 30}°C</strong>
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    💨 CO3: <strong>≤ {monitoringStatus?.thresholds.maxCO3 || 0.08} ppm</strong>
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    🫧 PM2.5: <strong>≤ {monitoringStatus?.thresholds.maxPM2_5 || 45} μg/m³</strong>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Lista de alertas activas */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Error />
                Alertas Activas ({activeAlerts.length})
              </Typography>
              
              {activeAlerts.length > 0 && (
                <Button
                  size="small"
                  startIcon={<Delete />}
                  onClick={clearAlertHistory}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Limpiar Historial
                </Button>
              )}
            </Box>

            {activeAlerts.length === 0 ? (
              <Box sx={{ 
                p: 3, 
                textAlign: 'center',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}>
                <CheckCircle sx={{ color: '#4caf50', fontSize: '3rem', mb: 1 }} />
                <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  No hay alertas activas
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Todos los puntos están dentro de los umbrales normales
                </Typography>
              </Box>
            ) : (
              <List sx={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {activeAlerts.map((alert, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Warning sx={{ color: '#f44336' }} />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {alert.Punto}
                            </Typography>
                            
                            <Chip
                              size="small"
                              label={`Severidad ${alert.Severity}`}
                              color={alert.Severity === 3 ? 'error' : alert.Severity === 2 ? 'warning' : 'info'}
                              sx={{ fontWeight: 'bold' }}
                            />
                            
                            {alert.EmailSent && (
                              <Chip
                                size="small"
                                icon={<Email />}
                                label={`Email → ${alert.EmailSentTo}`}
                                color="success"
                                variant="outlined"
                                sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                              {alert.Message}
                            </Typography>
                            
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {new Date(alert.Timestamp).toLocaleString()}
                            </Typography>
                            
                            {alert.CriticalValues.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                  Valores críticos:
                                </Typography>
                                {alert.CriticalValues.map((cv, cvIndex) => (
                                  <Chip
                                    key={cvIndex}
                                    size="small"
                                    label={`${cv.Parameter}: ${cv.Value} ${cv.Unit} (>${cv.Threshold})`}
                                    color="error"
                                    variant="outlined"
                                    sx={{ mr: 1, mt: 0.5, fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      
                      <ListItemSecondaryAction>
                        <Tooltip title="Resetear alerta para permitir nuevas notificaciones">
                          <IconButton
                            edge="end"
                            onClick={() => handleResetAlert(alert.Punto)}
                            disabled={isLoading}
                            sx={{ 
                              color: '#f44336',
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                              '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                            }}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {index < activeAlerts.length - 1 && (
                      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog para test de alertas */}
      <Dialog 
        open={testDialogOpen} 
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>🧪 Test del Sistema de Alertas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configura valores que excedan los umbrales para probar el sistema de alertas:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Punto"
                value={testData.punto}
                onChange={(e) => setTestData(prev => ({ ...prev, punto: e.target.value }))}
                variant="outlined"
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Temperatura (°C)"
                  type="number"
                  value={testData.temperatura}
                  onChange={(e) => setTestData(prev => ({ ...prev, temperatura: e.target.value }))}
                  variant="outlined"
                  size="small"
                  helperText="Umbral: ≤30°C"
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Humedad (%)"
                  type="number"
                  value={testData.humedad}
                  onChange={(e) => setTestData(prev => ({ ...prev, humedad: e.target.value }))}
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="PM2.5 (μg/m³)"
                  type="number"
                  value={testData.pM2_5}
                  onChange={(e) => setTestData(prev => ({ ...prev, pM2_5: e.target.value }))}
                  variant="outlined"
                  size="small"
                  helperText="Umbral: ≤45"
                />
              </Box>
              
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="CO3 (ppm)"
                  type="number"
                  inputProps={{ step: '0.001' }}
                  value={testData.cO3}
                  onChange={(e) => setTestData(prev => ({ ...prev, cO3: e.target.value }))}
                  variant="outlined"
                  size="small"
                  helperText="Umbral: ≤0.08"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTestAlert}
            variant="contained"
            color="warning"
            startIcon={<Science />}
            disabled={isLoading}
          >
            Ejecutar Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsControlPanel;
