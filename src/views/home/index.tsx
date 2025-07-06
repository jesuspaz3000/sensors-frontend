import Hero from "./hero";
import Map from "./map";
import Navbar from "@/components/navbar";

export default function Home() {
    return (
        <div>
            <Navbar />
            <Hero />
            <Map />
        </div>
    );
}