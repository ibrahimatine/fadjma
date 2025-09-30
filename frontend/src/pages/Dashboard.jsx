// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import PatientDashboard from "../components/dashboard/PatientDashboard";
import PharmacistDashboard from "../components/dashboard/PharmacistDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { userService } from "../services/userService";

const Dashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [doctorStats, setDoctorStats] = useState({});
  const navigate = useNavigate();

  // pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });
  const fetchUserStats = useCallback(async () => {
    if (user?.role != "doctor") {
      return;
    }
    const response = await userService.getDoctorStats();
    console.log("Patient stats response:", response);

    if (response.success) {
      setDoctorStats(response.data || {});
    } else {
      toast.error("Impossible de récupérer les statistiques du médecin.");
    }
  }, [user?.role, user?.id]);

  // fetch accessible patients only - ONLY for doctors
  const fetchRecords = useCallback(async (p = 1, append = false) => {
    // Ne charger les patients que pour les médecins
    if (user?.role !== "doctor") {
      setLoading(false);
      return;
    }

    try {
      if (!append) setLoading(true);

      // Récupérer tous les patients accessibles (avec ou sans dossiers médicaux)
      const response = await fetch('/api/patients/accessible-patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const fetched = data.data.patients || [];
        if (append) {
          setPatients((prev) => {
            // éviter les doublons si le backend renvoie des éléments déjà présents
            const ids = new Set(prev.map((r) => r.id));
            const merged = [...prev, ...fetched.filter((f) => !ids.has(f.id))];
            return merged;
          });
        } else {
          setPatients(fetched);
        }

        // Pour la pagination, on récupère tous les patients en une fois pour simplifier
        setHasMore(false);

        // Stats basées sur les patients accessibles
        const total = fetched.length;
        const verified = fetched.filter((p) => p.isVerified || p.verified || p.hederaTimestamp).length;
        const unclaimed = doctorStats.pendingRecords || 0; // patients non réclamés

        setStats({
          total,
          verified,
          pending: unclaimed, // Les patients non réclamés sont "en attente"
        });
      } else {
        setPatients([]);
        setStats({ total: 0, verified: 0, pending: 0 });
      }
    } catch (error) {
      console.error("Error fetching accessible patients:", error);
      toast.error("Impossible de récupérer les patients accessibles.");
      setPatients([]);
      setStats({ total: 0, verified: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.role]);


  useEffect(() => {
    // initial load - seulement pour les médecins
    if (user?.role === "admin" && user?.role !== "doctor" && user?.role !== "pharmacy" && user?.role !== "patient") {
      navigate('/admin/registry');
      return;
    }
    fetchUserStats();
    if (user?.role === "doctor") {
      setPage(1);
      fetchRecords(1, false);
    } else {
      setLoading(false);
    }
  }, [fetchRecords, user?.role]);

  // fetchNextPage pour infinite scroll - ONLY for doctors
  const fetchNextPage = async () => {
    if (user?.role !== "doctor" || !hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchRecords(next, true);
  };


  // Handlers pour pharmacien
  const handleValidatePrescription = async (prescriptionId) => {
    try {
      // Simuler la validation (à remplacer par API call)
      setPrescriptions(prev => prev.map(p =>
        p.id === prescriptionId ? { ...p, status: 'validated' } : p
      ));
      toast.success('Prescription validée');
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handlePrepareMedication = async (prescriptionId) => {
    try {
      // Simuler la préparation (à remplacer par API call)
      setPrescriptions(prev => prev.map(p => {
        if (p.id === prescriptionId) {
          const newStatus = p.status === 'validated' ? 'preparing' :
            p.status === 'preparing' ? 'ready' : p.status;
          return { ...p, status: newStatus };
        }
        return p;
      }));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };



  if (loading && page === 1) {
    return <LoadingSpinner text="Chargement du dashboard..." />;
  }
  return (
    <DashboardLayout
      loading={loading}
      stats={user?.role === "doctor" ? stats : { total: 0, verified: 0, pending: 0 }}
      showForm={showForm}
      setShowForm={setShowForm}
      fetchRecords={user?.role === "doctor" ? () => fetchRecords(1, false) : () => { }}
    >
      {user?.role === "patient" ? (
        <PatientDashboard />
      ) : user?.role === "pharmacy" ? (
        <PharmacistDashboard
          prescriptions={prescriptions.length > 0 ? prescriptions : []}
          loading={loading}
          onValidatePrescription={handleValidatePrescription}
          onPrepareMedication={handlePrepareMedication}
        />
      ) : (
        <DoctorDashboard
          patients={patients}
          loading={loading}
          setShowForm={setShowForm}
          onLoadMore={fetchNextPage}
          doctorId={user?.id}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
