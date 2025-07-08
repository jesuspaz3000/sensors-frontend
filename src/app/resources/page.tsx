import Resources from "@/views/resources";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ResourcesPage() {
    return (
        <ProtectedRoute>
            <Resources />
        </ProtectedRoute>
    );
}
