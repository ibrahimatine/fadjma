import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // 👈 récupère la route actuelle
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user.role == "patient" && location.pathname !== "/dashboard") {
    return <Navigate to="/unauthorized" replace />; // page 403 ou redirection par défaut
  }

  return <Outlet />;
};

export default ProtectedRoute;
