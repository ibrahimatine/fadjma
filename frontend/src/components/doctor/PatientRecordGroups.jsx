// src/components/doctor/PatientRecordGroups.jsx
import { useState, useEffect } from 'react';
import {
  User,
  FileText,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  Activity,
  AlertTriangle,
  Heart,
  Pill,
  Syringe,
  Clock,
  Search,
  Filter,
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { medicalRecordService } from '../../services/medicalRecordService';
import { patientService } from '../../services/patienService';
import { accessService } from '../../services/accessService';
import { useAuth } from '../../hooks/useAuth';
import PatientDetailsModal from '../patient/PatientDetailsModal';
import AccessRequestModal from '../access/AccessRequestModal';
import toast from 'react-hot-toast';

const PatientRecordGroups = () => {
  const { user } = useAuth();
  const [patientsData, setPatientsData] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [accessStatus, setAccessStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedPatientForAccess, setSelectedPatientForAccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatient, setExpandedPatient] = useState(null);

  const typeConfig = {
    allergy: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Allergie'
    },
    prescription: {
      icon: Pill,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      label: 'Prescription'
    },
    vaccination: {
      icon: Syringe,
      color: 'text-green-600',
      bg: 'bg-green-50',
      label: 'Vaccination'
    },
    consultation: {
      icon: Heart,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      label: 'Consultation'
    },
    examination: {
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      label: 'Examen'
    }
  };

  // Fetch all patients and their access status
  const fetchAllData = async () => {
    if (user?.role !== 'doctor') return;

    setLoading(true);
    try {
      // Récupérer tous les patients
      const allPatientsResponse = await patientService.getAll();
      const patients = allPatientsResponse?.patients || allPatientsResponse || [];
      setAllPatients(patients);

      // Récupérer les dossiers groupés (patients avec accès)
      const groupedResponse = await medicalRecordService.getGroupedByPatient(1, 50);
      if (groupedResponse.status === 200) {
        setPatientsData(groupedResponse.data.patients || []);
      }

      // Récupérer le statut d'accès pour tous les patients
      if (patients.length > 0) {
        const patientIds = patients.map(p => p.id);
        const accessResponse = await accessService.getAccessStatusForPatients(patientIds, user.id);
        if (accessResponse.success) {
          setAccessStatus(accessResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Impossible de charger les données des patients');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAllData();
  }, [user?.id]);

  // Create combined patient list (accessible + non-accessible)
  const getCombinedPatients = () => {
    const accessiblePatientIds = new Set(patientsData.map(pd => pd.patient.id));
    const combinedPatients = [];

    // Add accessible patients with their records
    patientsData.forEach(patientData => {
      combinedPatients.push({
        ...patientData,
        hasAccess: true
      });
    });

    // Add non-accessible patients
    allPatients.forEach(patient => {
      if (!accessiblePatientIds.has(patient.id)) {
        combinedPatients.push({
          patient,
          records: [],
          summary: {
            totalRecords: 0,
            lastRecordDate: null,
            recordTypes: [],
            recentRecords: []
          },
          hasAccess: false
        });
      }
    });

    return combinedPatients;
  };

  // Filter patients based on search
  const filteredPatients = getCombinedPatients().filter(patientData => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patient = patientData.patient;
    return (
      patient.firstName?.toLowerCase().includes(query) ||
      patient.lastName?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query)
    );
  });


  // Handle access request
  const handleRequestAccess = (patient) => {
    setSelectedPatientForAccess(patient);
    setShowAccessModal(true);
  };

  // Submit access request
  const handleSubmitAccessRequest = async (requestData) => {
    try {
      const response = await accessService.requestReadAccess(requestData.patientId, requestData.reason);
      if (response.success) {
        toast.success("Demande d'accès envoyée avec succès");
        setShowAccessModal(false);
        setSelectedPatientForAccess(null);
        // Refresh data to update access status
        fetchAllData();
      } else {
        throw new Error(response.message || "Erreur lors de l'envoi de la demande");
      }
    } catch (error) {
      console.error("Request access error:", error);
      toast.error(error.message || "Impossible d'envoyer la demande d'accès");
      throw error;
    }
  };

  // Get access button based on status
  const getAccessButton = (patientData) => {
    const patient = patientData.patient;
    const status = accessStatus[patient.id];

    if (!patientData.hasAccess) {
      if (!status || status.status === 'none') {
        // No access request - show request button
        return (
          <button
            onClick={() => handleRequestAccess(patient)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            title="Demander l'accès aux dossiers"
          >
            <KeyRound className="h-4 w-4" />
            Demander accès
          </button>
        );
      }

      if (status.status === 'pending') {
        // Pending request - show pending status
        return (
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-700 font-medium">En attente</span>
          </div>
        );
      }
    }

    // Has access - return null, regular buttons will be shown
    return null;
  };

  // Handle patient selection
  const handleViewPatient = (patientData) => {
    setSelectedPatient(patientData.patient);
    setShowPatientModal(true);
  };

  // Download all records for a patient
  const handleDownloadPatientRecords = (patientData) => {
    const patient = patientData.patient;
    const records = patientData.records;

    if (records.length === 0) {
      toast.error('Aucun dossier à télécharger pour ce patient');
      return;
    }

    // Sort records chronologically
    const sortedRecords = [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let content = `═══════════════════════════════════════════════════════════════
                    DOSSIER MÉDICAL COMPLET
═══════════════════════════════════════════════════════════════

INFORMATIONS PATIENT
━━━━━━━━━━━━━━━━━━━━

Nom complet      : ${patient.firstName} ${patient.lastName}
Identifiant      : ${patient.id}
Email            : ${patient.email || 'N/A'}
Date de naissance: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}
Genre            : ${patient.gender || 'N/A'}
Téléphone        : ${patient.phoneNumber || 'N/A'}

Date de génération: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
Nombre de dossiers: ${records.length}
Médecin traitant  : Dr. ${user.firstName} ${user.lastName}

═══════════════════════════════════════════════════════════════

HISTORIQUE MÉDICAL CHRONOLOGIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    sortedRecords.forEach((record, index) => {
      const recordNumber = (index + 1).toString().padStart(3, '0');
      const date = new Date(record.createdAt);
      const config = typeConfig[record.type] || { label: record.type };

      content += `[${'═'.repeat(65)}]
[${recordNumber}] ${record.title}
[${'═'.repeat(65)}]

Type        : ${config.label}
Date        : ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}
${record.doctor ? `Médecin     : Dr. ${record.doctor.firstName} ${record.doctor.lastName}` : ''}

DESCRIPTION:
${record.description || 'Aucune description'}

${record.diagnosis ? `DIAGNOSTIC:\n${record.diagnosis}\n` : ''}
${record.prescription ? `PRESCRIPTION:\n${typeof record.prescription === 'string' ? record.prescription : JSON.stringify(record.prescription, null, 2)}\n` : ''}

INFORMATIONS TECHNIQUES:
• ID: ${record.id}
${record.hash ? `• Hash: ${record.hash.substring(0, 32)}...` : ''}
${record.hederaTransactionId ? `• Hedera ID: ${record.hederaTransactionId}` : ''}
• Statut: ${record.isVerified ? 'Vérifié ✓' : 'Non vérifié'}

`;
    });

    content += `
═══════════════════════════════════════════════════════════════
                    FIN DU DOSSIER MÉDICAL
═══════════════════════════════════════════════════════════════

Document généré par Dr. ${user.firstName} ${user.lastName}
le ${new Date().toLocaleDateString('fr-FR')} via Fadjma Health

Ce document contient des informations médicales confidentielles.

© ${new Date().getFullYear()} Fadjma Health - Tous droits réservés
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-complet-${patient.lastName}-${patient.firstName}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Dossier complet téléchargé pour ${patient.firstName} ${patient.lastName} (${records.length} dossier${records.length > 1 ? 's' : ''})`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dossiers par Patient</h2>
          <p className="text-gray-600">Vue consolidée des dossiers médicaux groupés par patient</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un patient..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'Aucun patient trouvé' : 'Aucun dossier patient'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Aucun patient ne correspond à votre recherche'
              : 'Vous n\'avez accès à aucun dossier médical pour le moment'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patientData) => {
            const patient = patientData.patient;
            const summary = patientData.summary;
            const isExpanded = expandedPatient === patient.id;

            return (
              <div key={patient.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
                {/* Patient Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>ID: {patient.id}</span>
                          {patientData.hasAccess ? (
                            <>
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {summary.totalRecords} dossier{summary.totalRecords > 1 ? 's' : ''}
                              </span>
                              {summary.lastRecordDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(summary.lastRecordDate).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <KeyRound className="h-4 w-4" />
                              Accès non autorisé
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {patientData.hasAccess ? (
                        <>
                          {/* Record types badges */}
                          <div className="flex gap-1">
                            {summary.recordTypes.slice(0, 3).map(type => {
                              const config = typeConfig[type] || { icon: FileText, color: 'text-gray-600' };
                              const TypeIcon = config.icon;
                              return (
                                <div key={type} className={`p-2 ${config.bg} rounded-lg`} title={config.label}>
                                  <TypeIcon className={`h-4 w-4 ${config.color}`} />
                                </div>
                              );
                            })}
                            {summary.recordTypes.length > 3 && (
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <span className="text-xs font-medium text-gray-600">+{summary.recordTypes.length - 3}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => handleDownloadPatientRecords(patientData)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Télécharger tous les dossiers"
                          >
                            <Download className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => handleViewPatient(patientData)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir le dossier complet"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => setExpandedPatient(isExpanded ? null : patient.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            title={isExpanded ? "Réduire" : "Développer"}
                          >
                            <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </>
                      ) : (
                        /* Access request button for non-accessible patients */
                        getAccessButton(patientData)
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Records Preview */}
                {isExpanded && patientData.hasAccess && (
                  <div className="p-6 bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-4">Dossiers récents ({summary.totalRecords})</h4>
                    <div className="space-y-3">
                      {summary.recentRecords.map((record) => {
                        const config = typeConfig[record.type] || { icon: FileText, color: 'text-gray-600', label: record.type };
                        const RecordIcon = config.icon;

                        return (
                          <div key={record.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                            <div className={`p-2 ${config.bg} rounded`}>
                              <RecordIcon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{record.title}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(record.createdAt).toLocaleDateString('fr-FR')} • {config.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {summary.totalRecords > 3 && (
                        <button
                          onClick={() => handleViewPatient(patientData)}
                          className="w-full p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Voir tous les {summary.totalRecords} dossiers →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailsModal
          isOpen={showPatientModal}
          onClose={() => {
            setShowPatientModal(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
          accessLevel="write"
          canEdit={true}
        />
      )}

      {/* Access Request Modal */}
      {selectedPatientForAccess && (
        <AccessRequestModal
          isOpen={showAccessModal}
          onClose={() => {
            setShowAccessModal(false);
            setSelectedPatientForAccess(null);
          }}
          patient={selectedPatientForAccess}
          onSubmit={handleSubmitAccessRequest}
        />
      )}
    </div>
  );
};

export default PatientRecordGroups;