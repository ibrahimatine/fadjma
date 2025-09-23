import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, 
  Mail, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  User, 
  Stethoscope, 
  Building2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validation
    const newErrors = {};
    if (!email) newErrors.email = 'L\'email est requis';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Email ou mot de passe incorrect');
      setErrors({ general: 'Identifiants incorrects' });
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick login buttons for demo
  const quickLogin = async (email, password, role) => {
    setEmail(email);
    setPassword(password);
    setLoading(true);
    try {
      await login(email, password);
      toast.success(`Connexion en tant que ${role}`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur de connexion');
      console.error('Quick login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      email: 'jean.dupont@demo.com',
      password: 'Demo2024!',
      role: 'Patient',
      icon: User,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      description: 'Accès patient complet'
    },
    {
      email: 'dr.martin@fadjma.com',
      password: 'Demo2024!',
      role: 'Médecin',
      icon: Stethoscope,
      color: 'bg-green-50 border-green-200 text-green-800',
      description: 'Interface médecin'
    },
    {
      email: 'pharmacy@fadjma.com',
      password: 'Demo2024!',
      role: 'Pharmacie',
      icon: Building2,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      description: 'Gestion pharmacie'
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MedChain</h1>
          <p className="text-gray-600">Connexion à votre espace sécurisé</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Se connecter</h2>
              <p className="text-gray-600">Accédez à votre dossier médical sécurisé</p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{errors.general}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulaire de connexion */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <input
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        className={`input-primary flex-1 ${errors.email ? 'border-red-300' : ''}`}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrors(prev => ({ ...prev, email: undefined }));
                        }}
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
                          placeholder="Votre mot de passe"
                          className={`input-primary pr-10 w-full ${errors.password ? 'border-red-300' : ''}`}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors(prev => ({ ...prev, password: undefined }));
                          }}
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

                  {/* Options */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>Se souvenir de moi</span>
                    </label>
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Bouton de connexion */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Connexion...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <LogIn className="h-5 w-5" />
                        <span>Se connecter</span>
                      </div>
                    )}
                  </button>
                </form>

                {/* Lien d'inscription */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    Nouveau sur MedChain ?{' '}
                    <Link 
                      to="/register" 
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </div>

              {/* Comptes de démonstration */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Comptes de démonstration</h3>
                  <p className="text-gray-600 text-sm">Testez rapidement l'application avec ces comptes</p>
                </div>

                <div className="space-y-4">
                  {demoAccounts.map((account, index) => {
                    const Icon = account.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => quickLogin(account.email, account.password, account.role)}
                        disabled={loading}
                        className={`w-full p-4 border-2 rounded-xl transition-all hover:shadow-md disabled:opacity-50 ${account.color}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Icon className={`h-6 w-6 ${
                              account.role === 'Patient' ? 'text-blue-600' :
                              account.role === 'Médecin' ? 'text-green-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-grow text-left">
                            <div className="font-semibold">{account.role}</div>
                            <div className="text-sm opacity-75">{account.description}</div>
                          </div>
                          <ArrowRight className="h-4 w-4 opacity-50" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Section sécurité */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">🔒 Connexion sécurisée</h4>
                      <p className="text-gray-700 text-xs mt-1 leading-relaxed">
                        Vos données sont protégées par chiffrement SSL/TLS et stockées sur la blockchain Hedera pour une sécurité maximale.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Plateforme certifiée et sécurisée</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;