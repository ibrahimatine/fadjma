import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { verificationService } from '../../services/verificationService';
import toast from 'react-hot-toast';
import VerificationModal from './VerificationModal';

const IntegrityButton = ({ record }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const verifyIntegrityMutation = useMutation(verificationService.verifyRecordIntegrity, {
    onSuccess: (data) => {
      setVerificationResult(data);
      setIsModalOpen(true);
    },
    onError: (err) => {
      toast.error(err.message || 'Erreur lors de la vérification de l\'intégrité.');
    },
  });

  const handleVerify = () => {
    verifyIntegrityMutation.mutate(record.id);
  };

  return (
    <>
      <button
        onClick={handleVerify}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
        disabled={verifyIntegrityMutation.isLoading}
      >
        {verifyIntegrityMutation.isLoading ? 'Vérification...' : 'Vérifier l\'intégrité'}
      </button>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={verificationResult}
      />
    </>
  );
};

export default IntegrityButton;