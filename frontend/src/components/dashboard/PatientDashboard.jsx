import React, { useState } from "react";
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
    FileText
} from "lucide-react";
import IntegrityButton from "../verification/IntegrityButton";

const PatientDashboard = ({ records, setShowForm }) => {
    const [activeFilter, setActiveFilter] = useState('all');

    // Filtrage des enregistrements
    const filteredRecords = activeFilter === 'all'
        ? records
        : records.filter(record => record.type === activeFilter);

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

    return (
        <div className="space-y-6">
            {/* En-tête simple */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Mon Dossier Médical</h1>
                <p className="text-blue-100">
                    Consultez et naviguez dans vos informations médicales
                </p>
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
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors" title="Partager">
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors" title="Télécharger">
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Bouton de vérification d'intégrité */}
                                    <div className="mt-4 pt-4 border-t border-white border-opacity-60">
                                        <IntegrityButton recordId={record.id} />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;