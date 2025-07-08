'use client';

import {
    Box,
    IconButton,
    Chip,
    Card,
    CardContent,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';

interface UserData {
    id: string;
    nombre: string;
    usuario: string;
    email: string;
    rol: string;
    emailConfirmed?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface UsersTableProps {
    users: UserData[];
    columns: GridColDef[];
    onEditUser?: (id: string) => void;
    onDeleteUser?: (id: string) => void;
    loading?: boolean;
    paginationModel?: {
        page: number;
        pageSize: number;
    };
    onPaginationModelChange?: (model: { page: number; pageSize: number }) => void;
    rowCount?: number;
    pageSizeOptions?: number[];
}

// Función para obtener el color del chip según el rol (exportada para uso externo)
export const getChipColor = (role: string) => {
    switch (role) {
        case 'Administrador':
        case 'Admin':
            return 'error';
        case 'Usuario':
        case 'User':
            return 'primary';
        default:
            return 'default';
    }
};

export default function UsersTable({ 
    users, 
    columns, 
    onEditUser, 
    onDeleteUser, 
    loading = false,
    paginationModel,
    onPaginationModelChange,
    rowCount,
    pageSizeOptions = [5, 10, 25]
}: UsersTableProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Componente de tarjeta para vista móvil
    const UserCard = ({ user }: { user: UserData }) => {
        return (
            <Card
                sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    mb: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                    },
                    transition: 'all 0.3s ease',
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountCircleIcon sx={{ color: '#4ade80', fontSize: 24 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                                {user.nombre}
                            </Typography>
                        </Box>
                        <Chip
                            label={user.rol}
                            color={getChipColor(user.rol)}
                            size="small"
                            variant="filled"
                        />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                Usuario: {user.usuario}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {user.email}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {onEditUser && (
                            <IconButton
                                onClick={() => onEditUser(user.id)}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                    border: '1px solid rgba(74, 222, 128, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                    },
                                }}
                            >
                                <EditIcon fontSize="small" sx={{ color: '#4ade80' }} />
                            </IconButton>
                        )}
                        {onDeleteUser && (
                            <IconButton
                                onClick={() => onDeleteUser(user.id)}
                                size="small"
                                sx={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                    },
                                }}
                            >
                                <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                            </IconButton>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <>
            {/* Vista de tarjetas para móvil */}
            {isMobile ? (
                <Box sx={{ px: { xs: 0, sm: 2 } }}>
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} />
                    ))}
                </Box>
            ) : (
                /* Vista de tabla para desktop */
                <Box sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}>
                    <DataGrid
                        rows={users}
                        columns={columns}
                        loading={loading}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={onPaginationModelChange}
                        rowCount={rowCount}
                        pageSizeOptions={pageSizeOptions}
                        disableRowSelectionOnClick
                        sx={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            '& .MuiDataGrid-main': {
                                backgroundColor: 'transparent',
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                fontSize: '0.95rem',
                                backgroundColor: 'transparent',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                                '& .MuiDataGrid-columnHeader': {
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    backgroundColor: 'transparent',
                                },
                            },
                            '& .MuiDataGrid-row': {
                                backgroundColor: 'transparent',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                },
                            },
                            '& .MuiDataGrid-footerContainer': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                '& .MuiTablePagination-root': {
                                    color: 'white',
                                },
                                '& .MuiTablePagination-selectIcon': {
                                    color: 'white',
                                },
                                '& .MuiIconButton-root': {
                                    color: 'white',
                                },
                            },
                            '& .MuiDataGrid-selectedRowCount': {
                                color: 'white',
                            },
                            '& .MuiDataGrid-virtualScroller': {
                                backgroundColor: 'transparent',
                            },
                            '& .MuiDataGrid-overlay': {
                                backgroundColor: 'transparent',
                            },
                            minHeight: 400,
                        }}
                    />
                </Box>
            )}
        </>
    );
}
