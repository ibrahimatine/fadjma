import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader, Package, Zap, TrendingDown } from 'lucide-react';
import { recordService } from '../../services/recordService';
import toast from 'react-hot-toast';

const IntegrityButton = ({ recordId, onVerified, showDetails = false }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const verification = await recordService.verify(recordId);
      setResult(verification);

      if (verification.verified || verification.isValid) {
        const batchedMsg = verification.batchVerification?.valid ? ' (Batché ✅)' : '';
        const compressedMsg = verification.compressed ? ' (Compressé ⚡)' : '';
        toast.success(`✅ Intégrité vérifiée sur Hedera${batchedMsg}${compressedMsg}`);
      } else {
        toast.error('⚠️ Intégrité compromise - Les données ont été modifiées');
      }

      if (onVerified) {
        onVerified(verification);
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const isVerified = result?.verified || result?.isValid;
  const isBatched = result?.batchVerification?.valid || result?.batched;
  const isCompressed = result?.compressed;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleVerify}
          disabled={loading}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
            ${result === null ? 'bg-primary-600 hover:bg-primary-700 text-white' : ''}
            ${isVerified === true ? 'bg-green-600 text-white' : ''}
            ${isVerified === false ? 'bg-red-600 text-white' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Vérification en cours...
            </>
          ) : result ? (
            <>
              {isVerified ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {isVerified ? 'Intégrité Confirmée ✓' : 'Données Modifiées ✗'}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Vérifier Proof of Integrity
            </>
          )}
        </button>

        {/* Badges d'optimisation */}
        {result && isVerified && (
          <div className="flex items-center gap-2">
            {isBatched && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded flex items-center gap-1">
                <Package className="h-3 w-3" />
                Batché
              </span>
            )}
            {isCompressed && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Compressé
              </span>
            )}
            {result.proofOfIntegrity?.costSavings && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                {result.proofOfIntegrity.costSavings}
              </span>
            )}
          </div>
        )}

        {showDetails && result && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {expanded ? 'Masquer' : 'Voir'} détails
          </button>
        )}
      </div>

      {/* Détails de vérification */}
      {result && expanded && showDetails && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-2">
          {/* Vérification locale */}
          <div>
            <p className="font-medium text-gray-700 mb-1">🔐 Vérification Locale:</p>
            <div className="pl-3 space-y-1">
              <div className="flex items-center gap-1">
                {result.localVerification?.valid ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-600" />
                )}
                <span className={result.localVerification?.valid ? 'text-green-700' : 'text-red-700'}>
                  Hash {result.localVerification?.valid ? 'correspond' : 'ne correspond pas'}
                </span>
              </div>
              {result.localVerification?.hash && (
                <div className="text-gray-600 font-mono text-xs truncate">
                  {result.localVerification.hash.substring(0, 32)}...
                </div>
              )}
            </div>
          </div>

          {/* Vérification Hedera */}
          <div>
            <p className="font-medium text-gray-700 mb-1">🌐 Vérification Hedera:</p>
            <div className="pl-3 space-y-1">
              {result.hederaVerification && (
                <>
                  <div className="flex items-center gap-1">
                    {result.hederaVerification.valid ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={result.hederaVerification.valid ? 'text-green-700' : 'text-red-700'}>
                      Transaction {result.hederaVerification.valid ? 'vérifiée' : 'non trouvée'}
                    </span>
                  </div>
                  {result.hederaVerification.consensusTimestamp && (
                    <div className="text-gray-600">
                      Timestamp: {new Date(result.hederaVerification.consensusTimestamp).toLocaleString('fr-FR')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Vérification Batch si applicable */}
          {isBatched && result.batchVerification && (
            <div>
              <p className="font-medium text-purple-700 mb-1">📦 Vérification Batch:</p>
              <div className="pl-3 space-y-1">
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-purple-600" />
                  <span className="text-purple-700">
                    Batch ID: {result.batchVerification.batchId?.substring(0, 16)}...
                  </span>
                </div>
                <div className="text-gray-600">
                  Position: #{result.batchVerification.itemIndex + 1} / {result.batchVerification.totalItems}
                </div>
                {result.merkleProof?.valid !== undefined && (
                  <div className="flex items-center gap-1">
                    {result.merkleProof.valid ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className={result.merkleProof.valid ? 'text-green-700' : 'text-red-700'}>
                      Preuve Merkle {result.merkleProof.valid ? 'valide' : 'invalide'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Garanties */}
          {result.proofOfIntegrity && (
            <div className="pt-2 border-t border-gray-300">
              <p className="font-medium text-gray-700 mb-1">✅ Garanties:</p>
              <div className="grid grid-cols-2 gap-1 pl-3">
                {Object.entries(result.proofOfIntegrity)
                  .filter(([_, value]) => typeof value === 'boolean' && value)
                  .map(([key, _]) => (
                    <div key={key} className="flex items-center gap-1 text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrityButton;