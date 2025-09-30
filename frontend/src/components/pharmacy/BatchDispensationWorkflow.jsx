import React, { useState } from 'react';
import {
  CheckCircle,
  User,
  Package,
  MessageSquare,
  FileText,
  Shield,
  Users,
  Pill,
  PenTool,
  Camera,
  Clock,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BatchDispensationWorkflow = ({ batchDispensation, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedPatients, setCompletedPatients] = useState({});
  const [batchData, setBatchData] = useState({});

  const { cartItems, groupedByPatient } = batchDispensation;
  const patientIds = Object.keys(groupedByPatient);
  const totalPatients = patientIds.length;
  const totalMedications = cartItems.length;

  const steps = [
    {
      id: 'batch-verification',
      title: 'Vérification Patients',
      icon: Users,
      description: 'Confirmer l\'identité de tous les patients'
    },
    {
      id: 'batch-preparation',
      title: 'Préparation Lot',
      icon: Package,
      description: 'Préparer tous les médicaments'
    },
    {
      id: 'batch-counseling',
      title: 'Conseil Groupé',
      icon: MessageSquare,
      description: 'Informations pour chaque patient'
    },
    {
      id: 'batch-delivery',
      title: 'Remise Groupée',
      icon: FileText,
      description: 'Distribution et signatures'
    },
    {
      id: 'batch-blockchain',
      title: 'Ancrage Blockchain',
      icon: Shield,
      description: 'Finalisation sur Hedera'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      // Ancrage blockchain réel pour tout le lot via API
      const blockchainResults = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const response = await api.put(`/pharmacy/deliver/${item.prescription.matricule}`, {
              batchMode: true,
              batchData,
              completedAt: new Date().toISOString()
            });

            return {
              matricule: item.prescription.matricule,
              success: response.data.success,
              hederaTransactionId: response.data.hederaInfo?.transactionId,
              isAnchored: response.data.hederaInfo?.isAnchored,
              medication: item.prescription.medication
            };
          } catch (error) {
            console.error(`Erreur ancrage ${item.prescription.matricule}:`, error);
            return {
              matricule: item.prescription.matricule,
              success: false,
              error: error.response?.data?.message || error.message,
              medication: item.prescription.medication
            };
          }
        })
      );

      // Vérifier les succès et échecs
      const successful = blockchainResults.filter(r => r.success).length;
      const failed = blockchainResults.filter(r => !r.success).length;

      if (failed === 0) {
        toast.success(`Dispensation en lot terminée avec succès ! ${successful} médicament(s) ancré(s) sur Hedera`);
      } else {
        toast.error(`${successful} succès, ${failed} échec(s). Vérifiez les détails.`);
      }

      onComplete({
        batchResults: blockchainResults,
        completedAt: new Date().toISOString(),
        totalItems: totalMedications,
        totalPatients,
        successful,
        failed
      });
    } catch (error) {
      console.error('Erreur lors de la dispensation en lot:', error);
      toast.error('Erreur lors de l\'ancrage blockchain du lot');
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'batch-verification':
        return <BatchVerification
          groupedByPatient={groupedByPatient}
          onNext={nextStep}
          onDataChange={(data) => setBatchData(prev => ({ ...prev, verification: data }))}
        />;

      case 'batch-preparation':
        return <BatchPreparation
          cartItems={cartItems}
          groupedByPatient={groupedByPatient}
          onNext={nextStep}
          onDataChange={(data) => setBatchData(prev => ({ ...prev, preparation: data }))}
        />;

      case 'batch-counseling':
        return <BatchCounseling
          groupedByPatient={groupedByPatient}
          onNext={nextStep}
          onDataChange={(data) => setBatchData(prev => ({ ...prev, counseling: data }))}
        />;

      case 'batch-delivery':
        return <BatchDelivery
          groupedByPatient={groupedByPatient}
          onNext={nextStep}
          onDataChange={(data) => setBatchData(prev => ({ ...prev, delivery: data }))}
        />;

      case 'batch-blockchain':
        return <BatchBlockchain
          cartItems={cartItems}
          batchData={batchData}
          onComplete={handleComplete}
        />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header avec résumé du lot */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dispensation en Lot</h2>
            <div className="flex items-center gap-6 mt-2 opacity-90">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{totalPatients} patient(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                <span>{totalMedications} médicament(s)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">Étape {currentStep + 1}/{steps.length}</div>
            <div className="text-sm opacity-90">Traitement groupé</div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isActive ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span className={`text-xs text-center font-medium ${
                  isActive ? 'text-blue-600' :
                  isCompleted ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Footer avec actions */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
        >
          Retourner au panier
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package className="h-4 w-4" />
          Dispensation groupée - {totalPatients} patient(s)
        </div>
      </div>
    </div>
  );
};

// Composant Vérification en lot
const BatchVerification = ({ groupedByPatient, onNext, onDataChange }) => {
  const [verifiedPatients, setVerifiedPatients] = useState({});

  const patientList = Object.entries(groupedByPatient);
  const allVerified = patientList.every(([patientId]) => verifiedPatients[patientId]);

  const handleVerifyPatient = (patientId) => {
    const newVerified = { ...verifiedPatients, [patientId]: true };
    setVerifiedPatients(newVerified);
    onDataChange({ verifiedPatients: newVerified });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Vérification des Patients</h3>
        <p className="text-gray-600">Confirmez l'identité de chaque patient</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patientList.map(([patientId, group]) => (
          <div key={patientId} className={`border-2 rounded-lg p-4 ${
            verifiedPatients[patientId] ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold">
                    {group.patient?.firstName} {group.patient?.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{group.patient?.email}</p>
                </div>
              </div>
              {verifiedPatients[patientId] && (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
            </div>

            <div className="text-sm text-gray-600 mb-3">
              {group.items.length} médicament(s) à dispenser
            </div>

            <button
              onClick={() => handleVerifyPatient(patientId)}
              disabled={verifiedPatients[patientId]}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                verifiedPatients[patientId]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {verifiedPatients[patientId] ? 'Vérifié' : 'Vérifier identité'}
            </button>
          </div>
        ))}
      </div>

      {allVerified && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5" />
            Tous les patients vérifiés
          </div>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuer vers la préparation
          </button>
        </div>
      )}
    </div>
  );
};

// Composant Préparation en lot
const BatchPreparation = ({ cartItems, groupedByPatient, onNext, onDataChange }) => {
  const [preparedItems, setPreparedItems] = useState({});

  const allPrepared = cartItems.every(item => preparedItems[item.prescription.matricule]);

  const handlePrepareItem = (matricule) => {
    const newPrepared = { ...preparedItems, [matricule]: true };
    setPreparedItems(newPrepared);
    onDataChange({ preparedItems: newPrepared });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Préparation du Lot</h3>
        <p className="text-gray-600">Préparez tous les médicaments</p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByPatient).map(([patientId, group]) => (
          <div key={patientId} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              {group.patient?.firstName} {group.patient?.lastName}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((item) => (
                <div key={item.prescription.matricule} className={`p-3 border rounded-lg ${
                  preparedItems[item.prescription.matricule] ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.prescription.medication}</div>
                      <div className="text-sm text-gray-600">{item.prescription.dosage} × {item.quantity}</div>
                    </div>
                    <button
                      onClick={() => handlePrepareItem(item.prescription.matricule)}
                      disabled={preparedItems[item.prescription.matricule]}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        preparedItems[item.prescription.matricule]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {preparedItems[item.prescription.matricule] ? '✓ Prêt' : 'Préparer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {allPrepared && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5" />
            Tous les médicaments préparés
          </div>
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuer vers le conseil
          </button>
        </div>
      )}
    </div>
  );
};

// Composants simplifiés pour les autres étapes
const BatchCounseling = ({ groupedByPatient, onNext, onDataChange }) => {
  const [counseledPatients, setCounseledPatients] = useState({});

  const patientList = Object.entries(groupedByPatient);
  const allCounseled = patientList.every(([patientId]) => counseledPatients[patientId]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Conseil Pharmaceutique Groupé</h3>
        <p className="text-gray-600">Conseils pour chaque patient</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patientList.map(([patientId, group]) => (
          <div key={patientId} className={`border-2 rounded-lg p-4 ${
            counseledPatients[patientId] ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            <h4 className="font-semibold mb-2">
              {group.patient?.firstName} {group.patient?.lastName}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {group.items.length} médicament(s) • Conseils donnés
            </p>
            <button
              onClick={() => {
                setCounseledPatients(prev => ({ ...prev, [patientId]: true }));
                onDataChange({ counseledPatients: { ...counseledPatients, [patientId]: true } });
              }}
              disabled={counseledPatients[patientId]}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                counseledPatients[patientId]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {counseledPatients[patientId] ? 'Conseils donnés' : 'Donner conseils'}
            </button>
          </div>
        ))}
      </div>

      {allCounseled && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuer vers la remise
          </button>
        </div>
      )}
    </div>
  );
};

const BatchDelivery = ({ groupedByPatient, onNext, onDataChange }) => {
  const [deliveredPatients, setDeliveredPatients] = useState({});

  const patientList = Object.entries(groupedByPatient);
  const allDelivered = patientList.every(([patientId]) => deliveredPatients[patientId]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Remise Groupée</h3>
        <p className="text-gray-600">Distribution et signatures</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patientList.map(([patientId, group]) => (
          <div key={patientId} className={`border-2 rounded-lg p-4 ${
            deliveredPatients[patientId] ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            <h4 className="font-semibold mb-2">
              {group.patient?.firstName} {group.patient?.lastName}
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-600" />
              <PenTool className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Photo + Signature</span>
            </div>
            <button
              onClick={() => {
                setDeliveredPatients(prev => ({ ...prev, [patientId]: true }));
                onDataChange({ deliveredPatients: { ...deliveredPatients, [patientId]: true } });
              }}
              disabled={deliveredPatients[patientId]}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                deliveredPatients[patientId]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {deliveredPatients[patientId] ? 'Remis et signé' : 'Finaliser remise'}
            </button>
          </div>
        ))}
      </div>

      {allDelivered && (
        <div className="text-center">
          <button
            onClick={onNext}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Finaliser sur blockchain
          </button>
        </div>
      )}
    </div>
  );
};

const BatchBlockchain = ({ cartItems, batchData, onComplete }) => {
  const [anchoring, setAnchoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState(0);

  const handleAnchor = async () => {
    setAnchoring(true);
    setProgress(0);
    setCurrentItem(0);

    // Simuler la progression pendant l'ancrage
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / cartItems.length) * 0.5;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 500);

    try {
      // Appel à la fonction parent qui fait les vrais appels API
      await onComplete();

      // Finaliser la progression
      clearInterval(progressInterval);
      setProgress(100);
    } catch (error) {
      clearInterval(progressInterval);
      setAnchoring(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ancrage Blockchain Final</h3>
        <p className="text-gray-600">Finalisation sur Hedera pour {cartItems.length} médicaments</p>
      </div>

      {/* Liste des médicaments à ancrer */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Médicaments du lot</h4>
        <div className="space-y-2">
          {cartItems.map((item, index) => (
            <div key={item.prescription.matricule} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {index + 1}. {item.prescription.medication} - {item.prescription.matricule}
              </span>
              {anchoring && progress >= ((index + 1) / cartItems.length) * 100 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {!anchoring ? (
        <div className="text-center">
          <button
            onClick={handleAnchor}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Ancrer le lot sur blockchain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="font-medium text-blue-900">Ancrage sur Hedera en cours...</span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-blue-700 mt-2">
              {Math.floor(progress)}% terminé
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDispensationWorkflow;