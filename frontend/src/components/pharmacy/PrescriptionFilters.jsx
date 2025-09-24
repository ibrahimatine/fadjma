// src/components/pharmacy/PrescriptionFilters.jsx
import React from "react";
import { Search, Filter, X } from "lucide-react";

const PrescriptionFilters = ({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  showFilters,
  setShowFilters
}) => {
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "validated", label: "Validées" },
    { value: "preparing", label: "En préparation" },
    { value: "ready", label: "Prêtes" },
    { value: "delivered", label: "Délivrées" },
    { value: "rejected", label: "Rejetées" }
  ];

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
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
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
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
                <option>Personnalisée</option>
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
                <option>Faible</option>
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
                <option>Génériques</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionFilters;