'use client';

import Link from "next/link";
import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Tooltip,
    Button
} from "@mui/material";
import { Logout, Person, Dashboard, Menu as MenuIcon } from "@mui/icons-material";

// Componente de enlace personalizado para móvil
const MobileLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) => (
    <Link
        href={href}
        onClick={onClick}
        className="text-white font-semibold py-2 block transition-colors duration-300 hover:text-blue-200"
    >
        {children}
    </Link>
);

export default function Navbar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const open = Boolean(anchorEl);
    const router = useRouter();

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        handleClose();
        router.push("/profile");
    };

    const handleAdminUsersClick = () => {
        handleClose();
        router.push("/adminUsers");
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="w-full h-16 px-4 md:px-16 py-6 fixed z-50 backdrop-blur-lg bg-black/20 shadow-xl border-b border-white/40">
            <div className="flex justify-between items-center w-full h-full">
                <h1 className="text-white text-xl md:text-2xl font-bold hover:cursor-pointer drop-shadow-xl text-shadow-lg">Aire Limpio</h1>

                {/* Menú de escritorio */}
                <div className="hidden lg:flex gap-16 text-white font-semibold">
                    <Link href="/home" className="hover:underline hover:text-blue-200 transition-colors drop-shadow-xl text-shadow-md">Inicio</Link>
                    <Link href="/airQuality" className="hover:underline hover:text-blue-200 transition-colors drop-shadow-xl text-shadow-md">Datos de calidad del aire</Link>
                    <Link href="/resources" className="hover:underline hover:text-blue-200 transition-colors drop-shadow-xl text-shadow-md">Recursos y apoyo</Link>
                </div>

                {/* Lado derecho - Botón hamburguesa para móvil O Avatar para escritorio */}
                <div className="flex items-center">
                    {/* Botón hamburguesa para móvil */}
                    <Button
                        onClick={toggleMobileMenu}
                        sx={{
                            display: { xs: 'flex', lg: 'none' },
                            minWidth: 'auto',
                            p: 1,
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                        }}
                    >
                        <MenuIcon />
                    </Button>

                    {/* Avatar del usuario - visible en escritorio */}
                    <Tooltip title="Configuración de cuenta" placement="bottom">
                        <Button
                            onClick={handleClick}
                            variant="outlined"
                            aria-controls={open ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                            sx={{
                                display: { xs: 'none', lg: 'flex' },
                                alignItems: 'center',
                                gap: 1.5,
                                px: 3,
                                py: 0.8,
                                border: '2px solid rgba(255, 255, 255, 0.6)',
                                borderRadius: '50px',
                                color: 'white',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    borderColor: 'rgba(255, 255, 255, 0.8)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': {
                                    transform: 'translateY(0px)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                },
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '16px',
                                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                                transition: 'all 0.2s ease-in-out',
                            }}
                        >
                            <span style={{
                                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                                fontWeight: 600,
                            }}>Admin</span>
                            <Avatar
                                src="/images/perfil.jpeg"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: 'rgba(30, 64, 175, 0.9)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    border: '2px solid rgba(255, 255, 255, 0.8)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                            />
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Overlay para cerrar menú móvil */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Menú móvil desplegable */}
            {mobileMenuOpen && (
                <div className="lg:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-white/20 py-4 z-40">
                    <div className="flex flex-col space-y-4 px-4">
                        <MobileLink href="/home" onClick={closeMobileMenu}>
                            Inicio
                        </MobileLink>
                        <MobileLink href="/airQuality" onClick={closeMobileMenu}>
                            Datos de calidad del aire
                        </MobileLink>
                        <MobileLink href="/resources" onClick={closeMobileMenu}>
                            Recursos y apoyo
                        </MobileLink>

                        {/* Avatar móvil */}
                        <div className="pt-4 border-t border-white/20">
                            <Button
                                onClick={handleClick}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 2,
                                    py: 1,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: 2,
                                    color: 'white',
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                <Avatar
                                    src="/images/perfil.jpeg"
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'rgba(30, 64, 175, 0.9)',
                                    }}
                                />
                                <span>Admin</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Menú de cuenta - Se muestra tanto en móvil como en escritorio */}
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                disableScrollLock={true}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1,
                            minWidth: 250,
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            color: 'white',
                            transition: 'all 0.2s ease-in-out',
                            '& .MuiMenuItem-root': {
                                color: 'white',
                                transition: 'background-color 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            },
                            '& .MuiListItemIcon-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .MuiDivider-root': {
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'rgba(15, 23, 42, 0.9)',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderBottom: 'none',
                                borderRight: 'none',
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleAdminUsersClick}>
                    <ListItemIcon>
                        <Dashboard fontSize="small" />
                    </ListItemIcon>
                    Administrar Usuarios
                </MenuItem>
                <MenuItem onClick={handleProfileClick}>
                    <ListItemIcon>
                        <Person fontSize="small" />
                    </ListItemIcon>
                    Mi perfil
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Cerrar sesión
                </MenuItem>
            </Menu>
        </div>
    );
}