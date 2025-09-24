// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import PatientDashboard from "../components/dashboard/PatientDashboard";
import PharmacistDashboard from "../components/dashboard/PharmacistDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { patientService } from "../services/patienService"; // garde ton import existant
import { accessService } from "../services/accessService";

const Dashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [accessStatus, setAccessStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
  });

  // fetch page (page param optional) - ONLY for doctors
  const fetchRecords = useCallback(async (p = 1, append = false) => {
    // Ne charger les patients que pour les médecins
    if (user?.role !== "doctor") {
      setLoading(false);
      return;
    }

    try {
      if (!append) setLoading(true);

      // ATTENTION : adapte si patientService.getAll attend d'autres params
      // j'appelle patientService.getAll({ page, limit }) : modifie si besoin
      let response;
      try {
        response = await patientService.getAll({ page: p, limit: PAGE_SIZE });
      } catch (err) {
        // fallback si getAll n'accepte pas d'arguments
        response = await patientService.getAll();
      }

      // Supposons que response.patients est le tableau
      const fetched = response?.patients || response || [];

      if (append) {
        setPatients((prev) => {
          // éviter les doublons si le backend renvoie des éléments déjà présents
          const ids = new Set(prev.map((r) => r.id));
          const merged = [...prev, ...fetched.filter((f) => !ids.has(f.id))];
          return merged;
        });
      } else {
        setPatients(fetched);
        // Fetch access status when we have patients
        fetchAccessStatus(fetched);
      }

      // pagination: détecter s'il y a encore des pages
      if (Array.isArray(fetched) && fetched.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // Stats : calculer verified (heuristique)
      const total = fetched.length;
      const verified = fetched.filter((p) => p.isVerified || p.verified || p.hederaTimestamp).length;
      setStats({
        total,
        verified,
        pending: Math.max(0, total - verified),
      });
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Impossible de récupérer les patients.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  // Fetch access status for all patients
  const fetchAccessStatus = useCallback(async (patientList) => {
    if (user?.role !== "doctor" || !user?.id || !patientList?.length) return;

    try {
      const patientIds = patientList.map(p => p.id);
      const response = await accessService.getAccessStatusForPatients(patientIds, user.id);

      if (response.success) {
        setAccessStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching access status:', error);
    }
  }, [user?.role, user?.id]);

  useEffect(() => {
    // initial load - seulement pour les médecins
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

  // Handler pour demander l'accès - ONLY for doctors
  const handleRequestAccess = async (patientId, reason = null) => {
    if (user?.role !== "doctor") {
      toast.error("Accès non autorisé");
      return;
    }

    try {
      // Demander une raison si pas fournie
      const accessReason = reason || prompt(
        "Veuillez indiquer la raison de votre demande d'accès :",
        "Consultation médicale"
      );

      if (!accessReason || accessReason.trim() === "") {
        toast.error("Une raison est requise pour la demande d'accès");
        return;
      }

      // Utiliser le nouveau service
      const response = await accessService.requestReadAccess(patientId, accessReason);

      if (response.success) {
        toast.success("Demande d'accès envoyée avec succès");
        // Refresh access status to update UI
        fetchAccessStatus(patients);
      } else {
        throw new Error(response.message || "Erreur lors de l'envoi de la demande");
      }
    } catch (error) {
      console.error("Request access error:", error);
      toast.error(error.message || "Impossible d'envoyer la demande d'accès");
    }
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

  // Données de test pour pharmacien
  const mockPrescriptions = [
    {
      id: 'RX001',
      patientName: 'Jean Dupont',
      doctorName: 'Dr. Martin',
      status: 'pending',
      createdAt: new Date().toISOString(),
      medications: [
        { name: 'Paracétamol', dosage: '500mg', quantity: '30 comprimés' },
        { name: 'Ibuprofène', dosage: '200mg', quantity: '20 comprimés' }
      ]
    },
    {
      id: 'RX002',
      patientName: 'Marie Durand',
      doctorName: 'Dr. Leroy',
      status: 'validated',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      medications: [
        { name: 'Amoxicilline', dosage: '1g', quantity: '14 comprimés' }
      ]
    }
  ];

  if (loading && page === 1) {
    return <LoadingSpinner text="Chargement du dashboard..." />;
  }

  return (
    <DashboardLayout
      loading={loading}
      stats={user?.role === "doctor" ? stats : { total: 0, verified: 0, pending: 0 }}
      showForm={showForm}
      setShowForm={setShowForm}
      fetchRecords={user?.role === "doctor" ? () => fetchRecords(1, false) : () => {}}
    >
      {user?.role === "patient" ? (
        <PatientDashboard records={patients} setShowForm={setShowForm} />
      ) : user?.role === "pharmacy" ? (
        <PharmacistDashboard
          prescriptions={prescriptions.length > 0 ? prescriptions : mockPrescriptions}
          loading={loading}
          onValidatePrescription={handleValidatePrescription}
          onPrepareMedication={handlePrepareMedication}
        />
      ) : (
        <DoctorDashboard
          patients={patients}
          loading={loading}
          setShowForm={setShowForm}
          onRequestAccess={handleRequestAccess}
          onLoadMore={fetchNextPage}
          doctorId={user?.id}
          accessStatus={accessStatus}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
