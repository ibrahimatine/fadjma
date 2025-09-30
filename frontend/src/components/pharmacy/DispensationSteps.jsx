import React, { useState } from 'react';
import {
  CheckCircle,
  MessageSquare,
  FileText,
  Shield,
  Camera,
  QrCode,
  AlertCircle,
  Download,
  PenTool,
  Clock,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

// Composant Conseil Pharmaceutique
export const PharmaceuticalCounseling = ({ prescription, onNext, onDataChange }) => {
  const [counselingPoints, setCounselingPoints] = useState({
    posology: false,
    sideEffects: false,
    interactions: false,
    storage: false,
    missedDose: false
  });

  const [patientQuestions, setPatientQuestions] = useState('');
  const [leafletGiven, setLeafletGiven] = useState(false);
  const [understandingConfirmed, setUnderstandingConfirmed] = useState(false);

  const counselingItems = [
    {
      key: 'posology',
      title: 'Posologie et rythme de prise',
      description: 'Expliquer quand et comment prendre le médicament',
      color: 'blue'
    },
    {
      key: 'sideEffects',
      title: 'Effets secondaires principaux',
      description: 'Informer sur les effets indésirables possibles',
      color: 'orange'
    },
    {
      key: 'interactions',
      title: 'Interactions médicamenteuses/alimentaires',
      description: 'Précautions avec autres médicaments ou aliments',
      color: 'red'
    },
    {
      key: 'storage',
      title: 'Conservation du médicament',
      description: 'Conditions de stockage appropriées',
      color: 'green'
    },
    {
      key: 'missedDose',
      title: 'Conduite en cas d\'oubli',
      description: 'Que faire si une dose est oubliée',
      color: 'purple'
    }
  ];

  const handlePointCheck = (key) => {
    const newPoints = { ...counselingPoints, [key]: true };
    setCounselingPoints(newPoints);
    onDataChange({
      counselingPoints: newPoints,
      patientQuestions,
      leafletGiven,
      understandingConfirmed
    });
  };

  const allPointsCovered = Object.values(counselingPoints).every(point => point);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Conseil Pharmaceutique</h3>
        <p className="text-gray-600">Informations essentielles à communiquer au patient</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations médicament */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-900">Médicament prescrit</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Nom:</strong> {prescription.medication}</div>
            <div><strong>Dosage:</strong> {prescription.dosage}</div>
            <div><strong>Instructions:</strong> {prescription.instructions}</div>
            <div><strong>Quantité:</strong> {prescription.quantity} unités</div>
          </div>
        </div>

        {/* Points de conseil obligatoires */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">Points obligatoires à aborder</h4>
          {counselingItems.map((item) => (
            <div
              key={item.key}
              className={`p-3 border-2 rounded-lg transition-all ${
                counselingPoints[item.key]
                  ? `border-${item.color}-300 bg-${item.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                <button
                  onClick={() => handlePointCheck(item.key)}
                  disabled={counselingPoints[item.key]}
                  className={`ml-3 p-2 rounded-full transition-colors ${
                    counselingPoints[item.key]
                      ? `bg-${item.color}-100 text-${item.color}-600`
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {counselingPoints[item.key] ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {allPointsCovered && (
        <div className="space-y-4">
          {/* Questions du patient */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-yellow-900 mb-2">
              Questions ou préoccupations du patient
            </label>
            <textarea
              value={patientQuestions}
              onChange={(e) => {
                setPatientQuestions(e.target.value);
                onDataChange({
                  counselingPoints,
                  patientQuestions: e.target.value,
                  leafletGiven,
                  understandingConfirmed
                });
              }}
              placeholder="Noter les questions posées par le patient..."
              className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              rows={3}
            />
          </div>

          {/* Validations finales */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={leafletGiven}
                onChange={(e) => {
                  setLeafletGiven(e.target.checked);
                  onDataChange({
                    counselingPoints,
                    patientQuestions,
                    leafletGiven: e.target.checked,
                    understandingConfirmed
                  });
                }}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium">Notice remise au patient</span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={understandingConfirmed}
                onChange={(e) => {
                  setUnderstandingConfirmed(e.target.checked);
                  onDataChange({
                    counselingPoints,
                    patientQuestions,
                    leafletGiven,
                    understandingConfirmed: e.target.checked
                  });
                }}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium">Compréhension du patient confirmée</span>
            </label>
          </div>

          {(leafletGiven && understandingConfirmed) && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5" />
                Conseil pharmaceutique terminé
              </div>
              <button
                onClick={onNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Procéder à la remise
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composant Remise Sécurisée
export const SecureDelivery = ({ prescription, onNext, onDataChange }) => {
  const [deliveryData, setDeliveryData] = useState({
    summary: false,
    photo: null,
    patientSignature: null,
    pharmacistConfirmation: false
  });

  const [showSummary, setShowSummary] = useState(false);

  const handlePhotoCapture = () => {
    // Simulation capture photo
    const mockPhoto = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      filename: `delivery_${prescription.matricule}_${Date.now()}.jpg`
    };

    const newData = { ...deliveryData, photo: mockPhoto };
    setDeliveryData(newData);
    onDataChange(newData);
    toast.success('Photo de la remise enregistrée');
  };

  const handleSignature = () => {
    // Simulation signature numérique
    const mockSignature = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      patientName: `${prescription.patient?.firstName} ${prescription.patient?.lastName}`,
      signature: 'digital_signature_' + Math.random().toString(36).substr(2, 9)
    };

    const newData = { ...deliveryData, patientSignature: mockSignature };
    setDeliveryData(newData);
    onDataChange(newData);
    toast.success('Signature patient enregistrée');
  };

  const generateReceipt = () => {
    const receipt = {
      id: Date.now(),
      prescriptionId: prescription.id,
      matricule: prescription.matricule,
      deliveryTime: new Date().toISOString(),
      qrCode: `QR_${prescription.matricule}_${Date.now()}`
    };

    toast.success('Reçu de dispensation généré');
    return receipt;
  };

  const isComplete = deliveryData.summary && deliveryData.photo &&
                   deliveryData.patientSignature && deliveryData.pharmacistConfirmation;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-16 w-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Remise Sécurisée</h3>
        <p className="text-gray-600">Finalisation et documentation de la dispensation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Récapitulatif */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-900">Récapitulatif de dispensation</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Patient:</strong> {prescription.patient?.firstName} {prescription.patient?.lastName}</div>
              <div><strong>Matricule:</strong> {prescription.matricule}</div>
              <div><strong>Médicament:</strong> {prescription.medication}</div>
              <div><strong>Dosage:</strong> {prescription.dosage}</div>
              <div><strong>Quantité:</strong> {prescription.quantity}</div>
              <div><strong>Instructions:</strong> {prescription.instructions}</div>
            </div>

            <button
              onClick={() => {
                setShowSummary(true);
                const newData = { ...deliveryData, summary: true };
                setDeliveryData(newData);
                onDataChange(newData);
              }}
              disabled={deliveryData.summary}
              className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-colors ${
                deliveryData.summary
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {deliveryData.summary ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Récapitulatif validé
                </span>
              ) : (
                'Valider le récapitulatif'
              )}
            </button>
          </div>

          {showSummary && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Confirmation patient</h5>
              <p className="text-sm text-green-800">
                Le patient confirme avoir reçu les informations et être d'accord
                pour récupérer le médicament selon les instructions données.
              </p>
            </div>
          )}
        </div>

        {/* Actions de finalisation */}
        <div className="space-y-4">
          {/* Photo de la remise */}
          <div className={`p-4 border-2 rounded-lg ${
            deliveryData.photo ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Photo de la remise</span>
              {deliveryData.photo && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Prendre une photo du médicament remis pour documentation
            </p>
            <button
              onClick={handlePhotoCapture}
              disabled={deliveryData.photo}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                deliveryData.photo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <Camera className="h-5 w-5" />
              {deliveryData.photo ? 'Photo enregistrée' : 'Prendre photo'}
            </button>
          </div>

          {/* Signature patient */}
          <div className={`p-4 border-2 rounded-lg ${
            deliveryData.patientSignature ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Signature patient</span>
              {deliveryData.patientSignature && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Signature numérique du patient confirmant la réception
            </p>
            <button
              onClick={handleSignature}
              disabled={deliveryData.patientSignature}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                deliveryData.patientSignature
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <PenTool className="h-5 w-5" />
              {deliveryData.patientSignature ? 'Signature enregistrée' : 'Signer'}
            </button>
          </div>

          {/* Confirmation pharmacien */}
          {deliveryData.summary && deliveryData.photo && deliveryData.patientSignature && (
            <div className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-900 mb-3">Confirmation finale</h5>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={deliveryData.pharmacistConfirmation}
                  onChange={(e) => {
                    const newData = { ...deliveryData, pharmacistConfirmation: e.target.checked };
                    setDeliveryData(newData);
                    onDataChange(newData);
                  }}
                  className="w-5 h-5 text-yellow-600"
                />
                <span className="text-sm text-yellow-800">
                  Je confirme avoir remis le médicament au bon patient selon les procédures
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {isComplete && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5" />
            Remise sécurisée terminée
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                const receipt = generateReceipt();
                console.log('Receipt generated:', receipt);
              }}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Télécharger reçu
            </button>
            <button
              onClick={onNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Finaliser sur blockchain
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Finalisation Blockchain
export const BlockchainFinalization = ({ prescription, stepData, onComplete, loading, hederaResult }) => {
  const [blockchainData, setBlockchainData] = useState({
    preparing: false,
    anchoring: false,
    verified: false,
    transactionId: null,
    hash: null
  });

  const [progress, setProgress] = useState(0);

  // Mettre à jour l'état quand les résultats Hedera arrivent
  React.useEffect(() => {
    if (hederaResult) {
      setBlockchainData({
        preparing: false,
        anchoring: false,
        verified: hederaResult.isAnchored,
        transactionId: hederaResult.transactionId,
        hash: hederaResult.verifiedAt
      });
      setProgress(100);
    }
  }, [hederaResult]);

  const handleFinalization = async () => {
    setBlockchainData(prev => ({ ...prev, preparing: true }));
    setProgress(10);

    // Étape 1: Préparation des données
    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(30);

    // Étape 2: Ancrage sur Hedera - l'API sera appelée par le parent
    setBlockchainData(prev => ({ ...prev, preparing: false, anchoring: true }));
    setProgress(60);

    try {
      // Appel à la fonction de completion du parent qui fait l'appel API réel
      await onComplete();
    } catch (error) {
      // Réinitialiser en cas d'erreur
      setBlockchainData({
        preparing: false,
        anchoring: false,
        verified: false,
        transactionId: null,
        hash: null
      });
      setProgress(0);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ancrage Blockchain</h3>
        <p className="text-gray-600">Finalisation sécurisée sur Hedera Hashgraph</p>
      </div>

      {/* Résumé des données à ancrer */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-4">Données de dispensation à ancrer</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Prescription:</strong>
            <ul className="mt-1 space-y-1 text-gray-600">
              <li>• Matricule: {prescription.matricule}</li>
              <li>• Patient: {prescription.patient?.firstName} {prescription.patient?.lastName}</li>
              <li>• Médicament: {prescription.medication}</li>
            </ul>
          </div>
          <div>
            <strong>Dispensation:</strong>
            <ul className="mt-1 space-y-1 text-gray-600">
              <li>• Vérification: {stepData.verification ? '✓' : '✗'}</li>
              <li>• Préparation: {stepData.preparation ? '✓' : '✗'}</li>
              <li>• Conseil: {stepData.counseling ? '✓' : '✗'}</li>
              <li>• Remise: {stepData.delivery ? '✓' : '✗'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Processus d'ancrage */}
      {!blockchainData.verified && !loading && (
        <div className="text-center">
          <button
            onClick={handleFinalization}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Commencer l'ancrage blockchain
          </button>
        </div>
      )}

      {(loading || blockchainData.preparing || blockchainData.anchoring) && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="font-medium text-blue-900">
                {blockchainData.preparing && "Préparation des données..."}
                {blockchainData.anchoring && "Ancrage sur Hedera Hashgraph..."}
                {loading && "Finalisation en cours..."}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-blue-700 mt-2">{progress}% terminé</div>
          </div>
        </div>
      )}

      {blockchainData.verified && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-900">Ancrage blockchain réussi</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {blockchainData.transactionId}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hash:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {blockchainData.hash?.substring(0, 16)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="text-green-600 font-medium">Vérifié ✓</span>
              </div>
            </div>
          </div>

          {/* QR Code pour suivi */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <QrCode className="h-12 w-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              QR Code généré pour le suivi patient
            </p>
            <code className="text-xs bg-white px-2 py-1 rounded border mt-2 inline-block">
              QR_{prescription.matricule}_{Date.now()}
            </code>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-lg text-lg font-medium">
              <CheckCircle className="h-6 w-6" />
              Dispensation finalisée avec succès
            </div>
          </div>
        </div>
      )}
    </div>
  );
};