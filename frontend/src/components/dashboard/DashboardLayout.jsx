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

                        {_isDoctor && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 text-sm"
                                    title="Créer dossier"
                                    aria-label="Créer un dossier médical"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouveau dossier
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setShowCreatePatientModal(true);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <UserPlus className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Créer un profil patient</div>
                                                    <div className="text-xs text-gray-500">Le patient créera son compte plus tard</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowForm(true);
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <FileText className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <div className="font-medium text-gray-900">Créer un dossier médical</div>
                                                    <div className="text-xs text-gray-500">Pour un patient existant</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Click outside to close dropdown */}
                                {showDropdown && (
                                    <div
                                        className="fixed inset-0 z-0"
                                        onClick={() => setShowDropdown(false)}
                                    />
                                )}
                            </div>
                        )}
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

                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Vérifiés sur Hedera</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

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
