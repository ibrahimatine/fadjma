// src/components/pharmacy/PrescriptionCard.jsx
import React from "react";
import {
  Pill,
  Calendar,
  Clock,
  User,
  FileCheck,
  Package,
  CheckCircle,
  AlertTriangle,
  Truck
} from "lucide-react";
import IntegrityButton from "../verification/IntegrityButton";

const PrescriptionCard = ({
  prescription,
  onValidate,
  onPrepare,
  onComplete
}) => {
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "yellow",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      icon: Clock
    },
    validated: {
      label: "Validée",
      color: "blue",
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      icon: FileCheck
    },
    preparing: {
      label: "En préparation",
      color: "purple",
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-100 text-purple-800",
      icon: Package
    },
    ready: {
      label: "Prête",
      color: "green",
      bg: "bg-green-50",
      border: "border-green-200",
      badge: "bg-green-100 text-green-800",
      icon: CheckCircle
    },
    delivered: {
      label: "Délivrée",
      color: "gray",
      bg: "bg-gray-50",
      border: "border-gray-200",
      badge: "bg-gray-100 text-gray-800",
      icon: Truck
    },
    rejected: {
      label: "Rejetée",
      color: "red",
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-800",
      icon: AlertTriangle
    }
  };

  const config = statusConfig[prescription.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const getActionButton = () => {
    switch (prescription.status) {
      case "pending":
        return (
          <button
            onClick={() => onValidate?.(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <FileCheck className="h-4 w-4" />
            Valider
          </button>
        );
      case "validated":
        return (
          <button
            onClick={() => onPrepare?.(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <Package className="h-4 w-4" />
            Préparer
          </button>
        );
      case "preparing":
        return (
          <button
            onClick={() => onComplete?.(prescription.id)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Terminer
          </button>
        );
      default:
        return (
          <button className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm cursor-default">
            <CheckCircle className="h-4 w-4" />
            Complétée
          </button>
        );
    }
  };

  return (
    <div
      className={`${config.bg} ${config.border} border-l-4 rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Pill className="h-6 w-6 text-green-600" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Ordonnance #{prescription.id}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
                {config.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Patient: {prescription.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Médecin: Dr. {prescription.doctorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(prescription.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(prescription.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            {/* Médicaments */}
            <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Médicaments prescrits:</h4>
              <div className="space-y-2">
                {prescription.medications?.map((med, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{med.name}</span>
                    <span className="text-gray-600">{med.dosage} - {med.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {getActionButton()}
        </div>
      </div>

      {/* Vérification d'intégrité */}
      <div className="pt-4 border-t border-white border-opacity-60">
        <IntegrityButton recordId={prescription.id} />
      </div>
    </div>
  );
};

export default PrescriptionCard;