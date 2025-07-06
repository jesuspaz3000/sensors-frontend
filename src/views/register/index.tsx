'use client';

import Image from "next/image";
import Link from "next/link";
import { TextField, Button } from "@mui/material";

export default function Register() {
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
          <form action="" autoComplete="off" className="flex flex-col gap-4 w-full">
            <TextField
              variant="standard"
              type="text"
              label="Nombre"
              autoComplete="username"
              fullWidth
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
              autoComplete="username"
              fullWidth
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
              autoComplete="email"
              fullWidth
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
              }}
            >
              Registrarse
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