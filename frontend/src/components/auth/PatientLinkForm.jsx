import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientLinkForm = () => {
  const [step, setStep] = useState('identifier'); // 'identifier' or 'credentials'
  const [formData, setFormData] = useState({
    patientIdentifier: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  const verifyIdentifier = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/verify-patient-identifier/${formData.patientIdentifier}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la vérification de l\'identifiant');
      }

      setPatientInfo(data.data);
      setStep('credentials');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const linkAccount = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/link-patient-identifier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientIdentifier: formData.patientIdentifier,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la liaison du compte');
      }

      // Redirect to login with success message
      navigate('/login', {
        state: {
          message: 'Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.',
          type: 'success'
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatIdentifierInput = (value) => {
    // Remove any non-alphanumeric characters except hyphens
    let cleaned = value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

    // Remove multiple consecutive hyphens
    cleaned = cleaned.replace(/-+/g, '-');

    // Remove leading/trailing hyphens
    cleaned = cleaned.replace(/^-+|-+$/g, '');

    // Handle PAT prefix
    let result = cleaned;
    if (!result.startsWith('PAT')) {
      if (result.length === 0) {
        return '';
      }
      // Check if user is typing PAT progressively
      if ('PAT'.startsWith(result) && result.length <= 3) {
        return result;
      }
      // If user typed something that doesn't match PAT prefix, prepend PAT
      if (result.length > 0) {
        result = 'PAT' + result;
      }
    }

    // Remove PAT prefix temporarily for formatting
    const withoutPAT = result.substring(3);

    // Remove any hyphens from the remaining part for clean formatting
    const cleanWithoutPAT = withoutPAT.replace(/-/g, '');

    // Format as PAT-YYYYMMDD-XXXX
    if (cleanWithoutPAT.length === 0) {
      return result.length <= 3 ? result : 'PAT';
    } else if (cleanWithoutPAT.length <= 8) {
      return `PAT-${cleanWithoutPAT}`;
    } else if (cleanWithoutPAT.length <= 12) {
      return `PAT-${cleanWithoutPAT.slice(0, 8)}-${cleanWithoutPAT.slice(8)}`;
    } else {
      // Limit to maximum length (PAT-YYYYMMDD-XXXX = 17 chars total)
      return `PAT-${cleanWithoutPAT.slice(0, 8)}-${cleanWithoutPAT.slice(8, 12)}`;
    }
  };

  const handleIdentifierChange = (e) => {
    const formatted = formatIdentifierInput(e.target.value);
    setFormData(prev => ({
      ...prev,
      patientIdentifier: formatted
    }));
    if (error) setError('');
  };

  const isValidIdentifierFormat = (identifier) => {
    // Must be exactly PAT-YYYYMMDD-XXXX format
    // YYYY: year (2020-2030 reasonable range)
    // MM: month (01-12)
    // DD: day (01-31)
    // XXXX: 4 hex characters (A-F, 0-9)
    const regex = /^PAT-20[2-3][0-9](0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])-[A-F0-9]{4}$/;
    return regex.test(identifier);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <User className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'identifier' ? 'Lier votre profil patient' : 'Créer votre compte'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'identifier'
            ? 'Saisissez l\'identifiant fourni par votre médecin'
            : 'Configurez vos informations de connexion'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'identifier' ? (
            <form onSubmit={verifyIdentifier} className="space-y-6">
              <div>
                <label htmlFor="patientIdentifier" className="block text-sm font-medium text-gray-700">
                  Identifiant Patient
                </label>
                <div className="mt-1 relative">
                  <input
                    id="patientIdentifier"
                    name="patientIdentifier"
                    type="text"
                    value={formData.patientIdentifier}
                    onChange={handleIdentifierChange}
                    placeholder="PAT-YYYYMMDD-XXXX"
                    maxLength={17}
                    required
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 sm:text-sm font-mono ${
                      formData.patientIdentifier && !isValidIdentifierFormat(formData.patientIdentifier)
                        ? 'border-orange-300 focus:border-orange-500'
                        : formData.patientIdentifier && isValidIdentifierFormat(formData.patientIdentifier)
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  {formData.patientIdentifier && isValidIdentifierFormat(formData.patientIdentifier) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Format: PAT-YYYYMMDD-XXXX (ex: PAT-20241201-A7B9)
                  </p>
                  {formData.patientIdentifier && !isValidIdentifierFormat(formData.patientIdentifier) && (
                    <p className="text-xs text-orange-600">
                      Format incomplet
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || formData.patientIdentifier.length < 17}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <LoadingSpinner size="sm" className="mr-2" />}
                  Vérifier l'identifiant
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Patient info display */}
              {patientInfo && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-800">Profil patient trouvé</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>{patientInfo.firstName} {patientInfo.lastName}</strong>
                  </p>
                  {patientInfo.dateOfBirth && (
                    <p className="text-xs text-green-600">
                      Né(e) le {new Date(patientInfo.dateOfBirth).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={linkAccount} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Adresse email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Numéro de téléphone (optionnel)
                  </label>
                  <div className="mt-1">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={6}
                      required
                      className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      minLength={6}
                      required
                      className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('identifier');
                      setPatientInfo(null);
                      setError('');
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.password !== formData.confirmPassword || !formData.email}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <LoadingSpinner size="sm" className="mr-2" />}
                    Créer mon compte
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-center">
              <Link
                to="/login"
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Déjà un compte ? Se connecter
              </Link>
              <Link
                to="/register"
                className="block text-sm text-gray-600 hover:text-gray-500"
              >
                Pas d'identifiant ? Créer un compte classique
              </Link>
            </div>

            {/* Aide contextuelle */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-center">
                <h4 className="text-sm font-medium text-amber-900 mb-1">
                  Identifiant non trouvé ?
                </h4>
                <p className="text-xs text-amber-800">
                  Vérifiez le format (PAT-AAAAMMJJ-XXXX) ou contactez votre médecin.
                  Vous pouvez aussi créer un compte classique en attendant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientLinkForm;