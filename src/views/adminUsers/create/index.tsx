'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface CreateUserDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (userData: UserData) => void;
}

interface UserData {
    nombre: string;
    usuario: string;
    email: string;
    password: string;
    rol: string;
}

export default function CreateUserDialog({ open, onClose, onSave }: CreateUserDialogProps) {
    const [formData, setFormData] = useState<UserData>({
        nombre: '',
        usuario: '',
        email: '',
        password: '',
        rol: 'Usuario'
    });

    const [errors, setErrors] = useState<Partial<UserData>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Limpiar error del campo cuando el usuario escriba
        if (errors[name as keyof UserData]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleRoleChange = (event: SelectChangeEvent) => {
        setFormData(prev => ({
            ...prev,
            rol: event.target.value
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<UserData> = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        if (!formData.usuario.trim()) {
            newErrors.usuario = 'El usuario es requerido';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'El correo es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'El correo no es válido';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            nombre: '',
            usuario: '',
            email: '',
            password: '',
            rol: 'Usuario'
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                }
            }}
        >
            <DialogTitle
                sx={{
                    color: 'white',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonAddIcon sx={{ color: '#4ade80' }} />
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                        Crear Usuario
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        fullWidth
                        name="nombre"
                        label="Nombre Completo"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        error={!!errors.nombre}
                        helperText={errors.nombre}
                        autoComplete="off"
                        sx={{
                            marginTop: 2,
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
                            '& .MuiFormHelperText-root': {
                                color: '#ef4444',
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        name="usuario"
                        label="Nombre de Usuario"
                        value={formData.usuario}
                        onChange={handleInputChange}
                        error={!!errors.usuario}
                        helperText={errors.usuario}
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
                            '& .MuiFormHelperText-root': {
                                color: '#ef4444',
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        name="email"
                        label="Correo Electrónico"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
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
                            '& .MuiFormHelperText-root': {
                                color: '#ef4444',
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        name="password"
                        label="Contraseña"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        error={!!errors.password}
                        helperText={errors.password}
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
                            '& .MuiFormHelperText-root': {
                                color: '#ef4444',
                            },
                        }}
                    />

                    <FormControl fullWidth>
                        <InputLabel 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&.Mui-focused': {
                                    color: '#4ade80',
                                },
                            }}
                        >
                            Rol
                        </InputLabel>
                        <Select
                            value={formData.rol}
                            onChange={handleRoleChange}
                            label="Rol"
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#4ade80',
                                },
                                '& .MuiSelect-icon': {
                                    color: 'white',
                                },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }
                                }
                            }}
                        >
                            <MenuItem value="Usuario" sx={{ color: 'white' }}>Usuario</MenuItem>
                            <MenuItem value="Administrador" sx={{ color: 'white' }}>Administrador</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                        backgroundColor: '#10b981',
                        '&:hover': {
                            backgroundColor: '#059669',
                        },
                    }}
                >
                    Crear Usuario
                </Button>
            </DialogActions>
        </Dialog>
    );
}
