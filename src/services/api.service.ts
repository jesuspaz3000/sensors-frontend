// Configuración base de la API - debe estar definida en .env.local
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Configuración global para el comportamiento de revalidación
export const REVALIDATION_CONFIG = {
  // Tiempo mínimo entre revalidaciones (30 minutos por defecto)
  MIN_REVALIDATION_INTERVAL: 30 * 60 * 1000,
  // Tiempo de inactividad requerido para forzar revalidación (30 minutos)
  LONG_INACTIVITY_THRESHOLD: 30 * 60 * 1000,
  // Habilitar revalidación en cambio de visibilidad (deshabilitado por defecto para evitar parpadeos)
  ENABLE_VISIBILITY_REVALIDATION: false,
  // Habilitar logs de debugging
  DEBUG_REVALIDATION: true,
};

// Función para actualizar configuración de revalidación dinámicamente
export const updateRevalidationConfig = (config: Partial<typeof REVALIDATION_CONFIG>): void => {
  Object.assign(REVALIDATION_CONFIG, config);
  console.log('Revalidation config updated:', REVALIDATION_CONFIG);
};

// Validar que la URL base esté configurada
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_URL no está definida en las variables de entorno');
  throw new Error('API URL no configurada. Verifica tu archivo .env.local');
}

// Función helper para obtener la URL base de forma segura
const getApiBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new ApiError('API URL no configurada. Verifica tu archivo .env.local', 0);
  }
  return API_BASE_URL;
};

// Tipos de respuesta de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos de error personalizados
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Configuración por defecto para las peticiones
const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
};

// Función para obtener el token de acceso
const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Función para obtener el token de refresh
const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

// Función para guardar tokens
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// Función para limpiar tokens
export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Función para refrescar el token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    // Obtener y normalizar la URL base para que no termine en /
    const apiBaseUrl = getApiBaseUrl();
    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    if (data.success && data.data.accessToken) {
      saveTokens(data.data.accessToken, refreshToken);
      return data.data.accessToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearTokens();
    return null;
  }
};

// Función principal para hacer peticiones HTTP
export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  // Obtener y normalizar la URL base para que no termine en /
  const apiBaseUrl = getApiBaseUrl();
  const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  
  // Normalizar el endpoint para que empiece con /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  // Preparar headers
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  };

  // Agregar token de acceso si está disponible y no es una petición de auth
  if (!endpoint.includes('auth/login') && !endpoint.includes('auth/register') && !endpoint.includes('auth/test-auth')) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  try {
    // Configuración específica para evitar problemas de HTTP/2 y SSL
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      // Forzar HTTP/1.1 para evitar problemas de protocolo
      signal: AbortSignal.timeout(30000), // 30 segundos de timeout
    };

    let response = await fetch(url, fetchOptions);

    // Si el token expiró (401), intentar refrescar usando la nueva validación
    if (response.status === 401 && !endpoint.includes('auth/')) {
      console.log('Received 401, attempting token validation and refresh...');
      
      const tokenValidated = await validateAndRefreshToken();
      
      if (tokenValidated) {
        // Reintentar con el token actualizado
        const newAccessToken = getAccessToken();
        if (newAccessToken) {
          headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        }
      } else {
        // Si la validación falló, ya se manejó la redirección en validateAndRefreshToken
        throw new ApiError('Session expired', 401);
      }
    }

    // Verificar si la respuesta tiene contenido antes de intentar parsear JSON
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    let data;
    if (hasJsonContent && response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        // Si falla el parsing JSON y es un error del servidor, crear un objeto de error
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        // Si es una respuesta exitosa pero sin JSON válido, devolver respuesta vacía
        data = {};
      }
    } else {
      // Respuesta sin contenido JSON o 204 No Content
      data = {};
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Manejo específico de errores de red
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError(
        'Error de conexión con el servidor. Verifica que el backend esté ejecutándose.',
        0
      );
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Timeout: La petición tardó demasiado en responder', 0);
    }
    
    // Error de red o parsing
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
};

// Tipos para el test de autenticación
interface TestAuthResponse {
  valid: boolean;
  message: string;
}

// Función para testear si el token actual es válido
const testAuthToken = async (): Promise<boolean> => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return false;
  }

  try {
    // Obtener y normalizar la URL base
    const apiBaseUrl = getApiBaseUrl();
    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    
    const response = await fetch(`${baseUrl}/auth/test-auth`, {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        'Authorization': `Bearer ${accessToken}`
      },
    });

    if (response.ok) {
      const data: TestAuthResponse = await response.json();
      return data.valid === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error testing auth token:', error);
    return false;
  }
};

// Función para validar y refrescar token si es necesario
export const validateAndRefreshToken = async (silent: boolean = false): Promise<boolean> => {
  try {
    // Primero testear si el token actual es válido
    const isValid = await testAuthToken();
    
    if (isValid) {
      if (!silent) console.log('Token is valid');
      return true;
    }
    
    if (!silent) console.log('Token is invalid, attempting to refresh...');
    
    // Si el token no es válido, intentar refrescar
    const newAccessToken = await refreshAccessToken();
    
    if (newAccessToken) {
      if (!silent) console.log('Token refreshed successfully');
      return true;
    }
    
    // Si no se pudo refrescar, limpiar todo y redirigir
    if (!silent) console.log('Failed to refresh token, redirecting to login');
    clearTokens();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return false;
  } catch (error) {
    if (!silent) console.error('Error in validateAndRefreshToken:', error);
    clearTokens();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return false;
  }
};

// Función para hacer peticiones con validación previa de token
export const apiRequestWithValidation = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  // Validar token antes de hacer la petición
  const isTokenValid = await validateAndRefreshToken();
  
  if (!isTokenValid) {
    throw new ApiError('Authentication failed', 401);
  }
  
  // Proceder con la petición normal
  return apiRequest<T>(endpoint, options);
};

// Configuración para el comportamiento de validación
interface ValidationConfig {
  enableAutoRevalidation: boolean;
  revalidationIntervalMinutes: number;
  enableVisibilityRevalidation: boolean;
}

const defaultValidationConfig: ValidationConfig = {
  enableAutoRevalidation: false, // Deshabilitado por defecto para evitar parpadeos
  revalidationIntervalMinutes: 10,
  enableVisibilityRevalidation: false, // Deshabilitado por defecto
};

// Variable global para la configuración (puede ser modificada)
let currentValidationConfig = { ...defaultValidationConfig };

// Función para configurar el comportamiento de validación
export const configureValidation = (config: Partial<ValidationConfig>) => {
  currentValidationConfig = { ...currentValidationConfig, ...config };
  console.log('Validation config updated:', currentValidationConfig);
};

// Función para obtener la configuración actual
export const getValidationConfig = (): ValidationConfig => {
  return { ...currentValidationConfig };
};

// Métodos específicos para diferentes tipos de peticiones
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  // Métodos con validación previa de token
  secureGet: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequestWithValidation<T>(endpoint, { ...options, method: 'GET' }),

  securePost: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequestWithValidation<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  securePatch: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequestWithValidation<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  securePut: <T = unknown>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequestWithValidation<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  secureDelete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    apiRequestWithValidation<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;

// Debug function para verificar configuración (solo en desarrollo)
export const debugApiConfig = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('=== CONFIGURACIÓN DE API ===');
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Access Token exists:', !!getAccessToken());
    console.log('Refresh Token exists:', !!getRefreshToken());
    
    // Testear token actual
    const isTokenValid = await testAuthToken();
    console.log('Current token is valid:', isTokenValid);
    
    console.log('============================');
  }
};

// Función para validar token de forma inmediata (útil para debugging)
export const validateTokenNow = async (): Promise<void> => {
  console.log('=== VALIDACIÓN INMEDIATA DE TOKEN ===');
  const isValid = await validateAndRefreshToken(false);
  console.log('Resultado de validación:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
  console.log('======================================');
};

// Función de debug rápido para verificar el comportamiento de revalidación
export const debugRevalidationBehavior = () => {
  if (typeof window !== 'undefined') {
    console.log('=== DEBUG COMPORTAMIENTO DE REVALIDACIÓN ===');
    console.log('Configuración actual:', REVALIDATION_CONFIG);
    console.log('Tokens en localStorage:', {
      accessToken: !!localStorage.getItem('accessToken'),
      refreshToken: !!localStorage.getItem('refreshToken')
    });
    console.log('Estado de visibilidad:', document.visibilityState);
    console.log('=============================================');
  }
};
