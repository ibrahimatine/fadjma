// src/components/patient/PatientDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Shield,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { accessService } from '../../services/accessService';
import MedicalRecordCard from './MedicalRecordCard';
import { useWebSocket } from '../../hooks/useWebSocket';
import toast from 'react-hot-toast';

const PatientDetailsModal = ({
  isOpen,
  onClose,
  patient,
  accessLevel = 'read',
  canEdit = false
}) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [patientStats, setPatientStats] = useState(null);
  const [hasActiveAccess, setHasActiveAccess] = useState(false);
  const [fetchedAccessLevel, setFetchedAccessLevel] = useState(null);
  const navigate = useNavigate();

  // WebSocket handlers for real-time updates
  const handleNewMedicalRecord = (data) => {
    // Only refresh if this is the same patient
    if (patient?.id === data.patientId) {
      console.log('🔄 Real-time update: New medical record for current patient');
      fetchRecords(); // Refresh records
      fetchPatientStats(); // Refresh stats

      toast.success(`Nouveau dossier médical ajouté: ${data.title}`, {
        duration: 4000,
        position: 'top-right'
      });
    }
  };

  const handleMedicalRecordUpdated = (data) => {
    // Only refresh if this is the same patient
    if (patient?.id === data.patientId) {
      console.log('🔄 Real-time update: Medical record updated for current patient');
      fetchRecords(); // Refresh records
      fetchPatientStats(); // Refresh stats
    }
  };

  // Setup WebSocket listeners
  useWebSocket([
    { event: 'new_medical_record', handler: handleNewMedicalRecord },
    { event: 'medical_record_updated', handler: handleMedicalRecordUpdated }
  ], [patient?.id, hasActiveAccess]);

  // Fetch patient medical records
  const fetchRecords = async () => {
    console.log('Fetching records for patient:', patient);
    if (!patient?.id) return;

    // Check if doctor has read access before fetching
    if (!hasActiveAccess) {
      console.log('No active access - skipping medical records fetch');
      setRecords([]);
      return;
    }

    setLoading(true);
    try {
      const response = await medicalRecordService.getPatientRecords(patient.id);
      if (response.statusText === 'OK' || response.status === 200) {
        setRecords(response.data.records || []);
      } else {
        // Check if error is due to access permissions
        if (response.status === 403 || response.message?.includes('access')) {
          toast.error('Accès refusé aux dossiers médicaux');
          setRecords([]);
        } else {
          toast.error('Erreur lors du chargement des dossiers');
        }
      }
    } catch (error) {
      console.error('Error fetching records:', error);

      // Handle specific access errors
      if (error.status === 403 || error.message?.includes('Unauthorized') || error.message?.includes('access')) {
        toast.error('Vous n\'avez pas l\'autorisation d\'accéder à ces dossiers');
        setRecords([]);
      } else {
        toast.error('Impossible de charger les dossiers médicaux');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient statistics
  const fetchPatientStats = async () => {
    if (!patient?.id) return;

    // Check if doctor has read access before fetching stats
    if (!hasActiveAccess) {
      console.log('No active access - skipping stats fetch');
      setPatientStats(null);
      return;
    }

    try {
      const response = await medicalRecordService.getPatientStats(patient.id);

      if (response.statusText === 'OK' || response.status === 200) {
        setPatientStats(response.data);
      } else {
        // Handle access errors for stats
        if (response.status === 403 || response.message?.includes('access')) {
          console.log('Access denied for patient stats');
          setPatientStats(null);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);

      // Handle access errors silently for stats
      if (error.status === 403 || error.message?.includes('Unauthorized') || error.message?.includes('access')) {
        console.log('Access denied for patient stats');
        setPatientStats(null);
      }
      // Stats are optional, don't show error to user for other errors
    }
  };

  // Check if the current user has active access to the patient's records
  const checkAccess = async () => {
    if (!patient?.id) return;

    try {
      const response = await accessService.checkMedicalRecordAccess(patient.id);
      console.log('Access check response:', response);
      if (response.status === 200) {
        setHasActiveAccess(true);
        setFetchedAccessLevel(response.data.data.accessLevel);
      } else {
        setHasActiveAccess(false);
        setFetchedAccessLevel(null);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasActiveAccess(false);
      setFetchedAccessLevel(null);
    }
  };

  // Filter records based on search and type
    const filteredRecords = records.filter(record => {
      const matchesSearch = !searchQuery ||
        record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || record.type === typeFilter;

      return matchesSearch && matchesType;
    });


  // Handle create medical record
  const handleCreateRecord = () => {
    navigate('/create-medical-record', { state: { patient } });
    onClose();
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && patient?.id) {
      checkAccess(); // Always check access when modal opens or patient changes

      // Only fetch data if we have active access
      if (hasActiveAccess) {
        fetchRecords();
        fetchPatientStats();
      } else {
        // Clear any existing data if no active access
        setRecords([]);
        setPatientStats(null);
        console.log('No active access - clearing data');
      }

      setSearchQuery('');
      setTypeFilter('all');
      setActiveTab('overview');
    }
  }, [isOpen, patient?.id, hasActiveAccess]); // Depend on hasActiveAccess

  if (!isOpen) return null;

  // Check if doctor has access to view patient data
  const hasReadAccess = hasActiveAccess && (fetchedAccessLevel === 'read' || fetchedAccessLevel === 'write');
  const hasWriteAccess = hasActiveAccess && (fetchedAccessLevel === 'write' || canEdit);

  // If no access, show access denied screen
  if (!hasReadAccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Accès refusé
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Vous n'avez pas l'autorisation d'accéder au dossier médical de {patient?.firstName} {patient?.lastName}.
              Veuillez demander l'accès au patient pour consulter ses informations médicales.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
    { id: 'records', label: 'Dossiers médicaux', icon: FileText },
    { id: 'timeline', label: 'Chronologie', icon: TrendingUp }
  ];

  const recordTypes = [
    { value: 'all', label: 'Tous les types' },
    { value: 'consultation', label: 'Consultations' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'allergy', label: 'Allergies' },
    { value: 'examination', label: 'Examens' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {patient?.firstName} {patient?.lastName}
              </h2>
              <p className="text-blue-100">
                Dossier patient complet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {accessLevel && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${hasWriteAccess
                  ? 'bg-green-500 bg-opacity-20'
                  : 'bg-yellow-500 bg-opacity-20'
                }`}>
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {hasWriteAccess ? 'Accès complet' : 'Lecture seule'}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <OverviewTab
              patient={patient}
              records={records}
              stats={patientStats}
              loading={loading}
              hasReadAccess={hasReadAccess}
              hasWriteAccess={hasWriteAccess}
            />
          )}

          {activeTab === 'records' && (
            <RecordsTab
              records={filteredRecords}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              recordTypes={recordTypes}
              onRefresh={fetchRecords}
              canEdit={hasWriteAccess}
              onCreateRecord={handleCreateRecord}
              hasReadAccess={hasReadAccess}
              hasWriteAccess={hasWriteAccess}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineTab
              records={records}
              loading={loading}
              hasReadAccess={hasReadAccess}
              hasWriteAccess={hasWriteAccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ patient, records, stats, loading, hasReadAccess, hasWriteAccess }) => {
  const recentRecords = records
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Patient Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">{patient?.firstName} {patient?.lastName}</p>
              </div>
            </div>

            {patient?.email && hasReadAccess && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{hasWriteAccess ? patient.email : '••••••••@••••.com'}</p>
                </div>
              </div>
            )}

            {patient?.phoneNumber && hasReadAccess && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium">{hasWriteAccess ? patient.phoneNumber : '••••••••••'}</p>
                </div>
              </div>
            )}

            {patient?.dateOfBirth && hasReadAccess && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Date de naissance</p>
                  <p className="font-medium">
                    {hasWriteAccess
                      ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')
                      : '••/••/••••'
                    }
                  </p>
                </div>
              </div>
            )}

            {patient?.address && hasWriteAccess && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">ID Patient</p>
                <p className="font-medium font-mono text-sm">{patient?.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistiques
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{records.length}</div>
              <div className="text-sm text-gray-600">Dossiers médicaux</div>
            </div>

            {stats && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.verifiedRecords || 0}
                  </div>
                  <div className="text-sm text-gray-600">Vérifiés blockchain</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString('fr-FR') : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Dernière visite</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Dossiers récents
          </h3>
          {/* <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            Voir tout
          </button> */}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentRecords.length > 0 ? (
          <div className="space-y-4">
            {recentRecords.map((record) => (
              <MedicalRecordCard
                key={record.id}
                record={record}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun dossier médical pour ce patient</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Records Tab Component
const RecordsTab = ({
  records,
  loading,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  recordTypes,
  onRefresh,
  canEdit,
  onCreateRecord,
  hasReadAccess,
  hasWriteAccess
}) => {
  return (
    <div className="p-6">
      {/* Access warning for read-only users */}
      {hasReadAccess && !hasWriteAccess && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Vous avez un accès en lecture seule. Certaines informations peuvent être masquées.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les dossiers..."
              className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-200 bg-white text-sm"
          >
            {recordTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>

          {canEdit && (
            <button
              onClick={onCreateRecord}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouveau dossier
            </button>
          )}
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : records.length > 0 ? (
        <div className="space-y-4">
          {records.map((record) => (
            <MedicalRecordCard
              key={record.id}
              record={record}
              canEdit={canEdit}
              onView={(record) => console.log('View record:', record)}
              onEdit={(record) => console.log('Edit record:', record)}
              onDownloadComplete={() => {
                // Fonction pour télécharger tous les dossiers du patient
                if (records.length === 0) {
                  toast.error('Aucun dossier à télécharger');
                  return;
                }

                const sortedRecords = [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                let content = `═══════════════════════════════════════════════════════════════
                    DOSSIER MÉDICAL COMPLET
═══════════════════════════════════════════════════════════════

INFORMATIONS PATIENT
━━━━━━━━━━━━━━━━━━━━

Nom complet : ${patient?.firstName || 'N/A'} ${patient?.lastName || 'N/A'}
Identifiant : ${patient?.id || 'N/A'}
Email       : ${patient?.email || 'N/A'}

Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
Nombre de dossiers: ${records.length}

═══════════════════════════════════════════════════════════════

HISTORIQUE MÉDICAL CHRONOLOGIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

                sortedRecords.forEach((rec, index) => {
                  const recordNumber = (index + 1).toString().padStart(3, '0');
                  const date = new Date(rec.createdAt);

                  content += `[${'═'.repeat(65)}]
[${recordNumber}] ${rec.title}
[${'═'.repeat(65)}]

Type        : ${rec.type}
Date        : ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}
${rec.doctorName ? `Médecin     : Dr. ${rec.doctorName}` : ''}

DESCRIPTION:
${rec.description}

ID: ${rec.id}

`;
                });

                content += `
═══════════════════════════════════════════════════════════════
                    FIN DU DOSSIER MÉDICAL
═══════════════════════════════════════════════════════════════

© ${new Date().getFullYear()} Fadjma Health - Tous droits réservés
`;

                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dossier-medical-complet-${patient?.lastName || 'patient'}-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success(`Dossier complet téléchargé (${records.length} dossier${records.length > 1 ? 's' : ''})`);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun dossier trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || typeFilter !== 'all'
              ? 'Aucun dossier ne correspond à vos critères de recherche'
              : 'Ce patient n\'a encore aucun dossier médical'
            }
          </p>
          {canEdit && (
            <button
              onClick={onCreateRecord}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Créer le premier dossier
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ records, loading, hasReadAccess, hasWriteAccess }) => {
  const sortedRecords = records
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Access warning for read-only users */}
        {hasReadAccess && !hasWriteAccess && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Mode lecture seule - Certains détails peuvent être masqués.
              </p>
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Chronologie médicale
        </h3>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-3 h-3 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedRecords.length > 0 ? (
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {sortedRecords.map((record) => (
                <div key={record.id} className="relative flex gap-4">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow flex-shrink-0 mt-1"></div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {hasWriteAccess
                            ? (record.title || `${record.type} du ${new Date(record.createdAt).toLocaleDateString('fr-FR')}`)
                            : `Dossier médical du ${new Date(record.createdAt).toLocaleDateString('fr-FR')}`
                          }
                        </h4>
                        <span className="text-sm text-gray-500">
                          {new Date(record.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {record.description && hasWriteAccess && (
                        <p className="text-gray-600 text-sm mb-2">{record.description}</p>
                      )}
                      {!hasWriteAccess && (
                        <p className="text-gray-400 text-sm mb-2 italic">Détails masqués - Accès en lecture limitée</p>
                      )}
                      {record.doctorName && (
                        <p className="text-xs text-gray-500">Par Dr. {record.doctorName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun historique
            </h3>
            <p className="text-gray-600">
              La chronologie apparaîtra ici une fois que des dossiers médicaux seront créés
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsModal;