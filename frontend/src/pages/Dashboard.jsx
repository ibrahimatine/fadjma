import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import PatientDashboard from "../components/dashboard/PatientDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { patientService } from "../services/patienService";

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
      const response = await patientService.getAll();
      console.log("Fetched patients:", response);
      setRecords(response.patients || []);

      // Calculate stats
      const verified =
        response.patients?.filter((p) => p.role === "patient").length || 0;
      setStats({
        total: response.patients?.length || 0,
        verified: verified,
        pending: (response.patients?.length || 0) - verified,
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
