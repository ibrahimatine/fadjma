import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation(); // 👈 récupère la route actuelle

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Specific redirection for patient and pharmacy roles
  if (user.role === "patient" || user.role === "pharmacy") {
    const allowedPatientRoutes = [
      "/dashboard",
      "/patient/medical-records"
    ];

    // Allow access to specific record routes (will be further protected by PatientRecordGuard)
    const isRecordRoute = location.pathname.startsWith("/records/");

    // Check if current route is allowed for patients
    const isAllowedRoute = allowedPatientRoutes.some(route =>
      location.pathname === route || location.pathname.startsWith(route)
    );

    if (!isAllowedRoute && !isRecordRoute) {
      return <Navigate to="/dashboard" replace />; // Redirect to their respective dashboards
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
