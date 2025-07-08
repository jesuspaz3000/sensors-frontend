import AdminUsers from "@/views/adminUsers";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute adminOnly={true}>
            <AdminUsers />
        </ProtectedRoute>
    );
}
