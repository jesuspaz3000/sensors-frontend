'use client';

import Image from "next/image";
import Link from "next/link";
import { TextField, Button, Checkbox, FormGroup, FormControlLabel, Alert, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthService } from "../../services/login/auth.service";

export default function Login() {
  const router = useRouter();
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    userName: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      // Si ya está autenticado, redirigir al home
      router.push('/home');
    }
  }, [router]);

  // Manejadores de cambio de inputs
  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleRememberMeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  };

  // Manejo del envío del formulario
  const handleLogin = async () => {
    // Validación básica
    if (!formData.userName.trim() || !formData.password.trim()) {
      setError('Por favor, ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await AuthService.login({
        userName: formData.userName.trim(),
        password: formData.password
      });

      if (response.success && response.data) {
        // Login exitoso - redirigir al home para todos los usuarios
        router.push('/home');
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        if (apiError?.response?.data?.message) {
          setError(apiError.response.data.message);
        } else {
          setError('Error al iniciar sesión');
        }
      } else if (error instanceof Error) {
        setError(error.message);
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
      handleLogin();
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
        <div className="w-full max-w-[450px] sm:w-[450px] h-auto min-h-[450px] flex flex-col gap-4 items-center justify-center rounded-xl backdrop-blur-lg bg-gradient-to-br from-slate-900/35 to-blue-900/55 px-6 sm:px-16 py-8 sm:py-12 shadow-2xl shadow-black/50 mx-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-white">Login</h1>
          
          {/* Mostrar error si existe */}
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form autoComplete="off" className="flex flex-col gap-4 w-full" onKeyPress={handleKeyPress}>
            {/* Campos señuelo ocultos para confundir al autocompletado */}
            <input type="text" style={{display: 'none'}} autoComplete="false" />
            <input type="password" style={{display: 'none'}} autoComplete="false" />
            
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        disabled={loading}
                        sx={{
                          color: 'white',
                          '&.Mui-checked': { color: 'white' },
                          '&.Mui-checked:hover': { color: 'white' }
                        }}
                      />
                    }
                    label="Recordarme"
                    sx={{
                      color: 'white',
                      '& .MuiFormControlLabel-label': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }}
                  />
                </FormGroup>
              </div>
              <Link href="/" className="text-white hover:underline text-sm sm:text-base">Olvidaste tu contraseña?</Link>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              variant="contained"
              sx={{
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
                'Iniciar Sesión'
              )}
            </Button>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
              <p className="text-white text-sm sm:text-base">¿No tienes una cuenta?</p>
              <Link href="/register" className="text-white hover:underline text-sm sm:text-base">Regístrate</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}