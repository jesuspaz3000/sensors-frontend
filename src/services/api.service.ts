import apiFetch, { ApiError } from '@/lib/axios';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const ApiService = {
  // Métodos GET
  get: async <T>(url: string, config: RequestInit = {}): Promise<T> => {
    const response = await apiFetch(url, { ...config, method: 'GET' });

    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let data;
    if (hasJsonContent && response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        data = {};
      }
    } else {
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
  },

  // Métodos POST - Maneja automáticamente JSON y FormData
  post: async <T>(url: string, data: unknown = {}, config: RequestInit = {}): Promise<T> => {
    const isFormData = data instanceof FormData;

    const finalConfig: RequestInit = {
      ...config,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    };

    // Si es FormData, remover el Content-Type para que el navegador lo establezca automáticamente
    if (isFormData && finalConfig.headers) {
      const headers = finalConfig.headers as Record<string, string>;
      delete headers['Content-Type'];
    }

    const response = await apiFetch(url, finalConfig);

    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let responseData;
    if (hasJsonContent && response.status !== 204) {
      try {
        responseData = await response.json();
      } catch {
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        responseData = {};
      }
    } else {
      responseData = {};
    }

    if (!response.ok) {
      throw new ApiError(
        responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData
      );
    }

    return responseData;
  },

  // Métodos PUT - Maneja automáticamente JSON y FormData
  put: async <T>(url: string, data: unknown = {}, config: RequestInit = {}): Promise<T> => {
    const isFormData = data instanceof FormData;

    const finalConfig: RequestInit = {
      ...config,
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    };

    if (isFormData && finalConfig.headers) {
      const headers = finalConfig.headers as Record<string, string>;
      delete headers['Content-Type'];
    }

    const response = await apiFetch(url, finalConfig);

    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let responseData;
    if (hasJsonContent && response.status !== 204) {
      try {
        responseData = await response.json();
      } catch {
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        responseData = {};
      }
    } else {
      responseData = {};
    }

    if (!response.ok) {
      throw new ApiError(
        responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData
      );
    }

    return responseData;
  },

  // Métodos PATCH - Maneja automáticamente JSON y FormData
  patch: async <T>(url: string, data: unknown = {}, config: RequestInit = {}): Promise<T> => {
    const isFormData = data instanceof FormData;

    const finalConfig: RequestInit = {
      ...config,
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
    };

    if (isFormData && finalConfig.headers) {
      const headers = finalConfig.headers as Record<string, string>;
      delete headers['Content-Type'];
    }

    const response = await apiFetch(url, finalConfig);

    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let responseData;
    if (hasJsonContent && response.status !== 204) {
      try {
        responseData = await response.json();
      } catch {
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        responseData = {};
      }
    } else {
      responseData = {};
    }

    if (!response.ok) {
      throw new ApiError(
        responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData
      );
    }

    return responseData;
  },

  // Métodos DELETE
  delete: async <T>(url: string, config: RequestInit = {}): Promise<T> => {
    const response = await apiFetch(url, { ...config, method: 'DELETE' });

    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');

    let data;
    if (hasJsonContent && response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new ApiError(
            `Server error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
        data = {};
      }
    } else {
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
  },

  // Método auxiliar para subir archivos (alias de post con FormData)
  uploadFile: async <T>(url: string, formData: FormData): Promise<T> => {
    return ApiService.post<T>(url, formData);
  },
};

// ============================================
// REVALIDATION CONFIG
// ============================================

export const REVALIDATION_CONFIG = {
  // Habilitar/deshabilitar revalidación por visibilidad de página
  ENABLE_VISIBILITY_REVALIDATION: true,
  
  // Umbral de tiempo considerado "larga inactividad" (en milisegundos)
  // Por defecto: 10 minutos
  LONG_INACTIVITY_THRESHOLD: 10 * 60 * 1000,
  
  // Intervalo mínimo entre revalidaciones (en milisegundos)
  // Por defecto: 5 minutos
  MIN_REVALIDATION_INTERVAL: 5 * 60 * 1000,
  
  // Habilitar logs de debug para revalidación
  DEBUG_REVALIDATION: false,
};

/**
 * Actualiza la configuración de revalidación en tiempo de ejecución
 */
export const updateRevalidationConfig = (updates: Partial<typeof REVALIDATION_CONFIG>): void => {
  Object.assign(REVALIDATION_CONFIG, updates);
  
  if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
    console.log('[REVALIDATION_CONFIG] Updated:', REVALIDATION_CONFIG);
  }
};

/**
 * Valida y refresca el token de autenticación si es necesario
 */
export const validateAndRefreshToken = async (): Promise<boolean> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken) {
      return false;
    }
    
    // Verificar si el token es válido
    try {
      await ApiService.get('/auth/me');
      return true;
    } catch {
      // Si el token expiró, intentar refrescarlo
      if (refreshToken) {
        try {
          const response = await ApiService.post<{ accessToken: string; refreshToken: string }>(
            '/auth/refresh',
            { refreshToken }
          );
          
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          
          return true;
        } catch {
          // No se pudo refrescar el token
          return false;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('[validateAndRefreshToken] Error:', error);
    return false;
  }
};
