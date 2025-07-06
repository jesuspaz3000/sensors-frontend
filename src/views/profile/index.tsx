'use client';

import Navbar from '@/components/navbar';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, Button, Box, Typography, Container } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

export default function Profile() {
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const router = useRouter();

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Aquí iría la lógica para guardar los cambios
        console.log('Datos a guardar:', formData);
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
                                        name="nombre"
                                        label="Nombre Completo"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="off"
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
                                        name="usuario"
                                        label="Nombre de Usuario"
                                        value={formData.usuario}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="off"
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
                                    autoComplete="off"
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
                                
                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    label="Contraseña Actual"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    autoComplete="new-password"
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
                                        name="confirmPassword"
                                        label="Confirmar Contraseña"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        variant="outlined"
                                        autoComplete="new-password"
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
                                    startIcon={<SaveIcon />}
                                    sx={{
                                        backgroundColor: '#10b981',
                                        '&:hover': {
                                            backgroundColor: '#059669',
                                        },
                                        px: { xs: 2, sm: 3 },
                                        py: 1.5,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        width: { xs: '100%', sm: 'auto' }
                                    }}
                                >
                                    Guardar Cambios
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </div>
        </div>
    );
}