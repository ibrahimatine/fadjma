// src/components/pharmacy/OrdonnanceSearch.jsx
import React, { useState } from "react";
import { Search, X, AlertTriangle, CheckCircle, FileText, Pill } from "lucide-react";
import toast from "react-hot-toast";

const OrdonnanceSearch = ({ onOrdonnanceFound }) => {
  const [matricule, setMatricule] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Validation du format matricule en temps réel (4-8 caractères pour compatibilité)
  const isValidFormat = (value) => {
    return /^ORD-\d{8}-[A-F0-9]{4,8}$/.test(value);
  };

  const formatMatricule = (value) => {
    // Supprimer tous les caractères non alphanumériques
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Ajouter ORD- au début si pas présent
    let formatted = clean.startsWith('ORD') ? clean : 'ORD' + clean;

    // Formater selon le pattern ORD-YYYYMMDD-XXXX ou ORD-YYYYMMDD-XXXXXXXX
    if (formatted.length <= 3) return formatted;
    if (formatted.length <= 11) return formatted.slice(0, 3) + '-' + formatted.slice(3);
    // Accepte de 4 à 8 caractères hexadécimaux
    return formatted.slice(0, 3) + '-' + formatted.slice(3, 11) + '-' + formatted.slice(11, Math.min(19, formatted.length));
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const formatted = formatMatricule(value);
    setMatricule(formatted);
    setError("");
    setResult(null);
  };

  const handleSearch = async () => {
    if (!matricule.trim()) {
      setError("Veuillez saisir un matricule d'ordonnance");
      return;
    }

    if (!isValidFormat(matricule)) {
      setError("Format invalide. Exemple: ORD-20240125-A1B2 ou ORD-20240125-A1B2C3D4");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      const response = await fetch(`http://localhost:5000/api/pharmacy/by-ordonnance/${matricule}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON:", await response.text());
        throw new Error("Le serveur a retourné une réponse invalide");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la recherche");
      }

      toast.success(`${data.totalMedications} médicament(s) trouvé(s) !`);
      setResult(data);

      if (onOrdonnanceFound) {
        onOrdonnanceFound(data);
      }

    } catch (error) {
      console.error("Erreur recherche ordonnance:", error);
      const errorMessage =
        error.message.includes("404") ? "Aucune ordonnance trouvée avec ce matricule" :
        error.message.includes("400") ? "Ce matricule ne correspond pas à une ordonnance" :
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
    setResult(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      {/* En-tête */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recherche par Matricule d'Ordonnance
            </h2>
            <p className="text-sm text-gray-600">
              Saisissez le matricule de l'ordonnance pour voir tous les médicaments
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-6 space-y-4">
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={matricule}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="ORD-20240125-A1B2 ou ORD-20240125-A1B2C3D4"
              className={`w-full pl-12 pr-12 py-3 text-lg font-mono rounded-lg border-2 transition-colors ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : isValidFormat(matricule) && matricule
                  ? "border-blue-300 bg-blue-50 focus:border-blue-500 focus:ring-blue-200"
                  : "border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-200"
              } focus:outline-none focus:ring-2`}
              maxLength={21} // Max 21 pour 8 caractères hex
              disabled={searching}
            />

            {matricule && (
              <button
                onClick={clearInput}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={searching}
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
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-600">Format valide</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600">Format: ORD-YYYYMMDD-XXXX ou ORD-YYYYMMDD-XXXXXXXX</span>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {matricule.length}/21
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
          disabled={searching || !isValidFormat(matricule)}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            searching || !isValidFormat(matricule)
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
          }`}
        >
          {searching ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Recherche en cours...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Rechercher l'ordonnance
            </>
          )}
        </button>
      </div>

      {/* Résultats */}
      {result && (
        <div className="p-6 border-t bg-gray-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ordonnance trouvée
            </h3>
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">
                    {result.ordonnance.patient.firstName} {result.ordonnance.patient.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Médecin:</span>
                  <span className="ml-2 font-medium">
                    Dr. {result.ordonnance.doctor.firstName} {result.ordonnance.doctor.lastName}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Titre:</span>
                  <span className="ml-2 font-medium">{result.ordonnance.title}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-600" />
              Médicaments ({result.totalMedications})
            </h4>
            <div className="space-y-2">
              {result.medications.map((med) => (
                <div key={med.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">{med.medication}</h5>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {med.matricule}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><strong>Dosage:</strong> {med.dosage}</div>
                    <div><strong>Quantité:</strong> {med.quantity}</div>
                    {med.instructions && (
                      <div className="col-span-2">
                        <strong>Instructions:</strong> {med.instructions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info d'aide */}
      <div className="p-6 border-t bg-blue-50">
        <h4 className="font-medium text-blue-900 mb-2">À propos du matricule d'ordonnance</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Le matricule d'ordonnance (ORD-...) regroupe tous les médicaments</li>
          <li>• Chaque médicament a son propre matricule (PRX-...)</li>
          <li>• Format: ORD-AAAAMMJJ-XXXX (ancien) ou ORD-AAAAMMJJ-XXXXXXXX (nouveau)</li>
        </ul>
      </div>
    </div>
  );
};

export default OrdonnanceSearch;
