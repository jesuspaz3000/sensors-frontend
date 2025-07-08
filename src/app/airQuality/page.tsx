import AirQuality from "@/views/airQuality";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute>
            <AirQuality />
        </ProtectedRoute>
    );
}