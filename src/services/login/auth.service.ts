import { ApiService } from '../api.service';
import { saveTokens, clearTokens } from '@/lib/axios';
import type { LoginCredentials, LoginResponse, User, ValidateSessionResponse } from '../../types/login';

const saveUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

const clearUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

export const AuthService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    clearTokens();
    const response = await ApiService.post<LoginResponse>('/auth/login', credentials);
    saveTokens(response.accessToken, response.refreshToken);
    saveUser(response.user);
    return response;
  },

  logout: async (): Promise<void> => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (accessToken) {
      try {
        await ApiService.post('/auth/logout');
      } catch {
        console.warn('Server logout failed, continuing with local logout');
      }
    }
    
    clearTokens();
    clearUser();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  validateSession: async (): Promise<ValidateSessionResponse> => {
    const response = await ApiService.get<ValidateSessionResponse>('/auth/me');
    if (response.user) {
      saveUser(response.user);
    }
    return response;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await ApiService.post<LoginResponse>('/auth/refresh', { refreshToken });
    saveTokens(response.accessToken, refreshToken);
    return response;
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  },

  hasRole: (role: string): boolean => {
    const user = AuthService.getCurrentUser();
    return user?.roles?.includes(role) ?? false;
  },

  isAdmin: (): boolean => {
    return AuthService.hasRole('Admin');
  },
};

export default AuthService;
