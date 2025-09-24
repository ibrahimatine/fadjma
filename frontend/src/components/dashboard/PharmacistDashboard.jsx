// src/components/dashboard/PharmacistDashboard.jsx
import React, { useState, useMemo } from "react";
import {
  Pill,
  Search,
  Calendar,
  Clock,
  User,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Package,
  Eye,
  ShoppingCart,
  Truck
} from "lucide-react";
import IntegrityButton from "../verification/IntegrityButton";

/**
 * Dashboard pour pharmacien - gestion des ordonnances et prescriptions
 * Props:
 * - prescriptions: Array([{ id, patientName, doctorName, medications, status, createdAt, ... }])
 * - loading: boolean
 * - onValidatePrescription: function(prescriptionId) => Promise
 * - onPrepareMedication: function(prescriptionId) => Promise
 */
const PharmacistDashboard = ({
  prescriptions = [],
  loading = false,
  onValidatePrescription,
  onPrepareMedication
}) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Configuration des statuts avec couleurs
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "yellow",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: Clock
    },
    validated: {
      label: "Validée",
      color: "blue",
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      icon: FileCheck
    },
    preparing: {
      label: "En préparation",
      color: "purple",
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-100 text-purple-800",
      icon: Package
    },
    ready: {
      label: "Prête",
      color: "green",
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-800",
      icon: CheckCircle
    },
    delivered: {
      label: "Délivrée",
      color: "gray",
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-100 text-gray-800",
      icon: Truck
    },
    rejected: {
      label: "Rejetée",
      color: "red",
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: AlertTriangle
    }
  };

  // Filtrage et recherche
  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;

    // Filtre par recherche
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(prescription =>
        prescription.patientName?.toLowerCase().includes(q) ||
        prescription.doctorName?.toLowerCase().includes(q) ||
        prescription.medications?.some(med => med.name?.toLowerCase().includes(q))
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(prescription => prescription.status === statusFilter);
    }

    // Tri par date (plus récent en premier)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [prescriptions, query, statusFilter]);

  // Actions sur les prescriptions
  const handleValidate = async (prescriptionId) => {
    if (typeof onValidatePrescription === "function") {
      try {
        await onValidatePrescription(prescriptionId);
      } catch (err) {
        console.error("Validation failed:", err);
      }
    }
  };

  const handlePrepare = async (prescriptionId) => {
    if (typeof onPrepareMedication === "function") {
      try {
        await onPrepareMedication(prescriptionId);
      } catch (err) {
        console.error("Preparation failed:", err);
      }
    }
  };

  const getActionButton = (prescription) => {
    switch (prescription.status) {
      case "pending":
        return (
          <button
            onClick={() => handleValidate(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <FileCheck className="h-4 w-4" />
            Valider
          </button>
        );
      case "validated":
        return (
          <button
            onClick={() => handlePrepare(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <Package className="h-4 w-4" />
            Préparer
          </button>
        );
      case "preparing":
        return (
          <button
            onClick={() => handlePrepare(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Terminer
          </button>
        );
      default:
        return (
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm cursor-default">
            <Eye className="h-4 w-4" />
            Consulter
          </button>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Pharmacie - Gestion des Ordonnances</h1>
        <p className="text-green-100">
          Validez, préparez et délivrez les prescriptions médicales
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = prescriptions.filter(p => p.status === status).length;
          const Icon = config.icon;
          return (
            <div key={status} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{config.label}</p>
                  <p className={`text-2xl font-bold ${
                    config.color === 'yellow' ? 'text-yellow-600' :
                    config.color === 'blue' ? 'text-blue-600' :
                    config.color === 'purple' ? 'text-purple-600' :
                    config.color === 'green' ? 'text-green-600' :
                    config.color === 'gray' ? 'text-gray-600' :
                    'text-red-600'
                  }`}>
                    {count}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${
                  config.color === 'yellow' ? 'text-yellow-500' :
                  config.color === 'blue' ? 'text-blue-500' :
                  config.color === 'purple' ? 'text-purple-500' :
                  config.color === 'green' ? 'text-green-500' :
                  config.color === 'gray' ? 'text-gray-500' :
                  'text-red-500'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher patient, médecin, médicament..."
              className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 text-gray-600" />
            Filtres
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 rounded-lg border border-gray-200 bg-white text-sm"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(statusConfig).map(([status, config]) => (
            <option key={status} value={status}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Panel de filtres étendu */}
      {showFilters && (
        <div className="p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select className="w-full py-2 px-3 rounded-lg border border-gray-200 text-sm">
                <option>Aujourd'hui</option>
                <option>Cette semaine</option>
                <option>Ce mois</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select className="w-full py-2 px-3 rounded-lg border border-gray-200 text-sm">
                <option>Toutes</option>
                <option>Urgente</option>
                <option>Normale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select className="w-full py-2 px-3 rounded-lg border border-gray-200 text-sm">
                <option>Tous</option>
                <option>Prescription</option>
                <option>Renouvellement</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Liste des prescriptions */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-lg border border-gray-100 bg-white animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : filteredPrescriptions.length === 0 ? (
          // État vide
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Pill className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune prescription trouvée
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Les prescriptions apparaîtront ici lorsque les médecins les créeront
            </p>
          </div>
        ) : (
          // Liste des prescriptions
          filteredPrescriptions.map((prescription) => {
            const config = statusConfig[prescription.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div
                key={prescription.id}
                className={`${config.bg} ${config.border} border-l-4 rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Pill className="h-6 w-6 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Ordonnance #{prescription.id}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {config.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Patient: {prescription.patientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Médecin: Dr. {prescription.doctorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(prescription.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(prescription.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      {/* Médicaments */}
                      <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Médicaments prescrits:</h4>
                        <div className="space-y-2">
                          {prescription.medications?.map((med, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{med.name}</span>
                              <span className="text-gray-600">{med.dosage} - {med.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {getActionButton(prescription)}
                  </div>
                </div>

                {/* Vérification d'intégrité */}
                <div className="pt-4 border-t border-white border-opacity-60">
                  <IntegrityButton recordId={prescription.id} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PharmacistDashboard;