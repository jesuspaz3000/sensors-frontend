import * as signalR from '@microsoft/signalr';
import type { RealtimeSensorData } from '../../types/airQuality';
import type {
  RealDataCacheUpdatedEvent,
  RealDataStatusChangedEvent,
  RealDataFileChangedEvent,
  RealDataFileResetEvent,
  RealDataFileStopEvent,
  CriticalAlertNotification,
  EmailSentNotification,
  SignalRCallbacks,
  BackendCriticalAlertData,
  BackendEmailSentData,
  NewReadingMessage,
} from '../../types/signalr';
import {
  formatCriticalAlertData,
  formatEmailSentData,
  calculateReconnectDelay,
  buildHubUrl,
} from '../../utils/signalr';

let connection: signalR.HubConnection | null = null;
let callbacks: SignalRCallbacks = {};
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000;
let isManualDisconnect = false;

const initializeConnection = (): void => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  const hubUrl = buildHubUrl(apiUrl);
  
  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        const token = localStorage.getItem('authToken');
        return token || '';
      }
    })
    .configureLogging(signalR.LogLevel.Information)
    .build();

  setupEventHandlers();
};

const setupEventHandlers = (): void => {
  if (!connection) return;

  connection.on('ReceiveSensorData', (data: RealtimeSensorData) => {
    callbacks.onSensorDataReceived?.(data);
  });

  connection.on('SimulationStatusChanged', (punto: string, isActive: boolean) => {
    callbacks.onSimulationStatusChanged?.(punto, isActive);
  });

  connection.on('RealDataCacheUpdated', (data: RealDataCacheUpdatedEvent) => {
    callbacks.onRealDataCacheUpdated?.(data);
  });

  connection.on('RealDataStatusChanged', (data: RealDataStatusChangedEvent) => {
    callbacks.onRealDataStatusChanged?.(data);
  });

  connection.on('RealDataFileChanged', (data: RealDataFileChangedEvent) => {
    callbacks.onRealDataFileChanged?.(data);
  });

  connection.on('RealDataFileReset', (data: RealDataFileResetEvent) => {
    callbacks.onRealDataFileReset?.(data);
  });

  connection.on('RealDataFileStop', (data: RealDataFileStopEvent) => {
    callbacks.onRealDataFileStop?.(data);
  });

  connection.on('CriticalAlertNotification', (data: CriticalAlertNotification) => {
    callbacks.onCriticalAlertNotification?.(data);
  });

  connection.on('EmailSentNotification', (data: EmailSentNotification) => {
    callbacks.onEmailSentNotification?.(data);
  });

  connection.on('criticalalert', (data: BackendCriticalAlertData) => {
    const formattedData = formatCriticalAlertData(data);
    callbacks.onCriticalAlertNotification?.(formattedData);
  });

  connection.on('alertemailsent', (data: BackendEmailSentData) => {
    const formattedData = formatEmailSentData(data);
    callbacks.onEmailSentNotification?.(formattedData);
  });

  // Nuevo evento: ReceiveNewReading - datos en tiempo real del endpoint /api/sensoringest
  connection.on('ReceiveNewReading', (message: NewReadingMessage) => {
    callbacks.onNewReadingReceived?.(message);
  });

  connection.onclose(() => {
    if (!isManualDisconnect) {
      callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Disconnected);
      handleReconnection();
    } else {
      isManualDisconnect = false;
    }
  });

  connection.onreconnecting(() => {
    callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Reconnecting);
  });

  connection.onreconnected(() => {
    callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Connected);
    reconnectAttempts = 0;
    isManualDisconnect = false;
  });
};

const start = async (): Promise<void> => {
  if (!connection) {
    initializeConnection();
  }

  if (connection?.state === signalR.HubConnectionState.Connected) {
    return;
  }

  try {
    isManualDisconnect = false;
    await connection?.start();
    callbacks.onConnectionStateChanged?.(signalR.HubConnectionState.Connected);
    reconnectAttempts = 0;
  } catch (error) {
    callbacks.onError?.(error as Error);
    if (!isManualDisconnect) {
      handleReconnection();
    }
  }
};

const stop = async (): Promise<void> => {
  if (connection) {
    isManualDisconnect = true;
    await connection.stop();
  }
};

const subscribeToPoint = async (punto: string): Promise<void> => {
  if (connection?.state !== signalR.HubConnectionState.Connected) {
    await start();
  }

  try {
    await connection?.invoke('SubscribeToPoint', punto);
  } catch (error) {
    callbacks.onError?.(error as Error);
  }
};

const unsubscribeFromPoint = async (punto: string): Promise<void> => {
  if (connection?.state !== signalR.HubConnectionState.Connected) {
    return;
  }

  try {
    await connection?.invoke('UnsubscribeFromPoint', punto);
  } catch (error) {
    callbacks.onError?.(error as Error);
  }
};

const setCallbacks = (newCallbacks: SignalRCallbacks): void => {
  callbacks = { ...callbacks, ...newCallbacks };
};

const getConnectionState = (): signalR.HubConnectionState => {
  return connection?.state || signalR.HubConnectionState.Disconnected;
};

const isConnected = (): boolean => {
  return connection?.state === signalR.HubConnectionState.Connected;
};

const handleReconnection = async (): Promise<void> => {
  if (isManualDisconnect) {
    return;
  }

  if (reconnectAttempts >= maxReconnectAttempts) {
    callbacks.onError?.(new Error('Max reconnection attempts reached'));
    return;
  }

  const delay = calculateReconnectDelay(reconnectAttempts, reconnectDelay);
  reconnectAttempts++;
  
  setTimeout(async () => {
    try {
      if (!isManualDisconnect) {
        await start();
      }
    } catch {
      // Error silenciado
    }
  }, delay);
};

const dispose = (): void => {
  isManualDisconnect = true;
  stop();
  connection = null;
  callbacks = {};
};

export const signalRService = {
  start,
  stop,
  subscribeToPoint,
  unsubscribeFromPoint,
  setCallbacks,
  getConnectionState,
  isConnected,
  dispose,
};

export default signalRService;
