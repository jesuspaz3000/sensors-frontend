'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { REVALIDATION_CONFIG } from '../../services/api.service';
import Loading from '../Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, revalidate } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const lastValidationTime = useRef<number>(0);
  const wasHiddenForLongTime = useRef<boolean>(false);
  const hiddenSinceTime = useRef<number>(0);

  // Evitar problemas de hidratación esperando a que el componente se monte
  useEffect(() => {
    setIsMounted(true);
    // Solo establecer el tiempo inicial al montar (esto es la carga inicial de la vista)
    lastValidationTime.current = Date.now();
    console.log('ProtectedRoute mounted - initial validation time set');
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (adminOnly && !isAdmin) {
      // Si la ruta requiere admin y no lo es, redirigir al home
      router.push('/home');
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, adminOnly, router, isMounted]);

  // Revalidar solo tras largos períodos de inactividad (configurable)
  useEffect(() => {
    // Usar configuración global para los umbrales de tiempo
    const LONG_INACTIVITY_THRESHOLD = REVALIDATION_CONFIG.LONG_INACTIVITY_THRESHOLD;
    const MIN_VALIDATION_INTERVAL = REVALIDATION_CONFIG.MIN_REVALIDATION_INTERVAL;
    
    // Si la revalidación por visibilidad está deshabilitada, no hacer nada
    if (!REVALIDATION_CONFIG.ENABLE_VISIBILITY_REVALIDATION) {
      if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
        console.log('ProtectedRoute: Visibility revalidation is disabled');
      }
      return;
    }
    
    const handlePageVisibilityChange = () => {
      const now = Date.now();
      
      if (document.visibilityState === 'hidden') {
        // La página se oculta, registrar el tiempo
        hiddenSinceTime.current = now;
        wasHiddenForLongTime.current = false;
        if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
          console.log('Page hidden at:', new Date(now).toLocaleTimeString());
        }
      } else if (document.visibilityState === 'visible') {
        // La página se vuelve visible
        const timeHidden = hiddenSinceTime.current ? now - hiddenSinceTime.current : 0;
        const timeSinceLastValidation = now - lastValidationTime.current;
        
        if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
          console.log(`Page visible again. Hidden for: ${Math.round(timeHidden / 60000)} minutes, Last validation: ${Math.round(timeSinceLastValidation / 60000)} minutes ago`);
        }
        
        // Solo revalidar si:
        // 1. Estuvo oculta por mucho tiempo Y
        // 2. Ha pasado mucho tiempo desde la última validación Y
        // 3. El usuario está autenticado
        if (
          timeHidden > LONG_INACTIVITY_THRESHOLD &&
          timeSinceLastValidation > MIN_VALIDATION_INTERVAL &&
          isMounted && 
          isAuthenticated && 
          !isLoading
        ) {
          if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
            console.log(`Revalidating after long inactivity (${Math.round(timeHidden / 60000)} minutes)`);
          }
          lastValidationTime.current = now;
          revalidate();
        } else {
          if (REVALIDATION_CONFIG.DEBUG_REVALIDATION) {
            console.log('Skipping revalidation - either short absence or recent validation');
          }
        }
        
        // Reset hidden time
        hiddenSinceTime.current = 0;
      }
    };

    // Solo escuchar cambios de visibilidad para detectar inactividad prolongada
    document.addEventListener('visibilitychange', handlePageVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handlePageVisibilityChange);
    };
  }, [isMounted, isAuthenticated, isLoading, revalidate]);

  // Mostrar loading hasta que el componente se monte y la autenticación se resuelva
  if (!isMounted || isLoading) {
    return <Loading />;
  }

  // Si no está autenticado, mostrar loading (se redirigirá)
  if (!isAuthenticated) {
    return <Loading />;
  }

  // Si requiere admin y no lo es, mostrar loading (se redirigirá)
  if (adminOnly && !isAdmin) {
    return <Loading />;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}

export default ProtectedRoute;
