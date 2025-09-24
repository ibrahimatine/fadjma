// src/components/patient/MedicalRecordCard.jsx
import React from 'react';
import {
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Heart,
  Pill,
  Syringe,
  Activity,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import IntegrityButton from '../verification/IntegrityButton';

const MedicalRecordCard = ({ record, onView, onEdit, canEdit = false, showActions = true }) => {
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
      label: 'Prescription'
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
      icon: Activity,
      color: 'orange',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
      label: 'Examen'
    },
    other: {
      icon: FileText,
      color: 'gray',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-100 text-gray-800',
      label: 'Autre'
    }
  };

  const config = typeConfig[record.type] || typeConfig.other;
  const TypeIcon = config.icon;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${config.bg} ${config.border} border-l-4 rounded-xl p-6 hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <TypeIcon className={`h-6 w-6 ${
              config.color === 'red' ? 'text-red-600' :
              config.color === 'blue' ? 'text-blue-600' :
              config.color === 'green' ? 'text-green-600' :
              config.color === 'purple' ? 'text-purple-600' :
              config.color === 'orange' ? 'text-orange-600' :
              'text-gray-600'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {record.title || `${config.label} du ${formatDate(record.createdAt)}`}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                {config.label}
              </span>
            </div>

            {record.description && (
              <p className="text-gray-700 mb-3 leading-relaxed line-clamp-2">
                {record.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(record.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(record.createdAt)}</span>
              </div>
              {record.doctorName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Dr. {record.doctorName}</span>
                </div>
              )}
              {record.updatedAt && record.updatedAt !== record.createdAt && (
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Modifié le {formatDate(record.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Additional details based on type */}
            {record.type === 'prescription' && record.medications && (
              <div className="mt-3 p-3 bg-white bg-opacity-60 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Médicaments:</h4>
                <div className="space-y-1">
                  {record.medications.slice(0, 3).map((med, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      • {med.name} - {med.dosage}
                    </div>
                  ))}
                  {record.medications.length > 3 && (
                    <div className="text-sm text-gray-500">
                      ... et {record.medications.length - 3} autre(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {record.type === 'allergy' && record.allergen && (
              <div className="mt-3 p-3 bg-white bg-opacity-60 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Allergène:</h4>
                <p className="text-sm text-gray-700">{record.allergen}</p>
                {record.severity && (
                  <p className="text-sm text-gray-600 mt-1">
                    Sévérité: <span className="font-medium">{record.severity}</span>
                  </p>
                )}
              </div>
            )}

            {record.type === 'vaccination' && record.vaccine && (
              <div className="mt-3 p-3 bg-white bg-opacity-60 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Vaccin:</h4>
                <p className="text-sm text-gray-700">{record.vaccine}</p>
                {record.batchNumber && (
                  <p className="text-sm text-gray-600 mt-1">
                    Lot: {record.batchNumber}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onView?.(record)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Voir les détails"
            >
              <Eye className="h-5 w-5" />
            </button>

            {canEdit && (
              <button
                onClick={() => onEdit?.(record)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}

            <button
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Verification button */}
      <div className="pt-4 border-t border-white border-opacity-60">
        <IntegrityButton recordId={record.id} />
      </div>
    </div>
  );
};

export default MedicalRecordCard;