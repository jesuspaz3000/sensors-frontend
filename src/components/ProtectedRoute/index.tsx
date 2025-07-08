'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import Loading from '../Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

// Componente interno que maneja la lógica de protección
const ProtectedRouteInternal: ComponentType<ProtectedRouteProps> = dynamic(
  () => import('./ProtectedRoute'),
  { 
    ssr: false,
    loading: () => <Loading />
  }
);

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  return (
    <ProtectedRouteInternal adminOnly={adminOnly}>
      {children}
    </ProtectedRouteInternal>
  );
}
