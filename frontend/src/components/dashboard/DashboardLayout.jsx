// src/components/dashboard/DashboardLayout.jsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";
import RecordForm from "../records/RecordForm";
import CreateUnclaimedPatientModal from "../patient/CreateUnclaimedPatientModal";
import { FileText, CheckCircle, AlertCircle, Plus, RefreshCw, UserPlus } from "lucide-react";

/**
 * Props:
 * - children: React nodes (page content)
 * - loading: boolean
 * - stats: { total, verified, pending }
 * - showForm: boolean
 * - setShowForm: function(boolean)
 * - fetchRecords: function() => void (refresh list)
 */
const DashboardLayout = ({
    children,
    loading = false,
    stats = { total: 0, verified: 0, pending: 0 },
    showForm = false,
    setShowForm = () => { },
    fetchRecords = () => { }
}) => {
    const { user } = useAuth();
    const _isDoctor = user?.role === "doctor";
    const _isPharmacy = user?.role === "pharmacy";
    const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    if (loading) {
        return <LoadingSpinner text="Chargement du dashboard..." />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Bienvenue, {user?.firstName} {user?.lastName}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {_isDoctor
                                ? "Consultez et créez des dossiers patients"
                                : user?.role === "patient"
                                    ? "Gérez vos dossiers médicaux sécurisés"
                                    : _isPharmacy
                                        ? "Gérez les ordonnances et vérifications"
                                        : "Bienvenue"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {(_isDoctor || user?.role === "patient") && (
                            <button
                                onClick={() => fetchRecords()}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm hover:bg-gray-50"
                                title="Rafraîchir"
                                aria-label="Rafraîchir"
                            >
                                <RefreshCw className="h-4 w-4 text-gray-600" />
                                Rafraîchir
                            </button>
                        )}

                        {/* Removed: Only assistants can create patient profiles */}
                    </div>
                </div>

                {/* Doctor stats */}
                {_isDoctor && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total dossiers</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-primary-500" />
                            </div>
                        </div>

                        {/* Removed Hedera verification card */}

                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">En attente</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="mb-8">
                    {children}
                </div>


                {/* Record Form Modal */}
                {showForm && (
                    <RecordForm
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false);
                            // refresh the list
                            fetchRecords();
                        }}
                    />
                )}

                {/* Create Unclaimed Patient Modal */}
                {showCreatePatientModal && (
                    <CreateUnclaimedPatientModal
                        isOpen={showCreatePatientModal}
                        onClose={() => setShowCreatePatientModal(false)}
                        onSuccess={(patient) => {
                            setShowCreatePatientModal(false);
                            // Optionally refresh the records or show a success notification
                            fetchRecords();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
