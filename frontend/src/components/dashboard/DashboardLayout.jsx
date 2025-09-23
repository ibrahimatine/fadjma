import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";
import RecordForm from "../records/RecordForm";
import { FileText, CheckCircle, AlertCircle, Plus } from "lucide-react";
import HealthTokenWidget from "../tokens/HealthTokenWidget";
import MedicalReminders from "../reminders/MedicalReminders";

const DashboardLayout = ({ children, loading, stats, showForm, setShowForm, fetchRecords }) => {
    const { user } = useAuth();
    const _isDoctor = user?.role === "doctor";
    const _isPharmacy = user?.role === "pharmacy";
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
                            : user?.role === "doctor"
                                ? "Consultez et créez des dossiers patients"
                                : "Gérez les livraisons de médicaments"}
                    </p>
                </div>

                {/* Stats Cards */}
                {_isDoctor && (
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
                )}
                {/* Recent Records Section */}

                {_isDoctor && (
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
                )}

                {_isPharmacy ? (
                    // Render PharmacyDashboard content directly if it's a pharmacy
                    children
                ) : (
                    // Existing children rendering for patient/doctor
                    children
                )}

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

export default DashboardLayout;