import Profile from "@/views/profile";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute>
            <Profile />
        </ProtectedRoute>
    );
}
