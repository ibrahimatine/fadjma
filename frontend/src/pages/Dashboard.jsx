import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { recordService } from "../services/recordService";
import { Shield, FileText, CheckCircle, AlertCircle, Plus } from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import RecordForm from "../components/records/RecordForm";
import IntegrityButton from "../components/verification/IntegrityButton";
import VaccinationNFT from "../components/nft/VaccinationNFT";
import HealthTokenWidget from "../components/tokens/HealthTokenWidget";
import MedicalReminders from "../components/reminders/MedicalReminders";

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === "patient"
              ? "Gérez vos dossiers médicaux sécurisés"
              : "Consultez et créez des dossiers patients"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Dossiers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Vérifiés sur Hedera
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.verified}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Dossiers récents
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau dossier
          </button>
        </div>

        {/* Records List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun dossier médical trouvé</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 btn-primary"
              >
                Créer votre premier dossier
              </button>
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`badge-${
                      record.type === "allergy" ? "danger" : "success"
                    }`}
                  >
                    {record.type}
                  </span>
                  {record.isVerified && (
                    <Shield className="h-5 w-5 text-green-500" />
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {record.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {record.description}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  {new Date(record.createdAt).toLocaleDateString("fr-FR")}
                </div>

                <IntegrityButton recordId={record.id} />
              </div>
            ))
          )}
        </div>
        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <MedicalReminders />
          </div>
      
          <div>
            <HealthTokenWidget />
          </div>
        </div>

        {/* Record Form Modal */}
        {showForm && (
          <RecordForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              fetchRecords();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
