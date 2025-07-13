import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Alert, 
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Email, 
  Timeline,
  CheckCircle 
} from '@mui/icons-material';
import { MonitoringStatus } from '@/services/airQuality/graphicsSection.service';

interface CriticalAlertsDisplayProps {
  monitoringStatus: MonitoringStatus | null;
  isLoading?: boolean;
  className?: string;
  emailNotifications?: Array<{
    id: string;
    punto: string;
    email: string;
    timestamp: Date;
    message: string;
  }>;
}

export const CriticalAlertsDisplay: React.FC<CriticalAlertsDisplayProps> = ({
  monitoringStatus,
  isLoading = false,
  className = '',
  emailNotifications = []
}) => {

  return (
    <Box className={className} sx={{ width: '100%' }}>

      {/* Estadísticas del sistema */}
      {monitoringStatus && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(33, 150, 243, 0.2)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                {monitoringStatus.monitoringPoints || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Puntos Monitoreados
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(244, 67, 54, 0.2)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                {monitoringStatus.pointsWithAlerts || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Alertas Activas
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1, minWidth: '200px', backgroundColor: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {monitoringStatus.totalEmailsSentToday || 0}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Emails Enviados Hoy
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Umbrales configurados */}
      {monitoringStatus?.thresholds && (
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
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                🌡️ Temperatura: <strong>≤ {monitoringStatus.thresholds.maxTemperatura}°C</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                💨 CO3: <strong>≤ {monitoringStatus.thresholds.maxCO3} ppm</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                🫧 PM2.5: <strong>≤ {monitoringStatus.thresholds.maxPM2_5} μg/m³</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      )}



      {/* Historial de Notificaciones de Email */}
      {emailNotifications && emailNotifications.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email />
            Historial de Emails Enviados ({emailNotifications.length})
          </Typography>
          
          <List sx={{ 
            backgroundColor: 'rgba(33, 150, 243, 0.05)', 
            borderRadius: 2,
            border: '1px solid rgba(33, 150, 243, 0.2)',
            maxHeight: 400,
            overflowY: 'auto'
          }}>
            {emailNotifications.map((notification) => (
              <ListItem key={notification.id} sx={{ 
                border: '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: 2,
                mb: 1,
                backgroundColor: 'rgba(33, 150, 243, 0.1)'
              }}>
                <ListItemIcon>
                  <Email sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                        📧 {notification.message}
                      </Typography>
                      <Chip
                        icon={<CheckCircle />}
                        label="Enviado"
                        color="success"
                        size="small"
                        variant="filled"
                      />
                    </Box>
                  }
                  secondary={null}
                />
                
                <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                  <Box component="span" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                    <strong>Punto:</strong> {notification.punto} | <strong>Destinatario:</strong> {notification.email}
                  </Box>
                  <Box component="span" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 0.5 }}>
                    {notification.timestamp.toLocaleString('es-ES')}
                  </Box>
                </Box>
                
                <CheckCircle sx={{ color: '#4caf50', fontSize: '1.5rem', ml: 2 }} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Error general */}
      {isLoading && (
        <Alert severity="info" sx={{ mt: 2, backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
          <AlertTitle>Cargando</AlertTitle>
          Actualizando estado de alertas críticas...
        </Alert>
      )}
    </Box>
  );
};

export default CriticalAlertsDisplay;
