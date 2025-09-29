// src/components/dashboard/PharmacistDashboard.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import MatriculeSearch from "../pharmacy/MatriculeSearch";
import DispensationWorkflow from "../pharmacy/DispensationWorkflow";
import BatchDispensationWorkflow from "../pharmacy/BatchDispensationWorkflow";
import PharmacyCart from "../pharmacy/PharmacyCart";
import websocketService from "../../services/websocketService";
import toast from "react-hot-toast";

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
  onPrepareMedication,
  onRefreshPrescriptions // Add refresh callback prop
}) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // "search", "list", "workflow", "cart"
  const [foundPrescription, setFoundPrescription] = useState(null);
  const [dispensationMode, setDispensationMode] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [batchDispensation, setBatchDispensation] = useState(null);
  const [cartItems, setCartItems] = useState([]);

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

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('pharmacyCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Erreur parsing panier:', error);
        localStorage.removeItem('pharmacyCart');
      }
    }
  }, []);

  // Fonction d'ajout au panier
  const addToPharmacyCart = useCallback((prescription, quantity = 1) => {
    console.log('🛒 Ajout au panier depuis Dashboard:', prescription?.matricule);

    if (!prescription || !prescription.matricule) {
      console.error('❌ Prescription invalide:', prescription);
      toast.error('Prescription invalide');
      return;
    }

    setCartItems(currentItems => {
      const existingIndex = currentItems.findIndex(
        item => item.prescription.matricule === prescription.matricule
      );

      let newItems;
      if (existingIndex >= 0) {
        // Mettre à jour la quantité si déjà présent
        newItems = currentItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        toast.success('Quantité mise à jour dans le panier');
        console.log('📦 Quantité mise à jour pour:', prescription.matricule);
      } else {
        // Ajouter nouveau item
        const cartItem = {
          id: Date.now(),
          prescription,
          quantity,
          addedAt: new Date().toISOString(),
          status: 'pending'
        };
        newItems = [...currentItems, cartItem];
        toast.success('Médicament ajouté au panier');
        console.log('➕ Nouveau médicament ajouté:', prescription.matricule);
      }

      // Sauvegarder dans localStorage
      localStorage.setItem('pharmacyCart', JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  // Exposer la fonction globalement
  useEffect(() => {
    console.log('🛒 Exposition de window.addToPharmacyCart depuis Dashboard');
    window.addToPharmacyCart = addToPharmacyCart;

    // Test si la fonction est bien exposée
    if (typeof window.addToPharmacyCart === 'function') {
      console.log('✅ window.addToPharmacyCart exposée avec succès depuis Dashboard');
    } else {
      console.error('❌ Échec exposition window.addToPharmacyCart depuis Dashboard');
    }

    return () => {
      // Ne pas nettoyer lors du démontage car d'autres composants peuvent l'utiliser
      console.log('🔄 Dashboard démontage - conservation de window.addToPharmacyCart');
    };
  }, [addToPharmacyCart]);

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

  // WebSocket listeners for real-time prescription updates
  useEffect(() => {
    // Listen for prescription status changes
    const handlePrescriptionStatusChanged = (data) => {
      console.log('💊 Prescription status changed in pharmacist dashboard:', data);

      // Refresh prescriptions if available
      if (typeof onRefreshPrescriptions === 'function') {
        onRefreshPrescriptions();
      }
    };

    // Listen for new prescriptions
    const handleNewPrescription = (data) => {
      console.log('📋 New prescription received:', data);

      // Refresh prescriptions list
      if (typeof onRefreshPrescriptions === 'function') {
        onRefreshPrescriptions();
      }
    };

    // Listen for prescription refresh events
    const handleRefreshPrescriptions = (event) => {
      console.log('🔄 Prescription refresh requested:', event.detail);

      if (typeof onRefreshPrescriptions === 'function') {
        onRefreshPrescriptions();
      }
    };

    // Add WebSocket event listeners
    websocketService.addEventListener('prescription_status_changed', handlePrescriptionStatusChanged);
    websocketService.addEventListener('new_prescription', handleNewPrescription);

    // Add custom window event listeners
    window.addEventListener('refreshPrescriptions', handleRefreshPrescriptions);

    // Cleanup
    return () => {
      websocketService.removeEventListener('prescription_status_changed', handlePrescriptionStatusChanged);
      websocketService.removeEventListener('new_prescription', handleNewPrescription);
      window.removeEventListener('refreshPrescriptions', handleRefreshPrescriptions);
    };
  }, [onRefreshPrescriptions]);

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
            onClick={() => startDispensationWorkflow(prescription)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <Truck className="h-4 w-4" />
            Dispenser
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

  // Gestion de la prescription trouvée par matricule
  const handlePrescriptionFound = (prescription) => {
    setFoundPrescription(prescription);
    setActiveTab("result");
  };

  // Démarrer le workflow de dispensation
  const startDispensationWorkflow = (prescription) => {
    setCurrentPrescription(prescription);
    setDispensationMode(true);
    setActiveTab("workflow");
  };

  // Finaliser la dispensation
  const handleDispensationComplete = (result) => {
    console.log('Dispensation terminée:', result);

    // Si c'est une dispensation en lot, vider le panier
    if (batchDispensation) {
      localStorage.removeItem('pharmacyCart');
    }

    setDispensationMode(false);
    setCurrentPrescription(null);
    setBatchDispensation(null);
    setFoundPrescription(null);
    setActiveTab("search");

    // Rafraîchir la liste des prescriptions
    if (onPrepareMedication) {
      onPrepareMedication(result);
    }
  };

  // Annuler la dispensation
  const handleDispensationCancel = () => {
    setDispensationMode(false);
    setCurrentPrescription(null);
    setBatchDispensation(null);
    setActiveTab("cart"); // Retourner au panier
  };

  // Démarrer la dispensation en lot
  const handleBatchDispensation = (cartItems, groupedByPatient) => {
    setBatchDispensation({ cartItems, groupedByPatient });
    setDispensationMode(true);
    setActiveTab("workflow");
  };

  const clearFoundPrescription = () => {
    setFoundPrescription(null);
    setActiveTab("search");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Pharmacie - Gestion des Ordonnances</h1>
        <p className="text-green-100">
          Recherchez par matricule ou consultez toutes vos prescriptions
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeTab === "search"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Search className="h-5 w-5" />
          Recherche par matricule
        </button>

        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeTab === "cart"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          Panier
        </button>

        <button
          onClick={() => {
            setActiveTab("list");
            clearFoundPrescription();
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeTab === "list"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Pill className="h-5 w-5" />
          Toutes les prescriptions
        </button>
      </div>

      {/* Statistiques rapides - seulement pour l'onglet liste */}
      {activeTab === "list" && (
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
      )}

      {/* Contenu principal selon l'onglet actif */}
      {activeTab === "search" && (
        <MatriculeSearch
          onPrescriptionFound={handlePrescriptionFound}
          loading={loading}
        />
      )}

      {activeTab === "result" && foundPrescription && (
        <div className="space-y-4">
          {/* Bouton retour */}
          <button
            onClick={clearFoundPrescription}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <X className="h-4 w-4" />
            Nouvelle recherche
          </button>

          {/* Affichage de la prescription trouvée */}
          <div className="bg-green-50 border-l-4 border-green-400 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ordonnance #{foundPrescription.id}
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Matricule: {foundPrescription.matricule}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Patient: {foundPrescription.patient?.firstName} {foundPrescription.patient?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Médecin: Dr. {foundPrescription.doctor?.firstName} {foundPrescription.doctor?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(foundPrescription.issueDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      <span>Statut: {foundPrescription.deliveryStatus}</span>
                    </div>
                  </div>

                  {/* Médicaments */}
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Médicament prescrit:</h4>
                    <div className="text-sm">
                      <div className="font-medium">{foundPrescription.medication}</div>
                      <div className="text-gray-600">
                        Dosage: {foundPrescription.dosage} - Quantité: {foundPrescription.quantity}
                      </div>
                      {foundPrescription.instructions && (
                        <div className="text-gray-600 mt-2">
                          Instructions: {foundPrescription.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('🛒 Ajout manuel au panier via fonction directe');
                    addToPharmacyCart(foundPrescription);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Ajouter au panier
                </button>

                <button
                  onClick={() => startDispensationWorkflow(foundPrescription)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  <Truck className="h-5 w-5" />
                  Commencer la dispensation
                </button>
              </div>
            </div>

            {/* Vérification d'intégrité */}
            <div className="pt-4 border-t border-white border-opacity-60">
              <IntegrityButton recordId={foundPrescription.id} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div className="space-y-4">
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
      )}

      {/* Vue panier */}
      {activeTab === "cart" && (
        <div className="mt-6">
          <PharmacyCart
            cartItems={cartItems}
            setCartItems={setCartItems}
            onStartBatchDispensation={handleBatchDispensation}
            onClearCart={() => {
              setCartItems([]);
              localStorage.removeItem('pharmacyCart');
            }}
          />
        </div>
      )}

      {/* Workflow de dispensation */}
      {activeTab === "workflow" && dispensationMode && (
        <div className="mt-6">
          {batchDispensation ? (
            <BatchDispensationWorkflow
              batchDispensation={batchDispensation}
              onComplete={handleDispensationComplete}
              onCancel={handleDispensationCancel}
            />
          ) : currentPrescription ? (
            <DispensationWorkflow
              prescription={currentPrescription}
              onComplete={handleDispensationComplete}
              onCancel={handleDispensationCancel}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PharmacistDashboard;