'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    IconButton,
    Chip
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateUserDialog from './create';
import EditUserDialog from './edit';
import UsersTable, { getChipColor } from '@/components/table';

// Datos de ejemplo para los usuarios
const usersData = [
    {
        id: 1,
        nombre: 'Juan Pérez',
        usuario: 'juan.perez',
        email: 'juan.perez@email.com',
        rol: 'Administrador'
    },
    {
        id: 2,
        nombre: 'María García',
        usuario: 'maria.garcia',
        email: 'maria.garcia@email.com',
        rol: 'Usuario'
    },
    {
        id: 3,
        nombre: 'Carlos López',
        usuario: 'carlos.lopez',
        email: 'carlos.lopez@email.com',
        rol: 'Usuario'
    },
    {
        id: 4,
        nombre: 'Ana Martínez',
        usuario: 'ana.martinez',
        email: 'ana.martinez@email.com',
        rol: 'Usuario'
    },
    {
        id: 5,
        nombre: 'Luis Rodríguez',
        usuario: 'luis.rodriguez',
        email: 'luis.rodriguez@email.com',
        rol: 'Administrador'
    }
];

interface UserData {
    id: number;
    nombre: string;
    usuario: string;
    email: string;
    rol: string;
}

interface CreateUserData {
    nombre: string;
    usuario: string;
    email: string;
    password: string;
    rol: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState(usersData);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    const handleGoToHome = () => {
        // Aquí puedes usar Next.js router o window.location para navegar
        window.location.href = '/home';
    };

    const handleCreateUser = () => {
        setCreateDialogOpen(true);
    };

    const handleEditUser = (id: number) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setSelectedUser(user);
            setEditDialogOpen(true);
        }
    };

    const handleDeleteUser = (id: number) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setUserToDelete(user);
            setDeleteDialogOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleSaveNewUser = (userData: CreateUserData) => {
        const newUser: UserData = {
            id: Math.max(...users.map(u => u.id)) + 1,
            nombre: userData.nombre,
            usuario: userData.usuario,
            email: userData.email,
            rol: userData.rol
        };
        setUsers(prev => [...prev, newUser]);
        setCreateDialogOpen(false);
    };

    const handleSaveEditUser = (userData: UserData) => {
        setUsers(prev => prev.map(user =>
            user.id === userData.id ? userData : user
        ));
        setEditDialogOpen(false);
        setSelectedUser(null);
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedUser(null);
    };

    // Definición de columnas para la tabla
    const columns: GridColDef[] = [
        {
            field: 'nombre',
            headerName: 'Nombre',
            width: 200,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'usuario',
            headerName: 'Usuario',
            width: 180,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'email',
            headerName: 'Correo Electrónico',
            width: 250,
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'rol',
            headerName: 'Rol',
            width: 130,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value}
                    color={getChipColor(params.value)}
                    size="small"
                    variant="filled"
                />
            ),
        },
        {
            field: 'acciones',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            filterable: false,
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <IconButton
                        onClick={() => handleEditUser(params.row.id)}
                        size="small"
                    >
                        <EditIcon fontSize="small" sx={{ color: '#4ade80' }} />
                    </IconButton>
                    <IconButton
                        onClick={() => handleDeleteUser(params.row.id)}
                        size="small"
                    >
                        <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-4 sm:py-6 lg:py-8 pt-16 sm:pt-20">
            <Container maxWidth="xl">
                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' }, 
                        justifyContent: 'space-between', 
                        mb: 3,
                        gap: { xs: 2, sm: 0 }
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography
                                variant="h3"
                                sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                                }}
                            >
                                <PersonIcon sx={{ fontSize: { xs: 28, sm: 35, md: 40 }, color: '#4ade80' }} />
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                    Administración de Usuarios
                                </Box>
                                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                    Admin Usuarios
                                </Box>
                            </Typography>
                        </Box>
                        
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleGoToHome}
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
                                borderRadius: 2,
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                            }}
                        >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                Volver al Inicio
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                Inicio
                            </Box>
                        </Button>
                    </Box>
                    
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            mb: 3,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        Gestiona los usuarios del sistema
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateUser}
                        sx={{
                            backgroundColor: '#10b981',
                            '&:hover': {
                                backgroundColor: '#059669',
                            },
                            px: { xs: 2, sm: 3 },
                            py: 1.5,
                            borderRadius: 2,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                            Crear Usuario
                        </Box>
                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                            Crear
                        </Box>
                    </Button>
                </Box>

                <UsersTable 
                    users={users}
                    columns={columns}
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                />
            </Container>

            {/* Diálogos */}
            <CreateUserDialog
                open={createDialogOpen}
                onClose={handleCloseCreateDialog}
                onSave={handleSaveNewUser}
            />

            <EditUserDialog
                open={editDialogOpen}
                onClose={handleCloseEditDialog}
                onSave={handleSaveEditUser}
                userData={selectedUser}
            />

            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                        }
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        color: 'white',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        pb: 2
                    }}
                >
                    <WarningIcon sx={{ color: '#ef4444', fontSize: 30 }} />
                    <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                        Confirmar Eliminación
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ pt: 3 }}>
                    <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                        ¿Estás seguro de que deseas eliminar al usuario{' '}
                        <Typography component="span" sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                            {userToDelete?.nombre}
                        </Typography>
                        ?
                    </DialogContentText>
                    <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', mt: 2 }}>
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Button
                        onClick={handleCancelDelete}
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
                        onClick={handleConfirmDelete}
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{
                            backgroundColor: '#ef4444',
                            '&:hover': {
                                backgroundColor: '#dc2626',
                            },
                        }}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}