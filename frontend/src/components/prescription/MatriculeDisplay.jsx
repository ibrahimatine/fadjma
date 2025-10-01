import React, { useState } from "react";
import { Copy, Eye, EyeOff, QrCode, Info, CheckCircle, AlertTriangle, Share2, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

const MatriculeDisplay = ({
  matricule,
  userRole,
  prescriptionStatus = 'pending',
  onShare,
  showQRCode = false,
  showInstructions = true,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const [copied, setCopied] = useState(false);
  const [showMatricule, setShowMatricule] = useState(true);
  const [showQR, setShowQR] = useState(false);

  if (!matricule) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Matricule en cours de génération...</span>
        </div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(matricule);
      setCopied(true);
      toast.success('Matricule copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Impossible de copier le matricule');
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(matricule);
    } else if (navigator.share) {
      navigator.share({
        title: 'Matricule de prescription',
        text: `Matricule: ${matricule}`,
      }).catch(() => {
        toast.error('Partage annulé');
      });
    } else {
      handleCopy();
    }
  };

  const toggleMatriculeVisibility = () => {
    setShowMatricule(!showMatricule);
  };

  const maskMatricule = (matricule) => {
    const parts = matricule.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-**${parts[2].slice(-2)}`;
    }
    return 'PRX-****-****';
  };

  const getInstructionsByRole = () => {
    switch (userRole) {
      case 'doctor':
        return {
          title: "Instructions pour le médecin",
          items: [
            "Transmettez ce matricule à votre patient",
            "Le patient devra le communiquer au pharmacien",
            "Gardez une copie pour votre dossier médical"
          ],
          context: "Partagez ce matricule avec votre patient"
        };
      case 'patient':
        return {
          title: "Instructions pour le patient",
          items: [
            "Présentez ce matricule à votre pharmacien",
            "Vous pouvez le montrer ou le dicter",
            "Gardez-le confidentiel"
          ],
          context: "Communiquez ce code à la pharmacie"
        };
      default:
        return {
          title: "Instructions",
          items: ["Utilisez ce matricule pour identifier la prescription"],
          context: "Matricule de prescription"
        };
    }
  };

  const instructions = getInstructionsByRole();

  const sizeClasses = {
    small: {
      container: "p-3",
      matricule: "text-lg",
      title: "text-sm",
      button: "p-2 text-xs",
      icon: "h-4 w-4"
    },
    normal: {
      container: "p-4",
      matricule: "text-xl",
      title: "text-base",
      button: "px-3 py-2 text-sm",
      icon: "h-5 w-5"
    },
    large: {
      container: "p-6",
      matricule: "text-2xl",
      title: "text-lg",
      button: "px-4 py-3 text-base",
      icon: "h-6 w-6"
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.normal;

  return (
    <div className={`bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl ${currentSize.container}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <QrCode className={`${currentSize.icon} text-green-600`} />
          </div>
          <div>
            <h3 className={`${currentSize.title} font-semibold text-gray-900`}>
              Matricule de prescription
            </h3>
            <p className="text-xs text-gray-600">{instructions.context}</p>
          </div>
        </div>

        {prescriptionStatus === 'delivered' && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <CheckCircle className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-600">Délivrée</span>
          </div>
        )}
      </div>

      {/* Matricule */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-3 bg-white border-2 border-dashed border-green-300 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMatriculeVisibility}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title={showMatricule ? "Masquer" : "Afficher"}
            >
              {showMatricule ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            <span className={`${currentSize.matricule} font-mono font-bold text-gray-900 select-all`}>
              {showMatricule ? matricule : maskMatricule(matricule)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 ${currentSize.button} rounded-lg transition-all ${
                copied
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Copier le matricule"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copié!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier
                </>
              )}
            </button>

            {(userRole === 'patient' || userRole === 'doctor') && (
              <button
                onClick={handleShare}
                className={`flex items-center gap-1 ${currentSize.button} bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors`}
                title="Partager"
              >
                <Share2 className="h-4 w-4" />
                Partager
              </button>
            )}
          </div>
        </div>

        {/* Format info */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Format: PRX-AAAAMMJJ-XXXX (Année-Mois-Jour + Code unique)
        </p>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="bg-white bg-opacity-60 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <h4 className="text-sm font-medium text-gray-900">{instructions.title}</h4>
          </div>
          <ul className="text-sm text-gray-700 space-y-1 ml-6">
            {instructions.items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {userRole === 'patient' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Smartphone className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Astuce :</strong> Prenez une capture d'écran ou notez ce matricule avant de vous rendre en pharmacie.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code section (optionnel) */}
      {showQRCode && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            {showQR ? 'Masquer QR Code' : 'Afficher QR Code'}
          </button>

          {showQR && (
            <div className="mt-2 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(matricule)}`}
                alt="QR Code du matricule"
                className="mx-auto border border-gray-200 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-2">
                Scannez ce QR Code avec votre téléphone
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status info */}
      {prescriptionStatus === 'delivered' && (
        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600 text-center">
            Cette prescription a été délivrée. Le matricule reste visible à titre informatif.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatriculeDisplay;