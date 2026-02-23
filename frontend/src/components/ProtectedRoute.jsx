import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div><h1>Loading, please wait</h1></div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role == 'participant')
            return <Navigate to="/dashboard" replace />
        else if (user.role == 'organizer')
            return <Navigate to="/organizer/dashboard" replace />
        else if (user.role == 'admin')
            return <Navigate to="/admin/dashboard" replace />
    }

    return <Outlet />
}
export default ProtectedRoute;