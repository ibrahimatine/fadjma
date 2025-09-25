import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Mail, Lock, User, UserPlus, Building2, MapPin, Phone, Stethoscope, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'patient',
    licenseNumber: '',
    // Doctor fields
    specialty: '',
    hospital: '',
    phoneNumber: '',
    // Pharmacy fields
    pharmacyName: '',
    pharmacyAddress: '',
    // Patient fields
    dateOfBirth: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validation spéciale pour les numéros de téléphone
    if (name === 'phoneNumber') {
      // Ne permettre que les chiffres, espaces, tirets, parenthèses et le signe +
      const phoneRegex = /^[+0-9\s\-()]*$/;
      if (!phoneRegex.test(value)) {
        return; // Ne pas mettre à jour si le format n'est pas valide
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Créer un compte</h2>
            <p className="text-gray-600 mt-2">Rejoignez FadjMa aujourd'hui</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-2" />
                Rôle
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Médecin</option>
                <option value="pharmacy">Pharmacien</option>
              </select>
              {/* Debug - Remove this later */}
              <div className="text-xs text-gray-500 mt-1">
                Rôle actuel: {formData.role}
              </div>
            </div>

            {/* Doctor Specific Fields */}
            {formData.role === 'doctor' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                  Informations professionnelles
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de licence médicale
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="MED-12345"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spécialité
                  </label>
                  <select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Sélectionner une spécialité</option>
                    <option value="medecine_generale">Médecine générale</option>
                    <option value="cardiologie">Cardiologie</option>
                    <option value="dermatologie">Dermatologie</option>
                    <option value="gynecologie">Gynécologie</option>
                    <option value="pediatrie">Pédiatrie</option>
                    <option value="neurologie">Neurologie</option>
                    <option value="psychiatrie">Psychiatrie</option>
                    <option value="chirurgie">Chirurgie</option>
                    <option value="ophtalmologie">Ophtalmologie</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Hôpital/Clinique
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Centre Hospitalier de Dakar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Téléphone professionnel
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+221 77 123 45 67"
                    required
                  />
                </div>
              </div>
            )}

            {/* Pharmacy Specific Fields */}
            {formData.role === 'pharmacy' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Informations de la pharmacie
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de licence pharmaceutique
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="PHARM-12345"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la pharmacie
                  </label>
                  <input
                    type="text"
                    name="pharmacyName"
                    value={formData.pharmacyName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Pharmacie des Almadies"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Adresse de la pharmacie
                  </label>
                  <textarea
                    name="pharmacyAddress"
                    value={formData.pharmacyAddress}
                    onChange={handleChange}
                    className="input-field resize-none"
                    rows="3"
                    placeholder="Rue de la République, Quartier Plateau, Dakar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Téléphone de la pharmacie
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+221 33 123 45 67"
                    required
                  />
                </div>
              </div>
            )}

            {/* Patient Specific Fields */}
            {formData.role === 'patient' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Informations personnelles
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Genre
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="male">Masculin</option>
                      <option value="female">Féminin</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Password Fields */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-600" />
                Sécurité
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  required
                  minLength="6"
                  placeholder="Minimum 6 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  required
                  placeholder="Répétez votre mot de passe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  S'inscrire
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;