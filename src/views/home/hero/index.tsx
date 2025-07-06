import Image from "next/image";

export default function Hero() {
    return (
        <div className="relative">
            <div className="w-full h-screen">
                <Image
                    src="/images/fondo-hero.JPG"
                    width={1920}
                    height={1080}
                    alt="hero"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="absolute inset-0 flex flex-col justify-center items-center lg:items-start text-center lg:text-left text-black px-4 sm:px-8 md:px-12 lg:px-16 w-full lg:w-1/2 z-20">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[5rem] font-bold drop-shadow-lg leading-tight lg:leading-[1]">Monitorea la calidad del aire en tu ciudad</h1>
                <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl drop-shadow-md">Descubre como Aire Limpio te ayuda a entender y mejorar la calidad del aire que respiras</p>
            </div>
            <div className="absolute inset-0 z-10 hidden lg:block">
                <div className="absolute inset-0">
                    <Image
                        src="/images/image-hero1.jpg"
                        width={400}
                        height={700}
                        alt="image-hero1"
                        className="absolute top-100 right-120 w-[300px] h-[300px] object-cover rounded-2xl"
                    />
                </div>
                <div className="absolute inset-0 flex justify-end items-end">
                    <Image
                        src="/images/image-hero2.webp"
                        width={200}
                        height={200}
                        alt="image-hero2"
                        className="absolute bottom-50 right-120 w-[300px] h-[300px] object-cover rounded-2xl"
                    />
                </div>
                <div className="absolute inset-0 flex justify-end items-start">
                    <Image
                        src="/images/image-hero3.jpg"
                        width={200}
                        height={200}
                        alt="image-hero3"
                        className="absolute top-50 right-20 w-[300px] h-[300px] object-cover rounded-2xl"
                    />
                </div>
                <div className="absolute inset-0 flex justify-start items-end">
                    <Image
                        src="/images/image-hero4.avif"
                        width={200}
                        height={200}
                        alt="image-hero4"
                        className="absolute bottom-100 right-20 w-[300px] h-[300px] object-cover rounded-2xl"
                    />
                </div>
            </div>
        </div>
    );
}