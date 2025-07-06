import Navbar from "@/components/navbar";
import Hero from "./hero";
import Indicators from "./indicators";
import GraphicsSection from "./graphicsSection";

export default function AirQuality() {
    return (
        <div>
            <Navbar />
            <Hero />
            <Indicators />
            <GraphicsSection />
        </div>
    );
}