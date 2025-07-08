# Servicios de Autenticación y API

Este proyecto incluye servicios completos para autenticación y manejo de API. A continuación se muestra cómo usar cada servicio.

## Variables de Entorno

Asegúrate de configurar la variable de entorno:

```env
NEXT_PUBLIC_API_URL=https://tu-api.com/api
```

## Servicio de API (api.service.ts)

Servicio base para todas las peticiones HTTP con manejo automático de tokens.

### Uso básico:

```typescript
import { api } from '@/services/api.service';

// GET request
const users = await api.get('/users');

// POST request
const newUser = await api.post('/users', { name: 'Juan', email: 'juan@example.com' });

// PUT request
const updatedUser = await api.put('/users/1', { name: 'Juan Carlos' });

// DELETE request
await api.delete('/users/1');
```

## Servicio de Autenticación (auth.service.ts)

### Login

```typescript
import AuthService from '@/services/login/auth.service';

try {
  const response = await AuthService.login({
    userName: 'Yisus',
    password: 'miPassword123'
  });

  if (response.success) {
    console.log('Login exitoso:', response.data.user);
    // Los tokens y datos del usuario se guardan automáticamente
    
    // Verificar roles
    if (AuthService.isAdmin()) {
      console.log('Usuario es administrador');
    }
    
    if (AuthService.hasRole('Admin')) {
      console.log('Usuario tiene rol Admin');
    }
  }
} catch (error) {
  console.error('Error en login:', error);
}
```

### Logout

```typescript
// Logout (limpia tokens y redirige)
await AuthService.logout();
```

### Verificar autenticación

```typescript
// Verificar si está autenticado
if (AuthService.isAuthenticated()) {
  console.log('Usuario autenticado');
  
  // Obtener datos del usuario actual
  const user = AuthService.getCurrentUser();
  console.log('Usuario actual:', user);
}
```

### Validar sesión

```typescript
try {
  const response = await AuthService.validateSession();
  if (response.success) {
    console.log('Sesión válida:', response.data.user);
  }
} catch (error) {
  console.log('Sesión inválida, redirigir a login');
}
```

### Obtener tokens

```typescript
const accessToken = AuthService.getAccessToken();
const refreshToken = AuthService.getRefreshToken();
```

## Servicio de Registro (register.service.ts)

### Registro de usuario

```typescript
import RegisterService from '@/services/register/register.service';

const registerData = {
  name: 'Juan Carlos',
  userName: 'juanc',
  email: 'juan@example.com',
  password: 'MiPassword123',
  confirmPassword: 'MiPassword123'
};

try {
  const response = await RegisterService.register(registerData);
  
  if (response.success) {
    console.log('Registro exitoso:', response.data.user);
    // Ahora el usuario puede hacer login
  }
} catch (error) {
  console.error('Error en registro:', error);
}
```

### Validación de datos

```typescript
const validation = RegisterService.validateRegisterData(registerData);

if (!validation.isValid) {
  console.log('Errores de validación:', validation.errors);
  
  // Formatear errores para mostrar en formulario
  const formattedErrors = RegisterService.formatValidationErrors(validation.errors);
  console.log('Errores formateados:', formattedErrors);
  // Resultado: { email: 'Ingrese un email válido', password: 'Las contraseñas no coinciden' }
}
```

### Verificar disponibilidad

```typescript
// Verificar si username está disponible
const isUsernameAvailable = await RegisterService.checkUserNameAvailability('nuevo_usuario');
console.log('Username disponible:', isUsernameAvailable);

// Verificar si email está disponible
const isEmailAvailable = await RegisterService.checkEmailAvailability('nuevo@email.com');
console.log('Email disponible:', isEmailAvailable);
```

### Generar sugerencias de username

```typescript
const suggestions = RegisterService.generateUsernameSuggestions('Juan Carlos', 'juan@email.com');
console.log('Sugerencias:', suggestions);
// Resultado: ['juancarlos', 'juan', 'juancarlos123', 'juancarlos2024', 'juancarlos456']
```

## Tipos de Datos

### Usuario (después del login)

```typescript
interface User {
  id: string;                    // UUID
  name: string;                  // "Jesus"
  userName: string;              // "Yisus"
  email: string;                 // "yisus@gmail.com"
  emailConfirmed: boolean;       // true
  roles: string[];              // ["Admin"]
}
```

### Respuesta de Login

```typescript
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

## Manejo de Errores

Todos los servicios lanzan errores de tipo `ApiError` que incluyen:

```typescript
try {
  await AuthService.login(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
  }
}
```

## Interceptor Automático de Tokens

El servicio API maneja automáticamente:

- ✅ Agregar Authorization header a las peticiones
- ✅ Refrescar tokens expirados automáticamente
- ✅ Redirigir al login si el refresh falla
- ✅ Limpiar datos de sesión en caso de error

## Endpoints de la API

- `POST /auth/login` - Login de usuario
- `POST /auth/register` - Registro de usuario
- `POST /auth/logout` - Logout de usuario
- `POST /auth/refresh` - Refrescar token de acceso
- `GET /auth/me` - Obtener datos del usuario actual
- `GET /auth/check-username/{username}` - Verificar disponibilidad de username
- `GET /auth/check-email/{email}` - Verificar disponibilidad de email

## Uso en Componentes React

### Hook personalizado para autenticación

```typescript
import { useState, useEffect } from 'react';
import AuthService from '@/services/login/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const response = await AuthService.validateSession();
          if (response.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Session validation failed');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    const response = await AuthService.login(credentials);
    if (response.success) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: AuthService.isAuthenticated(),
    isAdmin: AuthService.isAdmin(),
    login,
    logout
  };
};
```

### Protección de rutas

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (adminOnly && !isAdmin) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, isAdmin, loading, router, adminOnly]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated || (adminOnly && !isAdmin)) {
    return null;
  }

  return children;
};
```
