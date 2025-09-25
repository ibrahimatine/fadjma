import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  User,
  Pill,
  MessageSquare,
  FileText,
  Shield,
  Camera,
  QrCode,
  AlertCircle,
  Phone,
  Scan,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PharmaceuticalCounseling,
  SecureDelivery,
  BlockchainFinalization
} from './DispensationSteps';

const DispensationWorkflow = ({ prescription, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const steps = [
    {
      id: 'verification',
      title: 'Vérification Patient',
      icon: User,
      duration: 60,
      description: 'Confirmer l\'identité du patient'
    },
    {
      id: 'preparation',
      title: 'Préparation Médicament',
      icon: Pill,
      duration: 180,
      description: 'Scanner et préparer le médicament'
    },
    {
      id: 'counseling',
      title: 'Conseil Pharmaceutique',
      icon: MessageSquare,
      duration: 120,
      description: 'Expliquer la posologie et précautions'
    },
    {
      id: 'delivery',
      title: 'Remise Sécurisée',
      icon: FileText,
      duration: 90,
      description: 'Signature et remise au patient'
    },
    {
      id: 'blockchain',
      title: 'Ancrage Blockchain',
      icon: Shield,
      duration: 10,
      description: 'Finalisation sur Hedera'
    }
  ];

  // Timer pour chaque étape
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimer(0);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Ancrage final sur blockchain
      await finalizeDispensation();
      toast.success('Dispensation terminée avec succès !');
      onComplete({
        ...prescription,
        dispensationData: stepData,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      toast.error('Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  const finalizeDispensation = async () => {
    // Simulation ancrage Hedera
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          hederaTransactionId: 'HCS-' + Date.now(),
          hash: 'sha256_hash_' + Math.random().toString(36).substr(2, 9)
        });
      }, 2000);
    });
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'verification':
        return <PatientVerification
          prescription={prescription}
          onNext={nextStep}
          onDataChange={(data) => setStepData(prev => ({ ...prev, verification: data }))}
        />;

      case 'preparation':
        return <MedicationPreparation
          prescription={prescription}
          onNext={nextStep}
          onDataChange={(data) => setStepData(prev => ({ ...prev, preparation: data }))}
        />;

      case 'counseling':
        return <PharmaceuticalCounseling
          prescription={prescription}
          onNext={nextStep}
          onDataChange={(data) => setStepData(prev => ({ ...prev, counseling: data }))}
        />;

      case 'delivery':
        return <SecureDelivery
          prescription={prescription}
          onNext={nextStep}
          onDataChange={(data) => setStepData(prev => ({ ...prev, delivery: data }))}
        />;

      case 'blockchain':
        return <BlockchainFinalization
          prescription={prescription}
          stepData={stepData}
          onComplete={handleComplete}
          loading={loading}
        />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header avec informations prescription */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Processus de Dispensation</h2>
            <p className="opacity-90">Matricule: {prescription.matricule}</p>
            <p className="opacity-90">Patient: {prescription.patient?.firstName} {prescription.patient?.lastName}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatTime(timer)}</div>
            <div className="text-sm opacity-90">Temps écoulé</div>
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
                <span className="text-xs text-gray-400">
                  ~{Math.floor(step.duration / 60)}min
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
          Annuler
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          Étape {currentStep + 1} sur {steps.length}
        </div>
      </div>
    </div>
  );
};

// Composant Vérification Patient
const PatientVerification = ({ prescription, onNext, onDataChange }) => {
  const [verificationMethod, setVerificationMethod] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  const sendOTP = async () => {
    // Simulation envoi OTP
    setOtpSent(true);
    toast.success('Code OTP envoyé au patient');
    onDataChange({ method: verificationMethod, idNumber, otpSent: true });
  };

  const verifyOTP = () => {
    if (otpCode === '1234') { // Code de test
      setVerified(true);
      toast.success('Patient vérifié avec succès');
      onDataChange({
        method: verificationMethod,
        idNumber,
        otpVerified: true,
        timestamp: new Date().toISOString()
      });
    } else {
      toast.error('Code OTP incorrect');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Vérification de l'identité du patient</h3>
        <p className="text-gray-600">Confirmez que le patient présent correspond à la prescription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations patient */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Informations prescription</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Nom:</strong> {prescription.patient?.firstName} {prescription.patient?.lastName}</div>
            <div><strong>Email:</strong> {prescription.patient?.email}</div>
            <div><strong>Médicament:</strong> {prescription.medication}</div>
            <div><strong>Dosage:</strong> {prescription.dosage}</div>
          </div>
        </div>

        {/* Processus de vérification */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Méthode de vérification</label>
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une méthode</option>
              <option value="id_card">Carte d'identité</option>
              <option value="insurance">Carte mutuelle</option>
              <option value="phone_otp">SMS + Code OTP</option>
            </select>
          </div>

          {verificationMethod && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Numéro d'identification
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Entrer le numéro de la pièce d'identité"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {verificationMethod === 'phone_otp' && idNumber && (
            <div className="space-y-3">
              {!otpSent ? (
                <button
                  onClick={sendOTP}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Envoyer code OTP
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-5 w-5" />
                      Code envoyé au {prescription.patient?.email || 'patient'}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Code à 4 chiffres (test: 1234)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={4}
                  />

                  <button
                    onClick={verifyOTP}
                    disabled={otpCode.length !== 4}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Vérifier le code
                  </button>
                </div>
              )}
            </div>
          )}

          {(verificationMethod && verificationMethod !== 'phone_otp' && idNumber) && (
            <button
              onClick={() => {
                setVerified(true);
                onDataChange({
                  method: verificationMethod,
                  idNumber,
                  timestamp: new Date().toISOString()
                });
                toast.success('Vérification manuelle confirmée');
              }}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirmer la vérification
            </button>
          )}
        </div>
      </div>

      {verified && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5" />
            Patient vérifié avec succès
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

// Composant Préparation Médicament
const MedicationPreparation = ({ prescription, onNext, onDataChange }) => {
  const [checks, setChecks] = useState({
    scanned: false,
    batchVerified: false,
    quantityChecked: false,
    packagingOk: false,
    labelPrinted: false
  });

  const [medicationData, setMedicationData] = useState({
    scannedCode: '',
    batchNumber: '',
    expiryDate: '',
    quantity: prescription.quantity || 0
  });

  const handleCheck = (checkName) => {
    const newChecks = { ...checks, [checkName]: true };
    setChecks(newChecks);
    onDataChange({ checks: newChecks, medicationData });
  };

  const allChecksComplete = Object.values(checks).every(check => check);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Préparation du médicament</h3>
        <p className="text-gray-600">Suivez les étapes de contrôle qualité</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations prescription */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-900">À préparer</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Médicament:</strong> {prescription.medication}</div>
            <div><strong>Dosage:</strong> {prescription.dosage}</div>
            <div><strong>Quantité:</strong> {prescription.quantity}</div>
            <div><strong>Instructions:</strong> {prescription.instructions}</div>
          </div>
        </div>

        {/* Checklist préparation */}
        <div className="space-y-4">
          {/* Scanner code-barre */}
          <div className={`p-4 border-2 rounded-lg ${checks.scanned ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">1. Scanner le médicament</span>
              {checks.scanned && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Code-barre du médicament"
                value={medicationData.scannedCode}
                onChange={(e) => setMedicationData({...medicationData, scannedCode: e.target.value})}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={() => handleCheck('scanned')}
                disabled={checks.scanned}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Scan className="h-4 w-4" />
                Scanner
              </button>
            </div>
          </div>

          {/* Vérifier lot et péremption */}
          <div className={`p-4 border-2 rounded-lg ${checks.batchVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">2. Vérifier lot et péremption</span>
              {checks.batchVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                placeholder="N° de lot"
                value={medicationData.batchNumber}
                onChange={(e) => setMedicationData({...medicationData, batchNumber: e.target.value})}
                className="p-2 border rounded"
              />
              <input
                type="date"
                value={medicationData.expiryDate}
                onChange={(e) => setMedicationData({...medicationData, expiryDate: e.target.value})}
                className="p-2 border rounded"
              />
            </div>
            <button
              onClick={() => handleCheck('batchVerified')}
              disabled={checks.batchVerified}
              className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Vérifier lot
            </button>
          </div>

          {/* Compter quantité */}
          <div className={`p-4 border-2 rounded-lg ${checks.quantityChecked ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">3. Compter la quantité</span>
              {checks.quantityChecked && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div className="flex gap-2">
              <span className="py-2">Prescrit: {prescription.quantity}</span>
              <input
                type="number"
                placeholder="Quantité comptée"
                value={medicationData.quantity}
                onChange={(e) => setMedicationData({...medicationData, quantity: parseInt(e.target.value) || 0})}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={() => handleCheck('quantityChecked')}
                disabled={checks.quantityChecked}
                className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Valider
              </button>
            </div>
          </div>

          {/* Vérifier emballage */}
          <div className={`p-4 border-2 rounded-lg ${checks.packagingOk ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">4. Vérifier l'emballage</span>
              {checks.packagingOk && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <button
              onClick={() => handleCheck('packagingOk')}
              disabled={checks.packagingOk}
              className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 disabled:opacity-50"
            >
              Emballage intact
            </button>
          </div>

          {/* Imprimer étiquette */}
          <div className={`p-4 border-2 rounded-lg ${checks.labelPrinted ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">5. Imprimer étiquette patient</span>
              {checks.labelPrinted && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <button
              onClick={() => handleCheck('labelPrinted')}
              disabled={checks.labelPrinted}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Imprimer étiquette
            </button>
          </div>
        </div>
      </div>

      {allChecksComplete && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5" />
            Médicament préparé et vérifié
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

export default DispensationWorkflow;