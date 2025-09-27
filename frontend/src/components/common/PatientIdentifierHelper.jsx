import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, HelpCircle, FileText, CheckCircle, ArrowRight } from 'lucide-react';

const PatientIdentifierHelper = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Comment créer votre compte patient ?
        </h1>
        <p className="text-gray-600">
          Choisissez votre situation pour accéder au bon processus
        </p>
      </div>

      <div className="space-y-4">
        {/* Cas 1: Avec identifiant patient */}
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                J'ai un identifiant patient de mon médecin
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Votre médecin vous a donné un code au format <strong>PAT-AAAAMMJJ-XXXX</strong>.
                Utilisez-le pour accéder directement à votre dossier médical.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/link-patient"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="h-5 w-5 mr-2" />
                  Lier mon identifiant
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="inline-flex items-center justify-center px-4 py-3 border border-blue-300 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Comment ça marche ?
                </button>
              </div>
            </div>
          </div>

          {showHelp && (
            <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Étapes de liaison :</h4>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Saisissez votre identifiant patient (ex: PAT-20241201-A7B9)
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Vérifiez vos informations personnelles
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Créez vos identifiants de connexion (email et mot de passe)
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                  Accédez immédiatement à votre dossier médical complet
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-50 text-gray-500 font-medium">OU</span>
          </div>
        </div>

        {/* Cas 2: Sans identifiant */}
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Je n'ai pas d'identifiant patient
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                Créez un compte patient standard. Vous pourrez demander l'accès à vos dossiers
                médicaux auprès de vos médecins.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                <User className="h-5 w-5 mr-2" />
                Créer un compte classique
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Aide supplémentaire */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Besoin d'aide ?</h4>
            <p className="text-amber-800 text-sm">
              Si vous n'êtes pas sûr de votre situation ou si vous avez des questions,
              contactez votre médecin ou l'équipe support de FadjMa.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation vers connexion */}
      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PatientIdentifierHelper;