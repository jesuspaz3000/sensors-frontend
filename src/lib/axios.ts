// Configuración base de fetch con interceptores similar a axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('API URL no configurada. Verifica tu archivo .env.local');
}

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

const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const saveTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Variable para controlar si ya se está refrescando el token
let isRefreshing = false;
// Cola de peticiones que esperan el refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Función para procesar la cola de peticiones fallidas
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const baseUrl = API_BASE_URL!.endsWith('/') ? API_BASE_URL!.slice(0, -1) : API_BASE_URL;

    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  } catch {
    clearTokens();
    return null;
  }
};

interface FetchOptions extends RequestInit {
  _retry?: boolean;
}

// Función principal con interceptores
const apiFetch = async (endpoint: string, options: FetchOptions = {}): Promise<Response> => {
  const baseUrl = API_BASE_URL!.endsWith('/') ? API_BASE_URL!.slice(0, -1) : API_BASE_URL;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  // Request interceptor - agregar token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!endpoint.includes('auth/login') && !endpoint.includes('auth/register')) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(30000),
  };

  try {
    let response = await fetch(url, fetchOptions);

    // Response interceptor - manejar 401
    const isAuthError = response.status === 401;
    if (isAuthError && !options._retry && !endpoint.includes('auth/')) {
      // Si ya se está refrescando, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            headers.Authorization = `Bearer ${token}`;
            return fetch(url, { ...fetchOptions, headers });
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      options._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          // Procesar la cola con el nuevo token
          processQueue(null, newAccessToken);

          // Reintentar la petición original
          headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(url, { ...fetchOptions, headers });
        } else {
          processQueue(new Error('Failed to refresh token'), null);
          clearTokens();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          throw new ApiError('Session expired', 401);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('Error de conexión con el servidor', 0);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Timeout: La petición tardó demasiado en responder', 0);
    }

    throw new ApiError(error instanceof Error ? error.message : 'Network error', 0);
  }
};

export default apiFetch;
