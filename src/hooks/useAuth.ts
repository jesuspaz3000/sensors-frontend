import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, User } from '../services/login/auth.service';
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
    // Log de configuración al montar (solo en development)
    if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
      console.log('useAuth initialized with config:', {
        visibilityRevalidation: REVALIDATION_CONFIG.ENABLE_VISIBILITY_REVALIDATION,
        inactivityThreshold: `${REVALIDATION_CONFIG.LONG_INACTIVITY_THRESHOLD / 60000} minutes`,
        minInterval: `${REVALIDATION_CONFIG.MIN_REVALIDATION_INTERVAL / 60000} minutes`
      });
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const checkAuth = async () => {
      try {
        // Primero verificar si hay tokens básicos
        const hasTokens = AuthService.isAuthenticated();
        
        if (!hasTokens) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Si hay tokens, validarlos con el servidor (modo silencioso para carga inicial)
        console.log('Validating tokens with server...');
        const isValidToken = await validateAndRefreshToken(true);
        
        if (isValidToken) {
          // Token válido, obtener datos del usuario
          const currentUser = AuthService.getCurrentUser();
          setUser(currentUser);
          setIsAuthenticated(true);
          console.log('Authentication successful');
        } else {
          // Token inválido y no se pudo refrescar
          setUser(null);
          setIsAuthenticated(false);
          console.log('Authentication failed - invalid token');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
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
    // Solo revalidar si no está ya cargando para evitar múltiples llamadas simultáneas
    if (isLoading) {
      console.log('Skipping revalidation - already loading');
      return;
    }
    
    setIsLoading(true);
    try {
      const isValidToken = await validateAndRefreshToken(true);
      
      if (isValidToken) {
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error during revalidation:', error);
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
