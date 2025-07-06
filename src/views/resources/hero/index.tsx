import Image from "next/image";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LockIcon from '@mui/icons-material/Lock';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

export default function hero() {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-center lg:justify-between w-full gap-6 lg:gap-8 px-4 sm:px-8 lg:px-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 min-h-screen py-8 lg:py-0">
            <div className="flex items-center justify-center lg:justify-start w-full lg:w-[50%] h-auto lg:h-screen">
                <Image
                    src="/images/image-resources.png"
                    alt="Hero Image"
                    width={700}
                    height={475}
                    className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] 2xl:w-[900px] h-auto shadow-lg object-cover rounded-lg"
                />
            </div>

            <div className="flex flex-col items-start justify-center w-full lg:w-[50%] lg:pl-8 text-white">
                <p className="text-green-400 mb-3 sm:mb-4 text-base sm:text-lg lg:text-xl font-medium">Conocimiento al alcance de tu mano</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 text-white leading-tight">Sensores para la calidad del aire: Una guía detallada</h1>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-200 mb-4 sm:mb-6">Descubre los diferentes tipos de sensores utilizados para monitorear la calidad del aire y como contribuyen a proyectos ambientales. Aprende sobre su funcionamiento, aplicaciones y como interpretar los datos que proporcionan.</p>
                
                <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center justify-start gap-3 sm:gap-4">
                    <CloudUploadIcon
                        sx={{
                            color: '#4ade80',
                            fontSize: { xs: 28, sm: 32, lg: 40 },
                        }}
                    />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Tipos de Sensores</h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-200 mb-3 sm:mb-4">Exploramos sensores de partículas, gases, temperatura y humedad, esenciales para una medición precisa de la calidad del aire.</p>
                
                <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center justify-start gap-3 sm:gap-4">
                    <LockIcon
                        sx={{
                            color: '#4ade80',
                            fontSize: { xs: 28, sm: 32, lg: 40 },
                        }}
                    />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Aplicaciones Prácticas</h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-200 mb-3 sm:mb-4">Desde estaciones de monitoreo urbano hasta proyectos de ciencia ciudadana, descubre cómo se utilizan estos sensores en el mundo real.</p>
                
                <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center justify-start gap-3 sm:gap-4">
                    <TroubleshootIcon
                        sx={{
                            color: '#4ade80',
                            fontSize: { xs: 28, sm: 32, lg: 40 },
                        }}
                    />
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Interpretación de Datos</h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-200">Aprende a leer e interpretar los datos proporcionados por los sensores para comprender el estado de la calidad del aire en tu entorno.</p>
            </div>
        </div>
    )
}