'use client';

import Navbar from '@/components/navbar';
import RevalidationConfigPanel from '@/components/RevalidationConfigPanel';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Box, Typography, Container, Alert, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { ProfileService, UpdateProfileData } from '../../services/profile/profile.service';
import { AuthService } from '../../services/login/auth.service';
import { debugApiConfig } from '../../services/api.service';

export default function Profile() {
    const [formData, setFormData] = useState({
        name: '',
        userName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const router = useRouter();

    // Cargar datos del usuario al montar el componente
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoadingData(true);
            
            // Obtener datos del usuario desde localStorage (inmediato)
            const response = await ProfileService.getProfile();
            if (response.success && response.data) {
                setFormData(prev => ({
                    ...prev,
                    name: response.data?.name || '',
                    userName: response.data?.userName || '',
                    email: response.data?.email || ''
                }));
            } else {
                // Si no hay datos en localStorage, intentar desde la API
                try {
                    const apiResponse = await ProfileService.getProfileFromAPI();
                    if (apiResponse.success && apiResponse.data) {
                        setFormData(prev => ({
                            ...prev,
                            name: apiResponse.data?.name || '',
                            userName: apiResponse.data?.userName || '',
                            email: apiResponse.data?.email || ''
                        }));
                    }
                } catch (apiError) {
                    console.error('Error loading from API:', apiError);
                    setError('Error al cargar los datos del usuario');
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setError('Error al cargar los datos del usuario');
        } finally {
            setLoadingData(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpiar errores cuando el usuario empiece a escribir
        if (error) setError('');
        if (success) setSuccess('');
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Debug de configuración y autenticación
        await debugApiConfig();
        
        setLoading(true);
        setError('');
        setSuccess('');
        setFieldErrors({});

        try {
            // Preparar datos para enviar
            const updateData: UpdateProfileData = {
                name: formData.name,
                userName: formData.userName,
                email: formData.email,
                currentPassword: formData.currentPassword // Siempre incluir contraseña actual
            };

            // Determinar si se está intentando cambiar la contraseña
            const isChangingPassword = ProfileService.isPasswordChangeAttempt({
                name: formData.name,
                userName: formData.userName,
                email: formData.email,
                newPassword: formData.newPassword,
                confirmNewPassword: formData.confirmNewPassword
            });

            // Solo incluir campos de nueva contraseña si realmente se está cambiando
            if (isChangingPassword) {
                updateData.newPassword = formData.newPassword;
                updateData.confirmNewPassword = formData.confirmNewPassword;
                console.log('Actualizando perfil con cambio de contraseña');
            } else {
                console.log('Actualizando perfil sin cambio de contraseña');
            }

            const response = await ProfileService.updateProfile(updateData);

            if (response.success) {
                setSuccess('¡Perfil actualizado exitosamente!');
                
                // Actualizar datos del usuario en localStorage si se actualizó
                if (response.data?.user) {
                    AuthService.saveUser(response.data.user);
                }
                
                // Limpiar campos de contraseña
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: ''
                }));

                // Opcional: Limpiar mensaje de éxito después de un tiempo
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                setError(response.message || 'Error al actualizar el perfil');
            }
        } catch (error: unknown) {
            console.error('Profile update error:', error);
            
            // Manejo mejorado de errores
            if (error && typeof error === 'object') {
                // Error de autenticación
                if ('status' in error && error.status === 401) {
                    setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
                    // Opcional: redirigir al login después de un momento
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                    return;
                }
                
                // Error de la API con datos estructurados
                if ('data' in error) {
                    const apiError = error as { data?: { errors?: Record<string, string[]>; message?: string }; status?: number; message?: string };
                    if (apiError.data?.errors) {
                        // Errores de validación del servidor
                        const serverErrors = apiError.data.errors;
                        const newFieldErrors: Record<string, string> = {};
                        Object.entries(serverErrors).forEach(([field, messages]) => {
                            newFieldErrors[field.toLowerCase()] = messages[0];
                        });
                        setFieldErrors(newFieldErrors);
                        setError('Por favor, corrige los errores en el formulario');
                    } else if (apiError.data?.message) {
                        setError(apiError.data.message);
                    } else if (apiError.message) {
                        setError(apiError.message);
                    } else {
                        setError('Error al actualizar el perfil');
                    }
                }
                // Error con response (formato axios/fetch)
                else if ('response' in error) {
                    const responseError = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                    if (responseError?.response?.data?.errors) {
                        const serverErrors = responseError.response.data.errors;
                        const newFieldErrors: Record<string, string> = {};
                        Object.entries(serverErrors).forEach(([field, messages]) => {
                            newFieldErrors[field.toLowerCase()] = messages[0];
                        });
                        setFieldErrors(newFieldErrors);
                        setError('Por favor, corrige los errores en el formulario');
                    } else if (responseError?.response?.data?.message) {
                        setError(responseError.response.data.message);
                    } else {
                        setError('Error al actualizar el perfil');
                    }
                }
                // Error instance
                else if (error instanceof Error) {
                    setError(error.message);
                }
                else {
                    setError('Error al actualizar el perfil');
                }
            } else {
                setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/home');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <Navbar />
            <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-20">
                <Container maxWidth="md">
                    <Box
                        sx={{
                            width: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            padding: { xs: '16px', sm: '24px', md: '32px' },
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        <Box className="text-center mb-6 sm:mb-8">
                            <Typography 
                                variant="h3" 
                                sx={{ 
                                    fontWeight: 'bold', 
                                    color: 'white',
                                    fontSize: { xs: '1.875rem', sm: '2.5rem', md: '3rem' }
                                }}
                            >
                                Editar Perfil
                            </Typography>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: 'white',
                                    fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}
                            >
                                Actualiza tu información personal
                            </Typography>
                        </Box>

                        {/* Mostrar loading mientras se cargan los datos */}
                        {loadingData && (
                            <Box className="flex justify-center mb-6">
                                <CircularProgress sx={{ color: '#4ade80' }} />
                            </Box>
                        )}

                        {/* Mensajes de éxito y error */}
                        {success && (
                            <Alert severity="success" sx={{ mb: 3, backgroundColor: 'rgba(76, 175, 80, 0.1)', color: 'white' }}>
                                {success}
                            </Alert>
                        )}
                        
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)', color: 'white' }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off" sx={{ spaceY: { xs: 4, sm: 6 } }}>
                            {/* Información Personal */}
                            <Box className="space-y-4">
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        color: 'white', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        marginBottom: 2,
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                    }}
                                >
                                    <PersonIcon className="text-green-400" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                    Información Personal
                                </Typography>
                                
                                <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label="Nombre Completo"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="name"
                                        error={!!fieldErrors.name}
                                        helperText={fieldErrors.name}
                                        disabled={loading || loadingData}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#4ade80',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                '&.Mui-focused': {
                                                    color: '#4ade80',
                                                },
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                color: 'white',
                                            },
                                        }}
                                    />
                                    
                                    <TextField
                                        fullWidth
                                        name="userName"
                                        label="Nombre de Usuario"
                                        value={formData.userName}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="username"
                                        error={!!fieldErrors.userName}
                                        helperText={fieldErrors.userName}
                                        disabled={loading || loadingData}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#4ade80',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                '&.Mui-focused': {
                                                    color: '#4ade80',
                                                },
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                color: 'white',
                                            },
                                        }}
                                    />
                                </Box>

                                <TextField
                                    fullWidth
                                    name="email"
                                    label="Correo Electrónico"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    autoComplete="email"
                                    error={!!fieldErrors.email}
                                    helperText={fieldErrors.email}
                                    disabled={loading || loadingData}
                                    slotProps={{
                                        input: {
                                            startAdornment: <EmailIcon className="text-gray-400 mr-2" />,
                                        },
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4ade80',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#4ade80',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input': {
                                            color: 'white',
                                        },
                                    }}
                                />
                            </Box>

                            {/* Cambio de Contraseña */}
                            <Box
                                sx={{
                                    spaceY: 4,
                                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                                    pt: { xs: 4, sm: 6 },
                                    mt: { xs: 4, sm: 6 }
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        color: 'white', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        marginBottom: 2,
                                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                    }}
                                >
                                    <LockIcon
                                        sx={{
                                            color: '#4ade80',
                                            fontSize: { xs: 20, sm: 24 },
                                        }}
                                    />
                                    Cambiar Contraseña
                                </Typography>

                                {/* Indicador de comportamiento */}
                                <Alert 
                                    severity="info" 
                                    sx={{ 
                                        marginBottom: 2,
                                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        '& .MuiAlert-icon': {
                                            color: '#4ade80'
                                        }
                                    }}
                                >
                                    <Typography variant="body2">
                                        <strong>Contraseña actual:</strong> Siempre requerida para actualizar el perfil.<br/>
                                        <strong>Nueva contraseña:</strong> Solo completa estos campos si deseas cambiar tu contraseña. 
                                        Debe contener al menos 6 caracteres, letras y números.
                                    </Typography>
                                </Alert>
                                
                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    label="Contraseña Actual"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    autoComplete="current-password"
                                    error={!!fieldErrors.currentPassword}
                                    helperText={fieldErrors.currentPassword}
                                    disabled={loading || loadingData}
                                    sx={{
                                        marginBottom: 2,
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            '& fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                            },
                                            '&:hover fieldset': {
                                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4ade80',
                                            },
                                        },
                                        '& .MuiInputLabel-root': {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            '&.Mui-focused': {
                                                color: '#4ade80',
                                            },
                                        },
                                        '& .MuiOutlinedInput-input': {
                                            color: 'white',
                                        },
                                    }}
                                />

                                <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextField
                                        fullWidth
                                        name="newPassword"
                                        label="Nueva Contraseña"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="new-password"
                                        error={!!fieldErrors.newPassword}
                                        helperText={fieldErrors.newPassword}
                                        disabled={loading || loadingData}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#4ade80',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                '&.Mui-focused': {
                                                    color: '#4ade80',
                                                },
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                color: 'white',
                                            },
                                        }}
                                    />
                                    
                                    <TextField
                                        fullWidth
                                        name="confirmNewPassword"
                                        label="Confirmar Contraseña"
                                        type="password"
                                        value={formData.confirmNewPassword}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="new-password"
                                        error={!!fieldErrors.confirmNewPassword}
                                        helperText={fieldErrors.confirmNewPassword}
                                        disabled={loading || loadingData}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                '& fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#4ade80',
                                                },
                                            },
                                            '& .MuiInputLabel-root': {
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                '&.Mui-focused': {
                                                    color: '#4ade80',
                                                },
                                            },
                                            '& .MuiOutlinedInput-input': {
                                                color: 'white',
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Botones de Acción */}
                            <Box className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6">
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancel}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                        px: { xs: 2, sm: 3 },
                                        py: 1.5,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
                                    disabled={loading || loadingData}
                                    sx={{
                                        backgroundColor: '#10b981',
                                        '&:hover': {
                                            backgroundColor: '#059669',
                                        },
                                        '&:disabled': {
                                            backgroundColor: 'rgba(16, 185, 129, 0.5)',
                                        },
                                        px: { xs: 2, sm: 3 },
                                        py: 1.5,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </div>
            {/* Panel de configuración de revalidación (solo en development) */}
            {process.env.NODE_ENV === 'development' && <RevalidationConfigPanel />}
        </div>
    );
}