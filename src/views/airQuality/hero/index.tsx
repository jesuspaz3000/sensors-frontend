import Image from "next/image";

export default function AirQuality() {
    return (
        <div className="relative w-full h-screen">
            {/* Fondo de imagen */}
            <div className="absolute inset-0">
                <Image
                    src="/images/fondo-air-quality.jpg"
                    alt="Air Quality"
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover"
                />
                {/* Overlay verde para crear el efecto de la imagen con degradado hacia abajo */}
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/80 via-green-600/70 to-green-700/90"></div>
            </div>

            {/* Contenido principal */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8">
                {/* Título principal */}
                <div className="text-center mb-8 sm:mb-12 lg:mb-16 max-w-5xl">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5rem] font-bold text-white mb-4 sm:mb-6 drop-shadow-2xl">
                        Calidad de aire en tu ciudad
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 drop-shadow-lg font-medium">
                        Explora datos y recomendaciones para un ambiente más saludable.
                    </p>
                </div>

                {/* Sección de datos clave */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl border border-white/20 max-w-6xl w-full">
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">
                            Datos clave de calidad del aire
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80">
                            Un vistazo rápido a los niveles de contaminación y tendencias actuales.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                        {/* Puntos de monitoreo */}
                        <div className="text-center group">
                            <div className="mb-3 sm:mb-4">
                                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-green-300 drop-shadow-lg group-hover:text-green-200 transition-colors duration-300">
                                    3
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                                Puntos de monitoreo
                            </h3>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base">
                                Ubicados estratégicamente en la ciudad
                            </p>
                        </div>

                        {/* Monitoreo continuo */}
                        <div className="text-center group">
                            <div className="mb-3 sm:mb-4">
                                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-green-300 drop-shadow-lg group-hover:text-green-200 transition-colors duration-300">
                                    24/7
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                                Monitoreo continuo
                            </h3>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base">
                                Datos actualizados en tiempo real
                            </p>
                        </div>

                        {/* Precisión */}
                        <div className="text-center group">
                            <div className="mb-3 sm:mb-4">
                                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-green-300 drop-shadow-lg group-hover:text-green-200 transition-colors duration-300">
                                    90%
                                </span>
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                                Precisión
                            </h3>
                            <p className="text-white/70 text-xs sm:text-sm md:text-base">
                                En la medición de contaminantes
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
