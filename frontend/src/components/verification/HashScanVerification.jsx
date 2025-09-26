// Composant pour afficher les liens de vérification HashScan
import React from 'react';
import { ExternalLink, Shield, Hash, Clock } from 'lucide-react';

const HashScanVerification = ({
  verification,
  recordHash,
  timestamp,
  compact = false,
  className = ""
}) => {
  if (!verification) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-yellow-700">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Vérification en cours...</span>
        </div>
      </div>
    );
  }

  // Version compacte pour tableaux
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => window.open(verification.topicUrl, '_blank')}
          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs transition-colors"
          title="Voir sur HashScan Testnet"
        >
          <ExternalLink className="h-3 w-3" />
          Vérifier
        </button>
      </div>
    );
  }

  // Version complète pour pages détaillées
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-green-600" />
        <h4 className="font-semibold text-green-800">Vérification Blockchain</h4>
      </div>

      <div className="space-y-3">
        {/* Hash du record */}
        {recordHash && (
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-gray-500 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">Hash cryptographique</p>
              <p className="text-xs text-gray-600 font-mono break-all bg-gray-100 p-1 rounded">
                {recordHash}
              </p>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <span className="text-sm font-medium text-gray-700">Horodatage : </span>
              <span className="text-sm text-gray-600">
                {new Date(timestamp).toLocaleString('fr-FR')}
              </span>
            </div>
          </div>
        )}

        {/* Liens HashScan */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-green-200">
          {verification.topicUrl && (
            <a
              href={verification.topicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Voir Topic Hedera
            </a>
          )}

          {verification.messageUrl && verification.messageUrl !== verification.topicUrl && (
            <a
              href={verification.messageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Message Spécifique
            </a>
          )}

          {verification.transactionUrl && (
            <a
              href={verification.transactionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Transaction
            </a>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
          <p className="text-xs text-blue-800 font-medium mb-1">💡 Comment vérifier :</p>
          <ol className="text-xs text-blue-700 space-y-1 ml-3">
            <li>1. Cliquez sur "Voir Topic Hedera" pour accéder à HashScan</li>
            <li>2. Recherchez le message avec ce hash dans les contenus</li>
            <li>3. Vérifiez que l'horodatage correspond</li>
            <li>4. Le consensus Hedera garantit l'immutabilité</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

// Composant spécialisé pour les prescriptions
export const PrescriptionVerification = ({ prescription }) => {
  return (
    <HashScanVerification
      verification={prescription.verification}
      recordHash={prescription.deliveryConfirmationHash}
      timestamp={prescription.hederaTimestamp}
      className="mt-4"
    />
  );
};

// Composant spécialisé pour les dossiers médicaux
export const MedicalRecordVerification = ({ record }) => {
  return (
    <HashScanVerification
      verification={record.verification}
      recordHash={record.hash}
      timestamp={record.hederaTimestamp}
    />
  );
};

// Composant spécialisé pour les NFT de vaccination
export const VaccinationNFTVerification = ({ nft }) => {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-purple-600" />
        <h4 className="font-semibold text-purple-800">Certificat NFT Vérifié</h4>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-purple-700">
          Ce certificat de vaccination est ancré sur la blockchain Hedera
        </p>

        {nft.hederaAnchor && (
          <div className="flex flex-wrap gap-2">
            <a
              href={nft.hederaAnchor.topicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Vérifier sur HashScan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HashScanVerification;