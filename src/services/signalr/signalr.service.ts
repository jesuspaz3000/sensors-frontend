import * as signalR from '@microsoft/signalr';
import { RealtimeSensorData, SensorReading } from '../airQuality/graphicsSection.service';

// Tipos para eventos de caché de datos reales
export interface RealDataCacheUpdatedEvent {
  Punto: string;
  RecordCount: number;
  ChangeType: 'cache_reloaded' | 'cache_invalidated';
  Timestamp: string;
  Message: string;
}

export interface RealDataStatusChangedEvent {
  Punto: string;
  RecordCount: number;
  Timestamp: string;
  Message: string;
}

export interface RealDataFileChangedEvent {
  Punto: string;
  ChangeType: 'file_modified' | 'file_deleted' | 'file_created';
  Timestamp: string;
  Message: string;
}

// NUEVOS EVENTOS PARA DETECCIÓN MEJORADA DE CAMBIOS
export interface RealDataFileResetEvent {
  Punto: string;
  ChangeType: 'file_reset';
  TotalRecords: number;
  Timestamp: string;
  Message: string;
}

export interface RealDataFileStopEvent {
  Punto: string;
  ChangeType: 'file_stopped';
  Timestamp: string;
  Message: string;
}

// NUEVOS EVENTOS PARA ALERTAS CRÍTICAS
export interface CriticalAlertNotification {
  Type: 'critical-alert';
  Punto: string;
  Timestamp: string;
  EmailSent: boolean;
  EmailSentTo: string;
  UserNotified: string;
  UserDisplayName: string;
  CriticalValues: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  Reading: SensorReading;
  Message: string;
  Severity: 1 | 2 | 3; // 1=MODERADO, 2=ALTO, 3=CRÍTICO
  ThresholdBreaches: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
    ExceededBy: number;
  }>;
}

export interface EmailSentNotification {
  Type: 'email-sent';
  Punto: string;
  Timestamp: string;
  EmailSentTo: string;
  UserNotified: string;
  Subject: string;
  Message: string;
  CriticalParametersCount: number;
}

// Interfaces para los datos que llegan del backend C# (formato raw)
export interface BackendCriticalAlertData {
  Punto?: string;
  punto?: string;
  Timestamp?: string;
  timestamp?: string;
  EmailSent?: boolean;
  EmailSentTo?: string;
  userEmail?: string;
  UserNotified?: string;
  userDisplayName?: string;
  UserDisplayName?: string;
  CriticalValues?: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
  }>;
  Reading?: SensorReading;
  reading?: SensorReading;
  Message?: string;
  message?: string;
  Severity?: 1 | 2 | 3;
  ThresholdBreaches?: Array<{
    Parameter: string;
    Value: number;
    Threshold: number;
    Unit: string;
    ExceededBy: number;
  }>;
}

export interface BackendEmailSentData {
  Punto?: string;
  punto?: string;
  Timestamp?: string;
  timestamp?: string;
  EmailSentTo?: string;
  userEmail?: string;
  UserNotified?: string;
  userDisplayName?: string;
  Subject?: string;
  subject?: string;
  Message?: string;
  message?: string;
  CriticalParametersCount?: number;
}

export interface SignalRCallbacks {
  onSensorDataReceived?: (data: RealtimeSensorData) => void;
  onSimulationStatusChanged?: (punto: string, isActive: boolean) => void;
  onConnectionStateChanged?: (state: signalR.HubConnectionState) => void;
  onError?: (error: Error) => void;
  // EVENTOS EXISTENTES PARA GESTIÓN DE CACHÉ
  onRealDataCacheUpdated?: (data: RealDataCacheUpdatedEvent) => void;
  onRealDataStatusChanged?: (data: RealDataStatusChangedEvent) => void;
  onRealDataFileChanged?: (data: RealDataFileChangedEvent) => void;
  // NUEVOS EVENTOS PARA DETECCIÓN MEJORADA
  onRealDataFileReset?: (data: RealDataFileResetEvent) => void;
  onRealDataFileStop?: (data: RealDataFileStopEvent) => void;
  // NUEVOS EVENTOS PARA ALERTAS CRÍTICAS
  onCriticalAlertNotification?: (data: CriticalAlertNotification) => void;
  onEmailSentNotification?: (data: EmailSentNotification) => void;
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: SignalRCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 segundo inicial
  private isManualDisconnect = false; // Flag para distinguir desconexiones intencionales
  
  constructor() {
    this.initializeConnection();
  }

  /**
   * Inicializa la conexión SignalR
   */
  private initializeConnection(): void {
    // URL del hub SignalR del backend (corregida según backend)
    const hubUrl = 'http://localhost:5191/hubs/sensordata';
    
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Configurar autenticación si es necesaria
        accessTokenFactory: () => {
          const token = localStorage.getItem('authToken');
          return token || '';
        }
      })
      // Remover reconexión automática para usar nuestra lógica controlada
      // .withAutomaticReconnect({
      //   nextRetryDelayInMilliseconds: (retryContext) => {
      //     // Implementar backoff exponencial
      //     const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
      //     console.log(`🔄 [SignalR] Reintentando conexión en ${delay}ms (intento ${retryContext.previousRetryCount + 1})`);
      //     return delay;
      //   }
      // })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  /**
   * Configura los manejadores de eventos de SignalR
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Evento: Datos de sensor en tiempo real
    this.connection.on('ReceiveSensorData', (data: RealtimeSensorData) => {
      console.log('📡 [SignalR] Datos de sensor recibidos (ReceiveSensorData):', data);
      this.callbacks.onSensorDataReceived?.(data);
    });

    // Evento: Actualización de datos de sensor (nombre alternativo del backend)
    // NOTA: Comentado temporalmente para evitar duplicación con ReceiveSensorData
    /*
    this.connection.on('sensordataupdate', (data: unknown) => {
      console.log('📡 [SignalR] Datos de sensor recibidos (sensordataupdate):', data);
      console.log('📡 [SignalR] Tipo de dato sensordataupdate:', typeof data, data);
      
      // Intentar convertir al formato esperado
      let formattedData: RealtimeSensorData;
      
      if (data && typeof data === 'object' && 'latestReading' in data) {
        // Ya tiene el formato correcto
        formattedData = data as RealtimeSensorData;
      } else if (data && typeof data === 'object' && 'timestamp' in data && 'punto' in data) {
        // Es un sensor reading directo, necesita ser envuelto
        const sensorReading = data as SensorReading;
        formattedData = {
          latestReading: sensorReading,
          status: 'simulating' // Asumir que viene de simulación
        };
      } else {
        console.error('❌ [SignalR] Formato de sensordataupdate no reconocido:', data);
        return;
      }
      
      this.callbacks.onSensorDataReceived?.(formattedData);
    });
    */

    // Evento: Cambio de estado de simulación
    this.connection.on('SimulationStatusChanged', (punto: string, isActive: boolean) => {
      console.log(`🎮 [SignalR] Estado de simulación cambiado para ${punto}: ${isActive ? 'ACTIVO' : 'INACTIVO'}`);
      this.callbacks.onSimulationStatusChanged?.(punto, isActive);
    });

    // NUEVOS EVENTOS PARA GESTIÓN DE CACHÉ DE DATOS REALES
    this.connection.on('RealDataCacheUpdated', (data: RealDataCacheUpdatedEvent) => {
      console.log('🔄 [SignalR] Caché de datos reales actualizado:', data);
      this.callbacks.onRealDataCacheUpdated?.(data);
    });

    this.connection.on('RealDataStatusChanged', (data: RealDataStatusChangedEvent) => {
      console.log('📊 [SignalR] Estado de datos reales cambiado:', data);
      this.callbacks.onRealDataStatusChanged?.(data);
    });

    this.connection.on('RealDataFileChanged', (data: RealDataFileChangedEvent) => {
      console.log('📁 [SignalR] Archivo de datos reales modificado:', data);
      this.callbacks.onRealDataFileChanged?.(data);
    });

    // NUEVOS EVENTOS PARA DETECCIÓN MEJORADA DE CAMBIOS
    this.connection.on('RealDataFileReset', (data: RealDataFileResetEvent) => {
      console.log('🔄 [SignalR] Archivo de datos reales reseteado:', data);
      this.callbacks.onRealDataFileReset?.(data);
    });

    this.connection.on('RealDataFileStop', (data: RealDataFileStopEvent) => {
      console.log('⏸️ [SignalR] Archivo de datos reales detuvo crecimiento:', data);
      this.callbacks.onRealDataFileStop?.(data);
    });

    // NUEVOS EVENTOS PARA ALERTAS CRÍTICAS
    this.connection.on('CriticalAlertNotification', (data: CriticalAlertNotification) => {
      console.log('🚨 [SignalR] Notificación de alerta crítica recibida:', data);
      this.callbacks.onCriticalAlertNotification?.(data);
    });

    this.connection.on('EmailSentNotification', (data: EmailSentNotification) => {
      console.log('📧 [SignalR] Notificación de email enviada:', data);
      this.callbacks.onEmailSentNotification?.(data);
    });

    // EVENTOS DE ALERTAS CRÍTICAS CON NOMBRES DEL BACKEND
    // Estos son los nombres exactos que envía el backend C#
    this.connection.on('criticalalert', (data: BackendCriticalAlertData) => {
      console.log('🚨 [SignalR] Alerta crítica recibida (criticalalert):', data);
      
      // Convertir al formato esperado si es necesario
      const formattedData: CriticalAlertNotification = {
        Type: 'critical-alert',
        Punto: data.Punto || data.punto || '',
        Timestamp: data.Timestamp || data.timestamp || new Date().toISOString(),
        EmailSent: data.EmailSent || false,
        EmailSentTo: data.EmailSentTo || data.userEmail || '',
        UserNotified: data.UserNotified || data.userDisplayName || '',
        UserDisplayName: data.UserDisplayName || data.userDisplayName || '',
        CriticalValues: data.CriticalValues || [],
        Reading: data.Reading || data.reading || {} as SensorReading,
        Message: data.Message || data.message || 'Alerta crítica detectada',
        Severity: data.Severity || 3,
        ThresholdBreaches: data.ThresholdBreaches || []
      };
      
      this.callbacks.onCriticalAlertNotification?.(formattedData);
    });

    this.connection.on('alertemailsent', (data: BackendEmailSentData) => {
      console.log('📧 [SignalR] Email de alerta enviado (alertemailsent):', data);
      
      // Convertir al formato esperado si es necesario
      const formattedData: EmailSentNotification = {
        Type: 'email-sent',
        Punto: data.Punto || data.punto || '',
        Timestamp: data.Timestamp || data.timestamp || new Date().toISOString(),
        EmailSentTo: data.EmailSentTo || data.userEmail || '',
        UserNotified: data.UserNotified || data.userDisplayName || '',
        Subject: data.Subject || data.subject || '',
        Message: data.Message || data.message || 'Email de alerta enviado',
        CriticalParametersCount: data.CriticalParametersCount || 0
      };
      
      this.callbacks.onEmailSentNotification?.(formattedData);
    });

    // Eventos de conexión
    this.connection.onclose((error) => {
      // Mostrar mensaje apropiado según si fue intencional o no
      if (this.isManualDisconnect) {
        console.log('✅ [SignalR] Conexión cerrada intencionalmente');
      } else {
        console.error('❌ [SignalR] Conexión cerrada inesperadamente:', error);
      }
      
      this.callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Disconnected);
      
      // Solo intentar reconectar si no fue una desconexión manual
      if (!this.isManualDisconnect) {
        console.log('🔄 [SignalR] Desconexión no intencional, iniciando proceso de reconexión...');
        this.handleReconnection();
      } else {
        console.log('✅ [SignalR] Desconexión intencional, no se intentará reconectar');
        this.isManualDisconnect = false; // Reset para futuras conexiones
      }
    });

    this.connection.onreconnecting((error) => {
      console.warn('🔄 [SignalR] Reconectando...', error);
      this.callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ [SignalR] Reconectado exitosamente. ID:', connectionId);
      this.callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Connected);
      this.reconnectAttempts = 0; // Reset contador
      this.isManualDisconnect = false; // Reset flag al reconectar exitosamente
    });
  }

  /**
   * Inicia la conexión SignalR
   */
  async start(): Promise<void> {
    if (!this.connection) {
      this.initializeConnection();
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('ℹ️ [SignalR] Ya está conectado');
      return;
    }

    try {
      console.log('🚀 [SignalR] Iniciando conexión...');
      this.isManualDisconnect = false; // Reset flag al conectar
      await this.connection?.start();
      console.log('✅ [SignalR] Conexión establecida exitosamente');
      this.callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Connected);
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('❌ [SignalR] Error al iniciar conexión:', error);
      this.callbacks.onError?.(error as Error);
      // Solo intentar reconectar si no fue una desconexión manual
      if (!this.isManualDisconnect) {
        this.handleReconnection();
      }
    }
  }

  /**
   * Detiene la conexión SignalR
   */
  async stop(): Promise<void> {
    if (this.connection) {
      console.log('🛑 [SignalR] Deteniendo conexión...');
      this.isManualDisconnect = true; // Marcar como desconexión intencional
      await this.connection.stop();
      console.log('✅ [SignalR] Conexión detenida');
    }
  }

  /**
   * Suscribe a datos de un punto específico
   */
  async subscribeToPoint(punto: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ [SignalR] No conectado. Iniciando conexión...');
      await this.start();
    }

    try {
      console.log(`📡 [SignalR] Suscribiéndose a punto: ${punto}`);
      await this.connection?.invoke('SubscribeToPoint', punto);
      console.log(`✅ [SignalR] Suscrito exitosamente a: ${punto}`);
    } catch (error) {
      console.error(`❌ [SignalR] Error al suscribirse a ${punto}:`, error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Desuscribe de datos de un punto específico
   */
  async unsubscribeFromPoint(punto: string): Promise<void> {
    if (this.connection?.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ [SignalR] No conectado para desuscribirse');
      return;
    }

    try {
      console.log(`📡 [SignalR] Desuscribiéndose de punto: ${punto}`);
      await this.connection?.invoke('UnsubscribeFromPoint', punto);
      console.log(`✅ [SignalR] Desuscrito exitosamente de: ${punto}`);
    } catch (error) {
      console.error(`❌ [SignalR] Error al desuscribirse de ${punto}:`, error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Configura los callbacks para eventos
   */
  setCallbacks(callbacks: SignalRCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Maneja la lógica de reconexión manual
   */
  private async handleReconnection(): Promise<void> {
    // Verificar si la desconexión fue intencional
    if (this.isManualDisconnect) {
      console.log('ℹ️ [SignalR] Reconexión cancelada - desconexión fue intencional');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ [SignalR] Máximo de intentos de reconexión alcanzado (${this.maxReconnectAttempts})`);
      this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`🔄 [SignalR] Intentando reconexión automática en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        // Verificar nuevamente antes de reconectar
        if (!this.isManualDisconnect) {
          await this.start();
        } else {
          console.log('ℹ️ [SignalR] Reconexión cancelada durante timeout - desconexión fue intencional');
        }
      } catch (error) {
        console.error('❌ [SignalR] Error en reconexión automática:', error);
      }
    }, delay);
  }

  /**
   * Limpia recursos y cierra la conexión
   */
  dispose(): void {
    this.isManualDisconnect = true; // Marcar como intencional antes de cerrar
    this.stop();
    this.connection = null;
    this.callbacks = {};
  }
}

// Singleton para usar en toda la aplicación
export const signalRService = new SignalRService();
export default signalRService;
