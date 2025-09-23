import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  UserCheck,
  Building2,
  Stethoscope,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Composant InputField défini en dehors pour éviter les re-créations
const InputField = ({ icon: Icon, error, children, ...props }) => (
  <div className="space-y-1">
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />}
      {children || <input {...props} className={`input-primary ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300' : ''}`} />}
    </div>
    {error && (
      <div className="flex items-center gap-1 text-red-600 text-xs">
        <AlertCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// Constantes en dehors du composant
const ROLE_OPTIONS = [
  { value: 'patient', label: 'Patient', icon: User, desc: 'Accès à mon dossier médical' },
  { value: 'doctor', label: 'Médecin', icon: Stethoscope, desc: 'Gestion des dossiers patients' },
  { value: 'pharmacy', label: 'Pharmacie', icon: Building2, desc: 'Vérification des ordonnances' }
];

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'patient',
    licenseNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phoneNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    socialSecurityNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'Le prénom est requis.';
    if (!formData.lastName) newErrors.lastName = 'Le nom est requis.';
    if (!formData.email) newErrors.email = 'L\'email est requis.';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format d\'email invalide.';
    if (!formData.password) newErrors.password = 'Le mot de passe est requis.';
    if (formData.password.length < 6) newErrors.password = 'Au moins 6 caractères.';
    if (formData.role === 'doctor' && !formData.licenseNumber) {
      newErrors.licenseNumber = 'Numéro de licence requis.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.password && formData.role;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MedChain</h1>
          <p className="text-gray-600">Créez votre compte sécurisé</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="text-sm font-medium">1</span>
            </div>
            <div className={`w-16 h-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="text-sm font-medium">2</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Étape 1: Informations essentielles */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations de base</h2>
                  <p className="text-gray-600">Commençons par vos informations principales</p>
                </div>

                <div className="space-y-6">
                  {/* Nom et prénom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Prénom"
                          className={`input-primary flex-1 ${errors.firstName ? 'border-red-300' : ''}`}
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.firstName && (
                        <div className="flex items-center gap-1 text-red-600 text-xs ml-8">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.firstName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Nom de famille"
                          className={`input-primary flex-1 ${errors.lastName ? 'border-red-300' : ''}`}
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.lastName && (
                        <div className="flex items-center gap-1 text-red-600 text-xs ml-8">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="email"
                        name="email"
                        placeholder="adresse@email.com"
                        className={`input-primary flex-1 ${errors.email ? 'border-red-300' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center gap-1 text-red-600 text-xs ml-8">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          placeholder="Mot de passe (min. 6 caractères)"
                          className={`input-primary pr-10 w-full ${errors.password ? 'border-red-300' : ''}`}
                          value={formData.password}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    {errors.password && (
                      <div className="flex items-center gap-1 text-red-600 text-xs ml-8">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.password}</span>
                      </div>
                    )}
                  </div>

                  {/* Sélection du rôle */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Type de compte</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {ROLE_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = formData.role === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={option.value}
                              checked={isSelected}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div className="flex flex-col items-center text-center">
                              <Icon className={`h-8 w-8 mb-2 ${
                                isSelected ? 'text-blue-600' : 'text-gray-400'
                              }`} />
                              <div className="font-medium text-gray-900">{option.label}</div>
                              <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-blue-600" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Numéro de licence pour médecin */}
                  {formData.role === 'doctor' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="licenseNumber"
                          placeholder="Numéro de licence médicale"
                          className={`input-primary flex-1 ${errors.licenseNumber ? 'border-red-300' : ''}`}
                          value={formData.licenseNumber}
                          onChange={handleChange}
                        />
                      </div>
                      {errors.licenseNumber && (
                        <div className="flex items-center gap-1 text-red-600 text-xs ml-8">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.licenseNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton suivant */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!isStepValid(1)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2: Informations complémentaires */}
            {currentStep === 2 && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Informations complémentaires</h2>
                  <p className="text-gray-600">Ces informations nous aident à mieux vous servir (optionnel)</p>
                </div>

                <div className="space-y-6">
                  {/* Date de naissance et genre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        className="input-primary flex-1"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <select name="gender" className="input-primary flex-1" value={formData.gender} onChange={handleChange}>
                        <option value="">Sélectionner le genre</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      name="address"
                      placeholder="Adresse complète"
                      className="input-primary flex-1"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  
                  {/* Téléphone */}
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      name="phoneNumber"
                      placeholder="+33 1 23 45 67 89"
                      className="input-primary flex-1"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Contact d'urgence */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <h3 className="font-medium text-orange-900 mb-3">Contact d'urgence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="emergencyContactName"
                          placeholder="Nom du contact"
                          className="input-primary flex-1"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          name="emergencyContactPhone"
                          placeholder="Téléphone d'urgence"
                          className="input-primary flex-1"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sécurité sociale */}
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      name="socialSecurityNumber"
                      placeholder="Numéro de sécurité sociale"
                      className="input-primary flex-1"
                      value={formData.socialSecurityNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Boutons navigation */}
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Inscription...
                      </div>
                    ) : (
                      'Créer mon compte'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Pied de page */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;