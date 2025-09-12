import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DoctorDashboard from '../components/dashboard/DoctorDashboard';
import PatientDashboard from '../components/dashboard/PatientDashboard';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === 'doctor' ? (
        <DoctorDashboard />
      ) : (
        <PatientDashboard />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;