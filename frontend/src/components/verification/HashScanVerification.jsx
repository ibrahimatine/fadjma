// Composant pour afficher les liens de vérification HashScan
import React, { useState } from 'react';
import { ExternalLink, Shield, Hash, Clock, CheckCircle, Package, Zap, TrendingDown } from 'lucide-react';

const HashScanVerification = ({
  verification,
  recordHash,
  timestamp,
  compact = false,
  className = "",
  // Nouvelles props pour hash-only + batching
  batched = false,
  batchInfo = null,
  compressed = false,
  optimizationStats = null
}) => {
  const [showDetails, setShowDetails] = useState(false);

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
      {/* En-tête */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-green-800">Proof of Integrity</h4>
        </div>

        {/* Badges d'optimisation */}
        <div className="flex items-center gap-2">
          {batched && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
              <Package className="h-3 w-3" />
              Batché
            </span>
          )}
          {compressed && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Compressé
            </span>
          )}
          {optimizationStats && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              -{optimizationStats.savingsPercent}%
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Mode Hash-Only Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-800 mb-1">
                🔐 Confidentialité maximale - Hash Only
              </p>
              <p className="text-xs text-blue-700">
                Seul le hash cryptographique est ancré sur Hedera. Vos données médicales
                restent privées et sécurisées dans votre base de données.
              </p>
            </div>
          </div>
        </div>

        {/* Hash du record */}
        {recordHash && (
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-gray-500 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">Hash SHA-256</p>
              <p className="text-xs text-gray-600 font-mono break-all bg-gray-100 p-2 rounded">
                {recordHash}
              </p>
            </div>
          </div>
        )}

        {/* Info Batch si applicable */}
        {batched && batchInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-800 mb-2">
              📦 Optimisation par batch (Merkle Tree)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-purple-700 font-medium">Batch ID:</span>
                <p className="text-purple-600 font-mono truncate">{batchInfo.batchId}</p>
              </div>
              <div>
                <span className="text-purple-700 font-medium">Items:</span>
                <p className="text-purple-600">{batchInfo.itemCount} enregistrements</p>
              </div>
              <div>
                <span className="text-purple-700 font-medium">Position:</span>
                <p className="text-purple-600">#{batchInfo.index + 1} / {batchInfo.itemCount}</p>
              </div>
              <div>
                <span className="text-purple-700 font-medium">Économie:</span>
                <p className="text-purple-600 font-semibold">~98%</p>
              </div>
            </div>

            {showDetails && batchInfo.merkleProof && (
              <div className="mt-2 pt-2 border-t border-purple-200">
                <p className="text-xs text-purple-700 mb-1">Preuve Merkle ({batchInfo.merkleProof.length} étapes):</p>
                <div className="bg-white bg-opacity-50 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {batchInfo.merkleProof.map((proof, idx) => (
                    <div key={idx} className="text-purple-600 truncate">
                      {idx + 1}. {proof.position}: {proof.hash.substring(0, 32)}...
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
            >
              {showDetails ? 'Masquer' : 'Voir'} les détails de la preuve
            </button>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <span className="text-sm font-medium text-gray-700">Horodatage consensus : </span>
              <span className="text-sm text-gray-600">
                {new Date(timestamp).toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'long'
                })}
              </span>
            </div>
          </div>
        )}

        {/* Statistiques d'optimisation */}
        {optimizationStats && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-800 mb-2">💰 Optimisations appliquées:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Taille originale:</span>
                <p className="font-medium text-gray-800">{optimizationStats.originalSize} bytes</p>
              </div>
              <div>
                <span className="text-gray-600">Taille finale:</span>
                <p className="font-medium text-green-700">{optimizationStats.finalSize} bytes</p>
              </div>
              <div>
                <span className="text-gray-600">Compression:</span>
                <p className="font-medium text-blue-700">{compressed ? 'Activée' : 'Non'}</p>
              </div>
              <div>
                <span className="text-gray-600">Économie totale:</span>
                <p className="font-medium text-green-700 text-base">{optimizationStats.savingsPercent}%</p>
              </div>
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
              {batched ? 'Voir Batch Hedera' : 'Voir Topic Hedera'}
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
          <p className="text-xs text-blue-800 font-medium mb-1">💡 Comment fonctionne la vérification :</p>
          <ol className="text-xs text-blue-700 space-y-1 ml-3">
            <li>1. Le hash SHA-256 de vos données est calculé et ancré sur Hedera</li>
            <li>2. {batched ? 'Votre hash est inclus dans un batch via Merkle Tree pour économiser 98%' : 'Votre hash est ancré directement'}</li>
            <li>3. Le consensus Hedera (Byzantine Fault Tolerance) garantit l'immutabilité</li>
            <li>4. Vérification publique possible via HashScan sans révéler vos données</li>
            <li>5. {compressed && 'Compression gzip appliquée pour réduire les coûts de ~60%'}</li>
          </ol>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-3 w-3" />
            <span>Immutable</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-3 w-3" />
            <span>Horodaté</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-3 w-3" />
            <span>Infalsifiable</span>
          </div>
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle className="h-3 w-3" />
            <span>Vérifiable</span>
          </div>
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