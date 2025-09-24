import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Heart,
    Pill,
    Syringe,
    Download,
    Share2,
    Calendar,
    Clock,
    User,
    Filter,
    FileText,
    Bell,
    BellIcon,
    Eye,
    ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntegrityButton from "../verification/IntegrityButton";
import NotificationCenter from "../notifications/NotificationCenter";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";
import medicalRecordService from "../../services/medicalRecordService";
import toast from "react-hot-toast";

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [showNotifications, setShowNotifications] = useState(false);
    const [patientRecord, setPatientRecord] = useState([]);


    // Use notifications hook
    const {
        unreadCount
    } = useNotifications(user?.id, user?.role === 'patient');


    const fetchPatientRecord = async () => {
        const response = await medicalRecordService.getPatientRecords(user?.id);
        setPatientRecord(response.data.records || []);
    };

    // Filtrage des enregistrements
    const filteredRecords = activeFilter === 'all'
        ? patientRecord
        : patientRecord.filter(record => record.type === activeFilter);

    // Configuration des types avec icônes et couleurs
    const typeConfig = {
        allergy: {
            icon: AlertTriangle,
            color: 'red',
            bg: 'bg-red-50',
            border: 'border-red-200',
            badge: 'bg-red-100 text-red-800'
        },
        prescription: {
            icon: Pill,
            color: 'blue',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            badge: 'bg-blue-100 text-blue-800'
        },
        vaccination: {
            icon: Syringe,
            color: 'green',
            bg: 'bg-green-50',
            border: 'border-green-200',
            badge: 'bg-green-100 text-green-800'
        },
        consultation: {
            icon: Heart,
            color: 'purple',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            badge: 'bg-purple-100 text-purple-800'
        }
    };

    const filters = [
        { key: 'all', label: 'Tous mes dossiers' },
        { key: 'allergy', label: 'Allergies' },
        { key: 'prescription', label: 'Ordonnances' },
        { key: 'vaccination', label: 'Vaccinations' },
        { key: 'consultation', label: 'Consultations' }
    ];

    useEffect(() => {
        fetchPatientRecord();
    }, [user?.id]);

    // Fonction de téléchargement d'un dossier
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
Type        : ${record.type}
Date        : ${new Date(record.createdAt).toLocaleDateString('fr-FR')}
Heure       : ${new Date(record.createdAt).toLocaleTimeString('fr-FR')}
${record.doctorName ? `Médecin     : Dr. ${record.doctorName}` : ''}

DESCRIPTION
───────────
${record.description}

INFORMATIONS TECHNIQUES
───────────────────────
ID du dossier        : ${record.id}
${record.hash ? `Hash blockchain     : ${record.hash}` : ''}
${record.hederaTransactionId ? `ID Transaction Hedera: ${record.hederaTransactionId}` : ''}
Statut vérification  : ${record.isVerified ? 'Vérifié ✓' : 'Non vérifié'}

═══════════════════════════════════════════════════════════════
Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
© ${new Date().getFullYear()} Fadjma Health - Tous droits réservés
═══════════════════════════════════════════════════════════════`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dossier-${record.type}-${new Date(record.createdAt).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Dossier médical téléchargé avec succès');
    };

    return (
        <div className="space-y-6">
            {/* En-tête avec notifications */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Mon Dossier Médical</h1>
                        <p className="text-blue-100">
                            Consultez et naviguez dans vos informations médicales
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        {/* Bouton pour voir tous les dossiers */}
                        <button
                            onClick={() => navigate('/patient/medical-records')}
                            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                            title="Voir tous mes dossiers"
                        >
                            <Eye className="h-5 w-5 text-white" />
                            <span className="text-sm font-medium text-white">Voir tout</span>
                            <ArrowRight className="h-4 w-4 text-white" />
                        </button>

                        {/* Notification bell */}
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="relative p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                            title="Notifications"
                        >
                            <Bell className="h-6 w-6 text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                    </div>
                </div>

                {/* Notification alert */}
                {unreadCount > 0 && (
                    <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <BellIcon className="h-5 w-5 text-yellow-300" />
                            <p className="text-sm text-white">
                                Vous avez {unreadCount} demande(s) d'accès en attente
                            </p>
                            <button
                                onClick={() => setShowNotifications(true)}
                                className="text-yellow-300 hover:text-yellow-200 text-sm font-medium underline"
                            >
                                Voir
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Filtres de navigation */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Filter className="h-4 w-4" />
                    Afficher:
                </div>
                {filters.map((filter) => (
                    <button
                        key={filter.key}
                        onClick={() => setActiveFilter(filter.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter.key
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Contenu principal */}
            {filteredRecords.length === 0 ? (
                <div className="text-center py-16">
                    <div className="bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {activeFilter === 'all' ? 'Aucun dossier médical' : `Aucun dossier trouvé`}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        {activeFilter === 'all'
                            ? 'Vos dossiers médicaux apparaîtront ici une fois créés par un professionnel de santé'
                            : `Vous n'avez actuellement aucun dossier dans cette catégorie`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRecords
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((record) => {
                            const config = typeConfig[record.type] || typeConfig.consultation;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={record.id}
                                    className={`${config.bg} ${config.border} border-l-4 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                                    onClick={() => navigate(`/records/${record.id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Icon className={`h-6 w-6 ${config.color === 'red' ? 'text-red-500' :
                                                    config.color === 'blue' ? 'text-blue-500' :
                                                        config.color === 'green' ? 'text-green-500' :
                                                            'text-purple-500'
                                                    }`} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                                                        {record.type}
                                                    </span>
                                                </div>

                                                <p className="text-gray-700 mb-4 leading-relaxed">{record.description}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                                                title="Partager"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                                                title="Télécharger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(record);
                                                }}
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bouton de vérification d'intégrité */}
                                    <div className="mt-4 pt-4 border-t border-white border-opacity-60">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <IntegrityButton recordId={record.id} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Notification Center Modal */}
            <NotificationCenter
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                userId={user?.id}
            />
        </div>
    );
};

export default PatientDashboard;