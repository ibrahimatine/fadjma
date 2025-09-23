// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import DoctorDashboard from "../components/dashboard/DoctorDashboard";
import PatientDashboard from "../components/dashboard/PatientDashboard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { patientService } from "../services/patienService"; // garde ton import existant

const Dashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
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

  // fetch page (page param optional)
  const fetchRecords = useCallback(async (p = 1, append = false) => {
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
  }, []);

  useEffect(() => {
    // initial load
    setPage(1);
    fetchRecords(1, false);
  }, [fetchRecords]);

  // fetchNextPage pour infinite scroll
  const fetchNextPage = async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    await fetchRecords(next, true);
  };

  // Handler pour demander l'accès (POST /access-requests)
  const handleRequestAccess = async (patientId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté pour demander l'accès.");
        return;
      }

      // ouvrir modal / demander raison ici si tu veux ; pour l'instant envoie simple
      const body = {
        patientId,
        reason: "Demande d'accès depuis l'application", // tu peux remplacer par modal input
        accessLevel: "read",
        // expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() // ex: 7 jours
      };

      const res = await fetch("/access-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Erreur ${res.status}`);
      }

      toast.success("Demande d'accès envoyée.");
      // Optionnel : refresh des stats ou des demandes
    } catch (err) {
      console.error("Request access error:", err);
      toast.error(err.message || "Impossible d'envoyer la demande.");
    }
  };

  if (loading && page === 1) {
    return <LoadingSpinner text="Chargement du dashboard..." />;
  }

  return (
    <DashboardLayout
      loading={loading}
      stats={stats}
      showForm={showForm}
      setShowForm={setShowForm}
      fetchRecords={() => fetchRecords(1, false)}
    >
      {user?.role === "patient" ? (
        <PatientDashboard records={patients} setShowForm={setShowForm} />
      ) : (
        <DoctorDashboard
          patients={patients}
          loading={loading}
          setShowForm={setShowForm}
          onRequestAccess={handleRequestAccess}
          onLoadMore={fetchNextPage}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
