import Image from 'next/image';

export default function Collaborators() {
    return (
        <div className='flex flex-col items-center justify-center w-full bg-gradient-to-b to-indigo-900 from-blue-900 py-12 sm:py-16 lg:py-20'>
            <div className='text-center mb-8 sm:mb-12 lg:mb-16 px-4 sm:px-8'>
                <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight'>Colaboramos con líderes en la protección del aire</h1>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12 lg:gap-16 px-4 sm:px-8 lg:px-16 w-full max-w-7xl'>
                <div className='flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 hover:bg-white/20 transition-all duration-300 shadow-2xl'>
                    <Image
                        src="/images/logo-unsa.png"
                        alt="UNSA Logo"
                        width={250}
                        height={250}
                        className="w-auto h-[120px] sm:h-[150px] lg:h-[180px] xl:h-[200px] object-contain filter brightness-110"
                    />
                </div>
                <div className='flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 hover:bg-white/20 transition-all duration-300 shadow-2xl'>
                    <Image
                        src="/images/logo-production-services.png"
                        alt="Production Services Logo"
                        width={250}
                        height={250}
                        className="w-auto h-[120px] sm:h-[150px] lg:h-[180px] xl:h-[200px] object-contain filter brightness-110"
                    />
                </div>
                <div className='flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 hover:bg-white/20 transition-all duration-300 shadow-2xl'>
                    <Image
                        src="/images/logo-epit.png"
                        alt="EPIT Logo"
                        width={250}
                        height={250}
                        className="w-auto h-[120px] sm:h-[150px] lg:h-[180px] xl:h-[200px] object-contain filter brightness-110"
                    />
                </div>
            </div>
        </div>
    );
}