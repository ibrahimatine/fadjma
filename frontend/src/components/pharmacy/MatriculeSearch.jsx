// src/components/pharmacy/MatriculeSearch.jsx
import React, { useState } from "react";
import { Search, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

const MatriculeSearch = ({ onPrescriptionFound, loading = false }) => {
  const [matricule, setMatricule] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  // Validation du format matricule en temps réel
  const isValidFormat = (value) => {
    return /^PRX-\d{8}-[A-F0-9]{4}$/.test(value);
  };

  const formatMatricule = (value) => {
    // Supprimer tous les caractères non alphanumériques
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Ajouter PRX- au début si pas présent
    let formatted = clean.startsWith('PRX') ? clean : 'PRX' + clean;

    // Formater selon le pattern PRX-YYYYMMDD-XXXX
    if (formatted.length <= 3) return formatted;
    if (formatted.length <= 11) return formatted.slice(0, 3) + '-' + formatted.slice(3);
    return formatted.slice(0, 3) + '-' + formatted.slice(3, 11) + '-' + formatted.slice(11, 15);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const formatted = formatMatricule(value);
    setMatricule(formatted);
    setError("");
  };

  const handleSearch = async () => {
    if (!matricule.trim()) {
      setError("Veuillez saisir un matricule");
      return;
    }

    if (!isValidFormat(matricule)) {
      setError("Format invalide. Exemple: PRX-20240125-A1B2");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`http://localhost:5000/api/pharmacy/by-matricule/${matricule}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Vérifier le Content-Type avant de parser en JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text());
        throw new Error("Le serveur a retourné une réponse invalide");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la recherche");
      }

      // Ajouter automatiquement toutes les prescriptions du patient au panier
      const prescriptionsToAdd = data.allPrescriptions || [data.prescription];
      const totalPrescriptions = data.totalPrescriptions || 1;

      if (totalPrescriptions > 1) {
        toast.success(`${totalPrescriptions} prescriptions trouvées pour ce patient !`);
      } else {
        toast.success("Prescription trouvée !");
      }

      console.log('🔍 Tentative d\'ajout au panier depuis MatriculeSearch');
      console.log(`📋 ${prescriptionsToAdd.length} prescription(s) à ajouter`);
      console.log('🛒 window.addToPharmacyCart existe?', typeof window.addToPharmacyCart);

      if (window.addToPharmacyCart && typeof window.addToPharmacyCart === 'function') {
        console.log('✅ Ajout des prescriptions au panier en cours...');
        try {
          let addedCount = 0;
          prescriptionsToAdd.forEach(prescription => {
            window.addToPharmacyCart(prescription);
            addedCount++;
          });
          console.log(`✅ ${addedCount} médicament(s) ajouté(s) au panier`);

          if (addedCount > 1) {
            toast.success(`${addedCount} médicaments ajoutés au panier`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout au panier:', error);
          toast.error('Erreur lors de l\'ajout au panier');
        }
      } else {
        console.warn('⚠️ window.addToPharmacyCart non disponible');
        toast.error('Fonction d\'ajout au panier non disponible');
      }

      onPrescriptionFound(data.prescription);
      setMatricule("");

    } catch (error) {
      console.error("Erreur recherche matricule:", error);
      const errorMessage =
        error.message.includes("404") ? "Aucune prescription trouvée avec ce matricule" :
        error.message.includes("409") ? "Cette prescription a déjà été traitée" :
        error.message || "Erreur lors de la recherche";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearInput = () => {
    setMatricule("");
    setError("");
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Search className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Recherche par Matricule
          </h2>
          <p className="text-sm text-gray-600">
            Saisissez le matricule pour ajouter toutes les prescriptions du patient au panier
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={matricule}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="PRX-20240125-A1B2"
              className={`w-full pl-12 pr-12 py-3 text-lg font-mono rounded-lg border-2 transition-colors ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : isValidFormat(matricule) && matricule
                  ? "border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200"
                  : "border-gray-200 bg-white focus:border-green-500 focus:ring-green-200"
              } focus:outline-none focus:ring-2`}
              maxLength={17} // PRX-YYYYMMDD-XXXX = 17 caractères
              disabled={searching || loading}
            />

            {matricule && (
              <button
                onClick={clearInput}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={searching || loading}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Indicateur de validation */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm">
              {matricule && (
                <>
                  {isValidFormat(matricule) ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Format valide</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600">Format: PRX-YYYYMMDD-XXXX</span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {matricule.length}/17
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Bouton de recherche */}
        <button
          onClick={handleSearch}
          disabled={searching || loading || !isValidFormat(matricule)}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            searching || loading || !isValidFormat(matricule)
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg"
          }`}
        >
          {searching ? (
            <>
              <Clock className="h-5 w-5 animate-pulse" />
              Recherche en cours...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Rechercher la prescription
            </>
          )}
        </button>
      </div>

      {/* Info d'aide */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Comment obtenir le matricule ?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Le patient reçoit le matricule du médecin</li>
          <li>• Le matricule est affiché sur l'ordonnance</li>
          <li>• Format: PRX-AAAAMMJJ-XXXX (année-mois-jour + code)</li>
          <li>• <strong>Toutes les prescriptions en attente du patient seront ajoutées au panier</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default MatriculeSearch;