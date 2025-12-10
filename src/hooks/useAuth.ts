import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/login/auth.service';
import type { User } from '../types/login';
import { validateAndRefreshToken, REVALIDATION_CONFIG } from '../services/api.service';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  revalidate: () => Promise<void>;
  // Configuración de revalidación disponible para debugging
  revalidationConfig: typeof REVALIDATION_CONFIG;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        const hasTokens = AuthService.isAuthenticated();
        
        if (!hasTokens) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const isValidToken = await validateAndRefreshToken();
        
        if (isValidToken) {
          const currentUser = AuthService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Tokens inválidos, limpiar localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        // Error en validación, limpiar localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isMounted]);

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // En caso de error, forzar logout local
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  const revalidate = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const isValidToken = await validateAndRefreshToken();
      
      if (isValidToken) {
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user?.roles.includes('Admin') || false;

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    logout,
    revalidate,
    revalidationConfig: REVALIDATION_CONFIG
  };
};
