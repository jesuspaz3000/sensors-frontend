'use client';

import { useState, useEffect, useCallback } from 'react';
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
    Chip,
    CircularProgress,
    Alert
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
import AdminUsersService from '@/services/adminUsers/adminUsers.service';
import type { 
    User, 
    UserData, 
    CreateUserFormData 
} from '@/types/adminUsers';

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 10,
    });
    const [totalUsers, setTotalUsers] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    // Cargar usuarios
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await AdminUsersService.listUsers({
                limit: paginationModel.pageSize,
                offset: paginationModel.page * paginationModel.pageSize
            });

            // El servicio devuelve directamente la estructura de paginación
            if (response && response.data && Array.isArray(response.data)) {
                // Mapear datos del API a la estructura esperada por la tabla
                const mappedUsers = response.data.map((user: User) => ({
                    id: user.id,
                    nombre: user.name,
                    usuario: user.userName,
                    email: user.email,
                    rol: user.roles.join(', '), // Convertir array de roles a string
                    emailConfirmed: user.emailConfirmed,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }));
                
                setUsers(mappedUsers);
                setTotalUsers(response.total);
            } else {
                setError('No se recibieron datos del servidor');
            }
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    }, [paginationModel.page, paginationModel.pageSize]);

    // Cargar usuarios al montar el componente o cambiar paginación
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleGoToHome = () => {
        window.location.href = '/home';
    };

    const handleCreateUser = () => {
        setCreateDialogOpen(true);
    };

    const handleEditUser = async (id: string) => {
        console.log('handleEditUser called with id:', id);
        try {
            setError(null);
            const userData = await AdminUsersService.getUserById(id);
            
            // Type guard para verificar si es un objeto User
            if (userData && typeof userData === 'object' && 'id' in userData && 'name' in userData) {
                console.log('User data received, opening edit dialog...');
                // Mapear los datos del API a la estructura esperada por el diálogo
                const mappedUserData: UserData = {
                    id: userData.id,
                    nombre: userData.name,
                    usuario: userData.userName,
                    email: userData.email,
                    rol: userData.roles.includes('Admin') ? 'Administrador' : 'Usuario'
                };
                
                setSelectedUser(mappedUserData);
                setEditDialogOpen(true);
            } else {
                console.log('No valid user data received from API');
            }
        } catch (error: unknown) {
            console.error('Error loading user:', error);
            
            let errorMessage = 'Error al cargar los datos del usuario.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                errorMessage = response?.data?.message || errorMessage;
            }
            
            setError(errorMessage);
        }
    };

    const handleDeleteUser = (id: string) => {
        const user = users.find(u => u.id === id);
        if (user) {
            setUserToDelete(user);
            setDeleteDialogOpen(true);
        }
    };

    const handleSaveNewUser = async (userData: CreateUserFormData) => {
        try {
            setError(null);
            setSuccessMessage(null);
            
            // Mapear los datos del formulario al formato esperado por el API
            const createUserPayload = {
                name: userData.nombre,
                userName: userData.usuario,
                email: userData.email,
                password: userData.password,
                roles: [userData.rol === 'Administrador' ? 'Admin' : 'User']
            };

            await AdminUsersService.createUser(createUserPayload);
            setCreateDialogOpen(false);
            
            // Mostrar mensaje de éxito
            setSuccessMessage(`Usuario "${userData.nombre}" creado exitosamente`);
            
            // Limpiar mensaje de éxito después de 5 segundos
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            
            // Recargar la lista después de crear
            loadUsers();
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            
            // Mostrar mensaje de error específico
            let errorMessage = 'Error al crear el usuario. Por favor, intenta nuevamente.';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                errorMessage = response?.data?.message || errorMessage;
            }
            
            setError(errorMessage);
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
    };

    const handleSaveEditUser = async (userData: UserData) => {
        try {
            setError(null);
            setSuccessMessage(null);
            
            // Mapear los datos del formulario al formato esperado por el API
            const updateUserPayload = {
                name: userData.nombre,
                userName: userData.usuario,
                email: userData.email,
                roles: [userData.rol === 'Administrador' ? 'Admin' : 'User']
            };

            await AdminUsersService.updateUser(userData.id, updateUserPayload);
            setEditDialogOpen(false);
            setSelectedUser(null);
            
            // Mostrar mensaje de éxito
            setSuccessMessage(`Usuario "${userData.nombre}" actualizado exitosamente`);
            
            // Limpiar mensaje de éxito después de 5 segundos
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
            
            // Recargar la lista después de editar
            loadUsers();
        } catch (error: unknown) {
            console.error('Error updating user:', error);
            
            let errorMessage = 'Error al actualizar el usuario. Por favor, intenta nuevamente.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'response' in error) {
                const response = (error as { response?: { data?: { message?: string } } }).response;
                errorMessage = response?.data?.message || errorMessage;
            }
            
            setError(errorMessage);
        }
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedUser(null);
    };

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            try {
                setError(null);
                setSuccessMessage(null);
                setDeleteLoading(true);
                
                console.log('Deleting user:', userToDelete.id);
                await AdminUsersService.deleteUser(userToDelete.id);
                
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                
                // Mostrar mensaje de éxito
                setSuccessMessage(`Usuario "${userToDelete.nombre}" eliminado exitosamente`);
                
                // Limpiar mensaje de éxito después de 5 segundos
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
                
                // Recargar la lista después de eliminar
                loadUsers();
            } catch (error: unknown) {
                console.error('Error deleting user:', error);
                
                let errorMessage = 'Error al eliminar el usuario. Por favor, intenta nuevamente.';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'object' && error !== null && 'response' in error) {
                    const response = (error as { response?: { data?: { message?: string } } }).response;
                    errorMessage = response?.data?.message || errorMessage;
                }
                
                setError(errorMessage);
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            } finally {
                setDeleteLoading(false);
            }
        }
    };

    const handleCancelDelete = () => {
        if (!deleteLoading) {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
        }
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

    // Si está cargando, mostrar loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-4 sm:py-6 lg:py-8 pt-16 sm:pt-20">
                <Container maxWidth="xl">
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '50vh',
                        gap: 3
                    }}>
                        <CircularProgress size={60} sx={{ color: '#4ade80' }} />
                        <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                            Cargando usuarios...
                        </Typography>
                    </Box>
                </Container>
            </div>
        );
    }

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
                        Gestiona los usuarios del sistema ({totalUsers} usuarios totales)
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

                {/* Mostrar error si existe */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 3,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            '& .MuiAlert-icon': {
                                color: '#ef4444'
                            }
                        }}
                        action={
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={loadUsers}
                                sx={{ 
                                    color: 'white',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    }
                                }}
                            >
                                Reintentar
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {/* Mostrar mensaje de éxito si existe */}
                {successMessage && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mb: 3,
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            '& .MuiAlert-icon': {
                                color: '#22c55e'
                            }
                        }}
                        onClose={() => setSuccessMessage(null)}
                    >
                        {successMessage}
                    </Alert>
                )}

                <UsersTable 
                    users={users}
                    columns={columns}
                    onEditUser={handleEditUser}
                    onDeleteUser={handleDeleteUser}
                    loading={false}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    rowCount={totalUsers}
                    pageSizeOptions={[5, 10, 25, 50]}
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
                onClose={deleteLoading ? () => {} : handleCancelDelete}
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
                        disabled={deleteLoading}
                        sx={{
                            color: 'white',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&:disabled': {
                                color: 'rgba(255, 255, 255, 0.5)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant="contained"
                        startIcon={deleteLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DeleteIcon />}
                        disabled={deleteLoading}
                        sx={{
                            backgroundColor: '#ef4444',
                            '&:hover': {
                                backgroundColor: '#dc2626',
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                            },
                        }}
                    >
                        {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}