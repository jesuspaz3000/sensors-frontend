export default function Indicators() {
    return (
        <div className="bg-gradient-to-b from-green-700/95 via-green-600 to-green-700 px-4 sm:px-8 lg:px-16 py-8 lg:py-0">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-0">
                <div className="lg:flex-1 lg:pr-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[5rem] font-bold text-white text-center lg:text-left lg:pt-8">
                        Indicadores de Calidad del Aire
                    </h1>
                </div>
                <div className="lg:flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 py-4 sm:py-6 lg:py-8">
                        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/25 text-white hover:bg-white/20 transition-all duration-300">
                            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5rem] text-center font-bold">PM 2.5</p>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-center mt-2">Partículas finas en el aire</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/25 text-white hover:bg-white/20 transition-all duration-300">
                            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5rem] text-center font-bold">CO2</p>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-center mt-2">Dióxido de carbono</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/25 text-white hover:bg-white/20 transition-all duration-300">
                            <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[5rem] text-center font-bold">C°</p>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-center mt-2">Temperatura y humedad</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}