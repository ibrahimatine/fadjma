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
import HistoryView from './pages/HistoryView';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PatientRecordGuard from './components/auth/PatientRecordGuard';
import Header from './components/common/Header';
import websocketService from './services/websocketService';

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
    <div className="min-h-screen bg-gray-50">
      {user && <Header />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Login />} />
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
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-medical-record" element={<CreateMedicalRecord />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["pharmacy"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/registry" element={<AdminRegistry />} />
        </Route>
        {/* Route accessible à tous les utilisateurs connectés */}
        <Route element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]} />}>
          <Route path="/history" element={<HistoryView />} />
        </Route>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

export default App;