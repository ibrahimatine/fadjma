// src/components/dashboard/DoctorDashboard.jsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  User,
  Search,
  Filter,
  ChevronDown,
  X,
  CheckCircle,
  Plus
} from "lucide-react";
import DoctorRequestsModal from "../access/DoctorRequestsModal";
import PatientDetailsModal from "../patient/PatientDetailsModal";

/**
 * Props:
 * - patients: Array([{ id, firstName, lastName, phoneNumber, email, ... }])
 * - loading: boolean
 * - setShowForm: function(boolean)
 * - onRequestAccess: function(patientId) => Promise
 * - onLoadMore: function() => Promise (optional)
 * - doctorId: string (current doctor's ID)
 * - accessStatus: Object (access status for each patient ID)
 */
const DoctorDashboard = ({
  patients = [],
  loading = false,
  setShowForm = () => {},
  onLoadMore,
  doctorId
}) => {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastName");
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null);

  const containerRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // search + sort (client-side). For large sets, prefer server-side search.
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    let list = (patients || []).slice();

    if (q) {
      list = list.filter((p) => {
        const full = `${p.firstName ?? ""} ${p.lastName ?? ""} ${p.email ?? ""} ${p.phoneNumber ?? ""}`.toLowerCase();
        return full.includes(q);
      });
    }

    if (sortBy === "lastName") {
      list.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
    } else if (sortBy === "firstName") {
      list.sort((a, b) => (a.firstName || "").localeCompare(b.firstName || ""));
    }

    return list;
  }, [patients, query, sortBy]);

  // infinite scroll -> call onLoadMore when near bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || loadingMoreRef.current || loading) return;

    const threshold = 300; // px before bottom to trigger
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      loadingMoreRef.current = true;
      if (typeof onLoadMore === "function") {
        Promise.resolve(onLoadMore()).finally(() => {
          loadingMoreRef.current = false;
        });
      } else {
        loadingMoreRef.current = false;
      }
    }
  }, [onLoadMore, loading]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // skeleton card
  const renderSkeleton = (i) => (
    <div key={`skeleton-${i}`} className="p-4 rounded-lg border border-gray-100 bg-white animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-8 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );


  // Handle view patient details
  const handleViewPatient = (patient) => {
    setSelectedPatientForDetails(patient);
    setShowPatientDetails(true);
  };


  // All patients have approved access, show view button directly
  const getAccessButton = (patientId) => {
    const patient = patients.find(p => p.id === patientId);

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleViewPatient(patient)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <User className="h-4 w-4" />
          Voir dossier
        </button>
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-green-700 font-medium">Accès autorisé</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              aria-label="Rechercher un patient"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, email, téléphone..."
              className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50"
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4 text-gray-600" />
            Filtres
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          <button
            onClick={() => setShowRequestsModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 text-gray-600" />
            Mes demandes
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-200 bg-white text-sm"
            aria-label="Trier par"
          >
            <option value="lastName">Trier par nom</option>
            <option value="firstName">Trier par prénom</option>
          </select>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-4 p-4 rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="flex gap-4 flex-wrap">
            <div className="text-sm text-gray-600">Filtres :</div>
            <div className="px-3 py-1 text-xs rounded bg-gray-50 border border-gray-200">Tous</div>
            <div className="px-3 py-1 text-xs rounded bg-gray-50 border border-gray-200">Récents</div>
            <div className="px-3 py-1 text-xs rounded bg-gray-50 border border-gray-200">Avec contact</div>
          </div>
        </div>
      )}

      {/* Scrollable list */}
      <div
        ref={containerRef}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-auto max-h-[65vh] p-4 space-y-3"
      >
        {/* empty state */}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun dossier médical trouvé</p>
            {/* <button
              onClick={() => setShowForm(true)}
              className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Créer votre premier dossier
            </button> */}
          </div>
        )}

        {/* skeletons */}
        {loading && Array.from({ length: 6 }).map((_, i) => renderSkeleton(i))}

        {/* patients */}
        {!loading && filtered.map((patient) => (
          <div
            key={patient.id}
            className="p-4 flex items-center justify-between gap-4 rounded-lg border border-gray-50 hover:shadow transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.firstName} {patient.lastName}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 truncate">ID: {patient.id}</p>
                {patient.phoneNumber && <p className="text-xs text-gray-400 truncate">{patient.phoneNumber}</p>}
              </div>
            </div>

            <div className="flex-shrink-0">
              {getAccessButton(patient.id)}
            </div>
          </div>
        ))}

        {/* load more indicator (optional) */}
        <div className="flex justify-center py-4">
          {/* place spinner or "charger plus" */}
        </div>
      </div>

      {/* Doctor Requests Management Modal */}
      <DoctorRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        doctorId={doctorId}
      />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={showPatientDetails}
        onClose={() => {
          setShowPatientDetails(false);
          setSelectedPatientForDetails(null);
        }}
        patient={selectedPatientForDetails}
        accessLevel="read"
        canEdit={false}
      />

    </div>
  );
};

export default DoctorDashboard;
