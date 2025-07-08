'use client';

import Image from "next/image";
import Link from "next/link";
import { TextField, Button, Alert, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterService, RegisterData } from "../../services/register/register.service";
import { AuthService } from "../../services/login/auth.service";

export default function Register() {
  const router = useRouter();
  
  // Estados del formulario
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      // Si ya está autenticado, redirigir al home
      router.push('/home');
    }
  }, [router]);

  // Manejadores de cambio de inputs
  const handleInputChange = (field: keyof RegisterData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Manejo del envío del formulario
  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar datos localmente primero
      const validation = RegisterService.validateRegisterData(formData);
      if (!validation.isValid) {
        setError(validation.errors[0].message);
        setLoading(false);
        return;
      }

      // Intentar registrar
      const response = await RegisterService.register(formData);

      console.log('Register response:', response);

      if (response.success) {
        setSuccess('¡Registro exitoso! Redirigiendo al login...');
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(response.message || 'Error al registrar usuario');
      }
    } catch (error: unknown) {
      console.error('Register error:', error);
      
      // Manejo mejorado de errores
      if (error && typeof error === 'object') {
        // Error de la API con datos estructurados
        if ('data' in error) {
          const apiError = error as { data?: { errors?: Record<string, string[]>; message?: string }; status?: number; message?: string };
          if (apiError.data?.errors) {
            // Errores de validación del servidor
            const serverErrors = apiError.data.errors;
            const errorMessages = Object.values(serverErrors).flat().join(', ');
            setError(`Error de validación: ${errorMessages}`);
          } else if (apiError.data?.message) {
            setError(apiError.data.message);
          } else if (apiError.message) {
            setError(apiError.message);
          } else {
            setError('Error al registrar usuario');
          }
        }
        // Error con response (formato axios/fetch)
        else if ('response' in error) {
          const responseError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
          if (responseError?.response?.data?.errors) {
            const serverErrors = responseError.response.data.errors;
            const errorMessages = Object.values(serverErrors).flat().join(', ');
            setError(`Error de validación: ${errorMessages}`);
          } else if (responseError?.response?.data?.message) {
            setError(responseError.response.data.message);
          } else {
            setError('Error al registrar usuario');
          }
        }
        // Error instance
        else if (error instanceof Error) {
          setError(error.message);
        }
        else {
          setError('Error al registrar usuario');
        }
      } else {
        setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Enter en el formulario
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !loading) {
      handleRegister();
    }
  };
  return (
    <div className="overflow-hidden h-screen relative">
      <div className="w-full h-full absolute z-0">
        <Image
          src="/images/fondo-login.webp"
          width={1920}
          height={1080}
          alt="fondo-login"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full h-full absolute z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[450px] sm:w-[450px] h-auto min-h-[600px] flex flex-col gap-4 items-center justify-center rounded-xl backdrop-blur-lg bg-gradient-to-br from-slate-900/35 to-blue-900/55 px-6 sm:px-16 py-8 sm:py-12 shadow-2xl shadow-black/50 mx-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-white">Registro</h1>
          
          {/* Mostrar mensajes de error o éxito */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <form autoComplete="off" className="flex flex-col gap-4 w-full" onKeyPress={handleKeyPress}>
            {/* Campos señuelo ocultos para confundir al autocompletado */}
            <input type="text" style={{display: 'none'}} autoComplete="false" />
            <input type="password" style={{display: 'none'}} autoComplete="false" />
            
            <TextField
              variant="standard"
              type="text"
              label="Nombre"
              autoComplete="new-password"
              fullWidth
              value={formData.name}
              onChange={handleInputChange('name')}
              disabled={loading}
              sx={{
                '& .MuiInput-root': {
                  color: 'white',
                  '&:before': {
                    borderBottom: '1px solid rgba(255,255,255,0.7)',
                  },
                  '&:hover:not(.Mui-disabled):not(.Mui-focused):before': {
                    borderBottom: '2px solid white',
                  },
                  '&:after': {
                    borderBottom: '2px solid white',
                    transform: 'scaleX(1)',
                    transition: 'border-bottom-color 0.2s ease-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
                input: {
                  color: 'white',
                },
              }}
            />
            <TextField
              variant="standard"
              type="text"
              label="Usuario"
              autoComplete="new-password"
              fullWidth
              value={formData.userName}
              onChange={handleInputChange('userName')}
              disabled={loading}
              sx={{
                '& .MuiInput-root': {
                  color: 'white',
                  '&:before': {
                    borderBottom: '1px solid rgba(255,255,255,0.7)',
                  },
                  '&:hover:not(.Mui-disabled):not(.Mui-focused):before': {
                    borderBottom: '2px solid white',
                  },
                  '&:after': {
                    borderBottom: '2px solid white',
                    transform: 'scaleX(1)',
                    transition: 'border-bottom-color 0.2s ease-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
                input: {
                  color: 'white',
                },
              }}
            />
            <TextField
              variant="standard"
              type="password"
              label="Contraseña"
              autoComplete="new-password"
              fullWidth
              value={formData.password}
              onChange={handleInputChange('password')}
              disabled={loading}
              sx={{
                '& .MuiInput-root': {
                  color: 'white',
                  '&:before': {
                    borderBottom: '1px solid rgba(255,255,255,0.7)',
                  },
                  '&:hover:not(.Mui-disabled):not(.Mui-focused):before': {
                    borderBottom: '2px solid white',
                  },
                  '&:after': {
                    borderBottom: '2px solid white',
                    transform: 'scaleX(1)',
                    transition: 'border-bottom-color 0.2s ease-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
                input: {
                  color: 'white',
                },
              }}
            />
            <TextField 
              variant="standard"
              type="password"
              label="Confirmar Contraseña"
              autoComplete="new-password"
              fullWidth
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              disabled={loading}
              sx={{
                '& .MuiInput-root': {
                  color: 'white',
                  '&:before': {
                    borderBottom: '1px solid rgba(255,255,255,0.7)',
                  },
                  '&:hover:not(.Mui-disabled):not(.Mui-focused):before': {
                    borderBottom: '2px solid white',
                  },
                  '&:after': {
                    borderBottom: '2px solid white',
                    transform: 'scaleX(1)',
                    transition: 'border-bottom-color 0.2s ease-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
                input: {
                  color: 'white',
                },
              }}
            />
            <TextField 
              variant="standard"
              type="text"
              label="Correo Electrónico"
              autoComplete="new-password"
              fullWidth
              value={formData.email}
              onChange={handleInputChange('email')}
              disabled={loading}
              sx={{
                '& .MuiInput-root': {
                  color: 'white',
                  '&:before': {
                    borderBottom: '1px solid rgba(255,255,255,0.7)',
                  },
                  '&:hover:not(.Mui-disabled):not(.Mui-focused):before': {
                    borderBottom: '2px solid white',
                  },
                  '&:after': {
                    borderBottom: '2px solid white',
                    transform: 'scaleX(1)',
                    transition: 'border-bottom-color 0.2s ease-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
                input: {
                  color: 'white',
                },
              }}
            />
            <Button
              onClick={handleRegister}
              disabled={loading}
              variant="contained"
              sx={{
                marginTop: '16px',
                backgroundColor: 'white',
                color: 'black',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: '500',
                '&:hover': {
                  backgroundColor: 'white',
                  color: 'black',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  color: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'black' }} />
              ) : (
                'Registrarse'
              )}
            </Button>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
              <p className="text-white text-sm sm:text-base">¿Ya tienes una cuenta?</p>
              <Link href="/login" className="text-white hover:underline text-sm sm:text-base">Iniciar Sesión</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}