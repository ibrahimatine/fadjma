import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Save,
  X,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'assistant',
    dateOfBirth: '',
    address: '',
    specialization: '',
    licenseNumber: ''
  });

  const [editForm, setEditForm] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const roles = [
    { value: 'patient', label: 'Patient', color: 'blue' },
    { value: 'doctor', label: 'Médecin', color: 'green' },
    { value: 'pharmacy', label: 'Pharmacien', color: 'purple' },
    { value: 'assistant', label: 'Assistant/Secrétaire', color: 'orange' },
    { value: 'radiologist', label: 'Radiologue', color: 'pink' },
    { value: 'admin', label: 'Administrateur', color: 'red' }
  ];

  useEffect(() => {
    loadUsers();
  }, [filterRole, filterActive, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterActive !== 'all') params.append('isActive', filterActive);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.firstName || !createForm.lastName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/users', createForm);
      toast.success('Utilisateur créé avec succès');
      setShowCreateForm(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'assistant',
        dateOfBirth: '',
        address: '',
        specialization: '',
        licenseNumber: ''
      });
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId) => {
    try {
      setLoading(true);
      await api.put(`/admin/users/${userId}`, editForm);
      toast.success('Utilisateur mis à jour');
      setEditingId(null);
      setEditForm({});
      await loadUsers();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/admin/users/${resetPasswordUser.id}/reset-password`, { newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !currentStatus });
      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'}`);
      await loadUsers();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleStartEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      address: user.address || '',
      specialization: user.specialization || '',
      licenseNumber: user.licenseNumber || ''
    });
  };

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj?.color || 'gray';
  };

  const filteredUsers = users;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 mt-2">
            Créez et gérez les comptes utilisateurs du système
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? (
            <>
              <X className="h-5 w-5" />
              Annuler
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Nouvel Utilisateur
            </>
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">Tous les rôles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Créer un nouvel utilisateur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle *
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="utilisateur@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="+221 XX XXX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            {(createForm.role === 'doctor' || createForm.role === 'pharmacy') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de licence
                  </label>
                  <input
                    type="text"
                    value={createForm.licenseNumber}
                    onChange={(e) => setCreateForm({ ...createForm, licenseNumber: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </>
            )}

            {createForm.role === 'doctor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialisation
                </label>
                <input
                  type="text"
                  value={createForm.specialization}
                  onChange={(e) => setCreateForm({ ...createForm, specialization: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Ex: Cardiologie"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                value={createForm.dateOfBirth}
                onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateUser}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Créer l'utilisateur
            </button>
          </div>
        </div>
      )}

      {/* Modal de réinitialisation de mot de passe */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Réinitialiser le mot de passe</h3>
            <p className="text-sm text-gray-600 mb-4">
              Utilisateur: <strong>{resetPasswordUser.firstName} {resetPasswordUser.lastName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setResetPasswordUser(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {loading && users.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isEditing = editingId === user.id;
            const roleColor = getRoleColor(user.role);

            return (
              <div
                key={user.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                  !user.isActive ? 'opacity-60 border-gray-400' : `border-${roleColor}-500`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                            placeholder="Prénom"
                          />
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                            placeholder="Nom"
                          />
                          <input
                            type="tel"
                            value={editForm.phoneNumber}
                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                            placeholder="Téléphone"
                          />
                          <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            className="border border-gray-300 rounded px-3 py-2"
                            placeholder="Adresse"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingId(null); setEditForm({}); }}
                            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateUser(user.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full bg-${roleColor}-100 text-${roleColor}-800`}>
                            {roles.find(r => r.value === user.role)?.label}
                          </span>
                          {!user.isActive && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Inactif
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>📧 {user.email}</div>
                          {user.phoneNumber && <div>📱 {user.phoneNumber}</div>}
                          {user.licenseNumber && <div>🔖 Licence: {user.licenseNumber}</div>}
                          {user.specialization && <div>⚕️ {user.specialization}</div>}
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setResetPasswordUser(user)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                        title="Réinitialiser le mot de passe"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`p-2 rounded-lg ${
                          user.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={user.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {user.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun utilisateur trouvé
          </h3>
          <p className="text-gray-600">
            {searchQuery || filterRole !== 'all' || filterActive !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre premier utilisateur pour commencer'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;