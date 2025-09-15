import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader } from 'lucide-react';
import { recordService } from '../../services/recordService';
import toast from 'react-hot-toast';

const IntegrityButton = ({ recordId, onVerified }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const verification = await recordService.verify(recordId);
      setResult(verification);
      
      if (verification.isValid) {
        toast.success('✅ Intégrité vérifiée sur Hedera');
      } else {
        toast.error('⚠️ Intégrité compromise');
      }
      
      if (onVerified) {
        onVerified(verification);
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleVerify}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${result === null ? 'bg-primary-600 hover:bg-primary-700 text-white' : ''}
          ${result?.isValid === true ? 'bg-green-600 text-white' : ''}
          ${result?.isValid === false ? 'bg-red-600 text-white' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Vérification...
          </>
        ) : result ? (
          <>
            {result.isValid ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {result.isValid ? 'Intégrité confirmée' : 'Intégrité compromise'}
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Proof of Integrity
          </>
        )}
      </button>

      {result && (
        <div className="text-xs text-gray-600">
          <div>Hash: {result.currentHash.substring(0, 16)}...</div>
          {result.hederaTransactionId && (
            <div>Hedera ID: {result.hederaTransactionId}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrityButton;