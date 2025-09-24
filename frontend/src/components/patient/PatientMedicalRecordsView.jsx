// src/components/patient/PatientMedicalRecordsView.jsx
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Download,
  Share2,
  Shield,
  AlertTriangle,
  Heart,
  Pill,
  Syringe,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { medicalRecordService } from '../../services/medicalRecordService';
import { useAuth } from '../../hooks/useAuth';
import IntegrityButton from '../verification/IntegrityButton';
import toast from 'react-hot-toast';

const PatientMedicalRecordsView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Configuration des types avec icônes et couleurs
  const typeConfig = {
    allergy: {
      icon: AlertTriangle,
      color: 'red',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800',
      label: 'Allergie'
    },
    prescription: {
      icon: Pill,
      color: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      label: 'Ordonnance'
    },
    vaccination: {
      icon: Syringe,
      color: 'green',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800',
      label: 'Vaccination'
    },
    consultation: {
      icon: Heart,
      color: 'purple',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      label: 'Consultation'
    },
    examination: {
      icon: FileText,
      color: 'indigo',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-800',
      label: 'Examen'
    }
  };

  const typeFilters = [
    { value: 'all', label: 'Tous les types' },
    { value: 'consultation', label: 'Consultations' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'allergy', label: 'Allergies' },
    { value: 'examination', label: 'Examens' }
  ];

  const dateFilters = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
  ];

  // Charger les dossiers médicaux du patient
  const fetchRecords = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await medicalRecordService.getPatientRecords(user.id);

      if (response.status === 200 || response.statusText === 'OK') {
        setRecords(response.data.records || []);
      } else {
        toast.error('Erreur lors du chargement de vos dossiers médicaux');
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      toast.error('Impossible de charger vos dossiers médicaux');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les enregistrements
  const filteredRecords = records.filter(record => {
    // Filtre par recherche
    const matchesSearch = !searchQuery ||
      record.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre par type
    const matchesType = typeFilter === 'all' || record.type === typeFilter;

    // Filtre par date
    let matchesDate = true;
    if (dateRange !== 'all') {
      const recordDate = new Date(record.createdAt);
      const now = new Date();

      switch (dateRange) {
        case 'today':
          matchesDate = recordDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = recordDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDate = recordDate >= monthAgo;
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          matchesDate = recordDate >= yearAgo;
          break;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Charger les données au montage
  useEffect(() => {
    fetchRecords();
  }, [user?.id]);

  // Gestion du partage d'un dossier
  const handleShare = async (record) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Dossier médical - ${record.title}`,
          text: `Dossier médical créé le ${new Date(record.createdAt).toLocaleDateString('fr-FR')}`,
          url: window.location.href
        });
      } else {
        // Fallback - copier dans le presse-papier
        await navigator.clipboard.writeText(`Dossier médical: ${record.title}\nDate: ${new Date(record.createdAt).toLocaleDateString('fr-FR')}\nDescription: ${record.description}`);
        toast.success('Informations copiées dans le presse-papier');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Erreur lors du partage');
    }
  };

  // Générer les informations complètes du patient
  const generatePatientInfo = () => {
    const today = new Date();
    return `═══════════════════════════════════════════════════════════════
                    DOSSIER MÉDICAL COMPLET
═══════════════════════════════════════════════════════════════

INFORMATIONS PATIENT
━━━━━━━━━━━━━━━━━━━━

Nom complet      : ${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}
Identifiant      : ${user?.id || 'N/A'}
Email            : ${user?.email || 'N/A'}
Téléphone        : ${user?.phoneNumber || 'N/A'}
Date de naissance: ${user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A'}
Genre            : ${user?.gender || 'N/A'}
Adresse          : ${user?.address || 'N/A'}

Contact d'urgence : ${user?.emergencyContactName || 'N/A'}
Tél. d'urgence    : ${user?.emergencyContactPhone || 'N/A'}

Date de génération: ${today.toLocaleDateString('fr-FR')} à ${today.toLocaleTimeString('fr-FR')}
Nombre de dossiers: ${records.length}

═══════════════════════════════════════════════════════════════`;
  };

  // Générer un résumé statistique
  const generateSummary = () => {
    const typeStats = records.reduce((acc, record) => {
      const type = record.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const oldestRecord = records.length > 0
      ? new Date(Math.min(...records.map(r => new Date(r.createdAt))))
      : null;

    const newestRecord = records.length > 0
      ? new Date(Math.max(...records.map(r => new Date(r.createdAt))))
      : null;

    let summary = `\n\nRÉSUMÉ STATISTIQUE
━━━━━━━━━━━━━━━━━━

Total des dossiers: ${records.length}`;

    if (oldestRecord && newestRecord) {
      summary += `
Premier dossier  : ${oldestRecord.toLocaleDateString('fr-FR')}
Dernier dossier  : ${newestRecord.toLocaleDateString('fr-FR')}`;
    }

    summary += `\n\nRépartition par type:`;
    Object.entries(typeStats).forEach(([type, count]) => {
      const label = typeConfig[type]?.label || type;
      summary += `\n• ${label.padEnd(15)}: ${count} dossier(s)`;
    });

    return summary + `\n\n═══════════════════════════════════════════════════════════════`;
  };

  // Gestion du téléchargement d'un dossier individuel
  const handleDownload = (record) => {
    const content = `═══════════════════════════════════════════════════════════════
                    DOSSIER MÉDICAL INDIVIDUEL
═══════════════════════════════════════════════════════════════

INFORMATIONS PATIENT
━━━━━━━━━━━━━━━━━━━━

Nom complet : ${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}
Identifiant : ${user?.id || 'N/A'}
Email       : ${user?.email || 'N/A'}
Téléphone   : ${user?.phoneNumber || 'N/A'}

═══════════════════════════════════════════════════════════════

DÉTAILS DU DOSSIER
━━━━━━━━━━━━━━━━━━

Titre       : ${record.title}
Type        : ${typeConfig[record.type]?.label || record.type}
Date        : ${new Date(record.createdAt).toLocaleDateString('fr-FR')}
Heure       : ${new Date(record.createdAt).toLocaleTimeString('fr-FR')}
${record.doctorName ? `Médecin     : Dr. ${record.doctorName}` : ''}
${record.diagnosis ? `Diagnostic  : ${record.diagnosis}` : ''}

DESCRIPTION
───────────
${record.description}

${record.prescription ? `PRESCRIPTION
────────────
${typeof record.prescription === 'string' ? record.prescription : JSON.stringify(record.prescription, null, 2)}

` : ''}INFORMATIONS TECHNIQUES
───────────────────────
ID du dossier        : ${record.id}
${record.hash ? `Hash blockchain     : ${record.hash}` : ''}
${record.hederaTransactionId ? `ID Transaction Hedera: ${record.hederaTransactionId}` : ''}
Statut vérification  : ${record.isVerified ? 'Vérifié ✓' : 'Non vérifié'}

═══════════════════════════════════════════════════════════════
Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
© ${new Date().getFullYear()} Fadjma Health - Tous droits réservés
═══════════════════════════════════════════════════════════════`;

    const fileName = `dossier-${record.type}-${new Date(record.createdAt).toISOString().split('T')[0]}.txt`;
    downloadFile(content, fileName);
    toast.success('Dossier individuel téléchargé');
  };

  // Gestion du téléchargement complet de tous les dossiers
  const handleDownloadComplete = () => {
    if (records.length === 0) {
      toast.error('Aucun dossier à télécharger');
      return;
    }

    // Trier les dossiers par ordre chronologique (plus ancien au plus récent)
    const sortedRecords = [...records].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let content = generatePatientInfo();
    content += generateSummary();
    content += `\n\n\nHISTORIQUE MÉDICAL CHRONOLOGIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    sortedRecords.forEach((record, index) => {
      const recordNumber = (index + 1).toString().padStart(3, '0');
      const date = new Date(record.createdAt);
      const typeLabel = typeConfig[record.type]?.label || record.type;

      content += `[${'═'.repeat(65)}]
[${recordNumber}] ${record.title}
[${'═'.repeat(65)}]

Type        : ${typeLabel}
Date        : ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}
${record.doctorName ? `Médecin     : Dr. ${record.doctorName}` : ''}
${record.diagnosis ? `Diagnostic  : ${record.diagnosis}` : ''}

DESCRIPTION:
${record.description}

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

Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}
via la plateforme sécurisée Fadjma Health.

Ce document contient des informations médicales confidentielles.
Veuillez le conserver en lieu sûr et le partager uniquement avec
les professionnels de santé autorisés.

© ${new Date().getFullYear()} Fadjma Health - Tous droits réservés
`;

    const fileName = `dossier-medical-complet-${user?.lastName || 'patient'}-${new Date().toISOString().split('T')[0]}.txt`;
    downloadFile(content, fileName);
    toast.success(`Dossier médical complet téléchargé (${records.length} dossier${records.length > 1 ? 's' : ''})`);
  };

  // Fonction utilitaire pour télécharger un fichier
  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mes Dossiers Médicaux
                </h1>
                <p className="text-sm text-gray-600">
                  Consultez votre historique médical complet
                </p>
              </div>
            </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    Données sécurisées
                  </span>
                </div>
                <button
                  onClick={fetchRecords}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans vos dossiers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre par type */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {typeFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dateFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistiques et bouton de téléchargement global */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">{records.length}</span> dossier(s) au total
                </div>
                <div>
                  <span className="font-medium text-gray-900">{filteredRecords.length}</span> résultat(s) affiché(s)
                </div>
                {records.length > 0 && (
                  <div>
                    Dernier dossier: <span className="font-medium text-gray-900">
                      {new Date(Math.max(...records.map(r => new Date(r.createdAt)))).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>

              {records.length > 0 && (
                <button
                  onClick={handleDownloadComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Télécharger dossier complet ({records.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des dossiers */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
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
        ) : filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((record) => {
                const config = typeConfig[record.type] || typeConfig.consultation;
                const Icon = config.icon;

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200"
                  >
                    <div className={`${config.bg} ${config.border} border-l-4 rounded-lg p-6`} >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            <Icon className={`h-6 w-6 ${config.color === 'red' ? 'text-red-500' :
                              config.color === 'blue' ? 'text-blue-500' :
                                config.color === 'green' ? 'text-green-500' :
                                  config.color === 'purple' ? 'text-purple-500' :
                                    'text-indigo-500'
                              }`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {record.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                                {config.label}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-4 leading-relaxed">
                              {record.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(record.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(record.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                              {record.doctorName && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>Dr. {record.doctorName}</span>
                                </div>
                              )}
                            </div>

                            {/* Vérification d'intégrité */}
                            <div className="mb-4">
                              <IntegrityButton recordId={record.id} />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleShare(record)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Partager"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(record)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="text-center py-16">
              <div className="bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun dossier trouvé
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {searchQuery || typeFilter !== 'all' || dateRange !== 'all'
                  ? 'Aucun dossier ne correspond à vos critères de recherche. Essayez de modifier les filtres.'
                  : 'Vous n\'avez encore aucun dossier médical. Vos dossiers apparaîtront ici une fois créés par un professionnel de santé.'
                }
              </p>
              {(searchQuery || typeFilter !== 'all' || dateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setDateRange('all');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientMedicalRecordsView;