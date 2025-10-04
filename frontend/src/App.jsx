import React, { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import websocketService from "./services/websocketService";

// Eager loaded components (critical for initial render)
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientLinkForm from "./components/auth/PatientLinkForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PatientRecordGuard from "./components/auth/PatientRecordGuard";

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy loaded pages (code splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Records = lazy(() => import("./pages/Records"));
const RecordDetails = lazy(() => import("./pages/RecordDetails"));
const CreateMedicalRecord = lazy(() => import("./pages/CreateMedicalRecord"));
const PatientMedicalRecordsView = lazy(() => import("./components/patient/PatientMedicalRecordsView"));
const AdminRegistry = lazy(() => import("./pages/AdminRegistry"));
const AdminMonitoring = lazy(() => import("./pages/AdminMonitoring"));
const HistoryView = lazy(() => import("./pages/HistoryView"));
const PatientAppointments = lazy(() => import("./pages/PatientAppointments"));
const DoctorAppointments = lazy(() => import("./pages/DoctorAppointments"));
const AssistantDashboardV2 = lazy(() => import("./pages/AssistantDashboardV2"));
const AdminSpecialtyManagement = lazy(() => import("./pages/AdminSpecialtyManagement"));
const AdminUserManagement = lazy(() => import("./pages/AdminUserManagement"));

function App() {
  const { user, token } = useAuth();

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user && token) {
      console.log(
        "🔌 Initializing WebSocket connection for user:",
        user.id,
        "role:",
        user.role
      );

      websocketService
        .connect(token)
        .then(() => {
          console.log("✅ WebSocket connection established successfully");
        })
        .catch((error) => {
          console.error("❌ WebSocket connection failed:", error);
        });
    } else {
      // Disconnect WebSocket when user logs out
      if (websocketService.isConnected()) {
        console.log("🔌 Disconnecting WebSocket - user logged out");
        websocketService.disconnect();
      }
    }

    // Cleanup on component unmount
    return () => {
      if (websocketService.isConnected()) {
        websocketService.disconnect();
      }
    };
  }, [user, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" /> : <Register />}
          />
          <Route
            path="/link-patient"
            element={user ? <Navigate to="/dashboard" /> : <PatientLinkForm />}
          />
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
            <Route
              path="/records/:id"
              element={
                user?.role === "patient" ? (
                  <PatientRecordGuard>
                    <RecordDetails />
                  </PatientRecordGuard>
                ) : (
                  <RecordDetails />
                )
              }
            />
            <Route
              path="/patient/medical-records"
              element={<PatientMedicalRecordsView />}
            />
          </Route>
          <Route
            path="/patient/appointments"
            element={<PatientAppointments />}
          />
          <Route
            element={<ProtectedRoute allowedRoles={["doctor", "assistant"]} />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/create-medical-record"
              element={<CreateMedicalRecord />}
            />
            <Route
              path="/doctor/appointments"
              element={<DoctorAppointments />}
            />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/registry" element={<AdminRegistry />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route
              path="/admin/specialties"
              element={<AdminSpecialtyManagement />}
            />
            <Route path="/admin/users" element={<AdminUserManagement />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["assistant"]} />}>
            <Route
              path="/assistant/dashboard"
              element={<AssistantDashboardV2 />}
            />
          </Route>
          {/* Route accessible à tous les utilisateurs connectés */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]} />
            }
          >
            <Route path="/history" element={<HistoryView />} />
          </Route>
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
