import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // 👈 récupère la route actuelle
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Specific redirection for patient and pharmacy roles if they try to access other dashboards
  if ((user.role === "patient" || user.role === "pharmacy") && location.pathname !== "/dashboard") {
    return <Navigate to="/dashboard" replace />; // Redirect to their respective dashboards
  }

  return <Outlet />;
};

export default ProtectedRoute;
