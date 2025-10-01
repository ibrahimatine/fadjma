import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import RecordDetails from './pages/RecordDetails';
import CreateMedicalRecord from './pages/CreateMedicalRecord';
import PatientMedicalRecordsView from './components/patient/PatientMedicalRecordsView';
import AdminRegistry from './pages/AdminRegistry';
import AdminMonitoring from './pages/AdminMonitoring';
import HistoryView from './pages/HistoryView';
import PatientLinkForm from './components/auth/PatientLinkForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PatientRecordGuard from './components/auth/PatientRecordGuard';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import websocketService from './services/websocketService';

// Appointment pages
import PatientAppointments from './pages/PatientAppointments';
import DoctorAppointments from './pages/DoctorAppointments';
import AssistantDashboardV2 from './pages/AssistantDashboardV2';


// Admin pages
import AdminSpecialtyManagement from './pages/AdminSpecialtyManagement';
import AdminUserManagement from './pages/AdminUserManagement';

function App() {
  const { user, token } = useAuth();

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (user && token) {
      console.log('🔌 Initializing WebSocket connection for user:', user.id, 'role:', user.role);

      websocketService.connect(token)
        .then(() => {
          console.log('✅ WebSocket connection established successfully');
        })
        .catch((error) => {
          console.error('❌ WebSocket connection failed:', error);
        });
    } else {
      // Disconnect WebSocket when user logs out
      if (websocketService.isConnected()) {
        console.log('🔌 Disconnecting WebSocket - user logged out');
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
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/link-patient" element={user ? <Navigate to="/dashboard" /> : <PatientLinkForm />} />
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
            <Route path="/records/:id" element={
              user?.role === 'patient' ? (
                <PatientRecordGuard>
                  <RecordDetails />
                </PatientRecordGuard>
              ) : (
                <RecordDetails />
              )
            } />
            <Route path="/patient/medical-records" element={<PatientMedicalRecordsView />} />
          </Route>
          <Route path="/patient/appointments" element={<PatientAppointments />} />
          <Route element={<ProtectedRoute allowedRoles={["doctor", "assistant"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-medical-record" element={<CreateMedicalRecord />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/registry" element={<AdminRegistry />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/admin/specialties" element={<AdminSpecialtyManagement />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["assistant"]} />}>
            <Route path="/dashboard" element={<AssistantDashboardV2 />} />
            <Route path="/assistant/appointments" element={<AssistantDashboardV2 />} />
            <Route path="/assistant/dashboard" element={<AssistantDashboardV2 />} />
          </Route>
          {/* Route accessible à tous les utilisateurs connectés */}
          <Route element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]} />}>
            <Route path="/history" element={<HistoryView />} />
          </Route>
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;