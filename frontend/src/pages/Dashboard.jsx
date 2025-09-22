import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { recordService } from "../services/recordService";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import PatientDashboard from "../components/dashboard/PatientDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Dashboard = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await recordService.getAll();
      setRecords(response.records || []);

      // Calculate stats
      const verified =
        response.records?.filter((r) => r.isVerified).length || 0;
      setStats({
        total: response.records?.length || 0,
        verified: verified,
        pending: (response.records?.length || 0) - verified,
      });
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du dashboard..." />;
  }
  console.log(user);
  return (
    <DashboardLayout
      loading={loading}
      stats={stats}
      showForm={showForm}
      setShowForm={setShowForm}
      fetchRecords={fetchRecords}
    >
      {user?.role === "patient" ? (
        <PatientDashboard records={records} setShowForm={setShowForm} />
      ) : (
        <DoctorDashboard records={records} setShowForm={setShowForm} />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
