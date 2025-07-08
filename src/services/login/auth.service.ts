import { api, saveTokens, clearTokens, ApiResponse } from '../api.service';

// Tipos para login
export interface LoginCredentials {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    userName: string;
    email: string;
    emailConfirmed: boolean;
    roles: string[];
  };
}

// Tipos para validación de sesión
export interface User {
  id: string;
  name: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
}

export interface ValidateSessionResponse {
  user: User;
}

// Clase principal del servicio de autenticación
export class AuthService {
  
  /**
   * Realiza el login del usuario
   * @param credentials - Credenciales de login (userName, password)
   * @returns Promise con la respuesta de la API
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      // Limpiar tokens anteriores antes de intentar login
      clearTokens();

      const response = await api.post<LoginResponse>('auth/login', credentials);
      
      // Verificar si la respuesta tiene el wrapper ApiResponse o es directa
      let loginData: LoginResponse;
      let isSuccess = false;
      
      if (response.success && response.data) {
        // Respuesta con wrapper ApiResponse
        loginData = response.data;
        isSuccess = true;
      } else if ('accessToken' in response && 'refreshToken' in response && 'user' in response) {
        // Respuesta directa sin wrapper
        loginData = response as unknown as LoginResponse;
        isSuccess = true;
      } else {
        return {
          success: false,
          message: 'Invalid response format'
        };
      }
      
      if (isSuccess && loginData) {
        // Guardar tokens en localStorage
        saveTokens(loginData.accessToken, loginData.refreshToken);
        
        // Guardar datos del usuario en localStorage
        this.saveUser(loginData.user);
        
        return {
          success: true,
          data: loginData
        };
      }

      return {
        success: false,
        message: 'Login failed'
      };
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Realiza el logout del usuario
   * @returns Promise<void>
   */
  static async logout(): Promise<void> {
    try {
      // Intentar hacer logout en el servidor si hay token
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (accessToken) {
        try {
          await api.post('auth/logout');
        } catch {
          // Si falla el logout en el servidor, continuar con el logout local
          console.warn('Server logout failed, continuing with local logout');
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Siempre limpiar tokens locales y datos del usuario
      clearTokens();
      this.clearUser();
      
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns boolean
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    return !!(accessToken && refreshToken);
  }

  /**
   * Obtiene el token de acceso actual
   * @returns string | null
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('accessToken');
  }

  /**
   * Obtiene el token de refresh actual
   * @returns string | null
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('refreshToken');
  }

  /**
   * Valida la sesión actual del usuario
   * @returns Promise con los datos del usuario
   */
  static async validateSession(): Promise<ApiResponse<ValidateSessionResponse>> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('No authentication tokens found');
      }

      const response = await api.get<ValidateSessionResponse>('auth/me');
      
      // Si la validación es exitosa, actualizar los datos del usuario
      if (response.success && response.data?.user) {
        this.saveUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      console.error('Error validating session:', error);
      // Si la validación falla, limpiar tokens y datos del usuario
      clearTokens();
      this.clearUser();
      throw error;
    }
  }

  /**
   * Obtiene los datos del usuario actual desde localStorage
   * Nota: Esta función intenta parsear los datos del usuario desde el token o localStorage
   * @returns User | null
   */
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Guarda los datos del usuario en localStorage
   * @param user - Datos del usuario
   */
  static saveUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  /**
   * Limpia los datos del usuario del localStorage
   */
  static clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   * @param role - Rol a verificar
   * @returns boolean
   */
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  }

  /**
   * Verifica si el usuario es administrador
   * @returns boolean
   */
  static isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  /**
   * Refresca el token de acceso
   * @returns Promise<boolean> - true si se refrescó exitosamente
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }

      const response = await api.post<{ accessToken: string }>('auth/refresh', {
        refreshToken
      });

      if (response.success && response.data?.accessToken) {
        // Guardar el nuevo access token manteniendo el refresh token
        saveTokens(response.data.accessToken, refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearTokens();
      return false;
    }
  }
}

export default AuthService;
