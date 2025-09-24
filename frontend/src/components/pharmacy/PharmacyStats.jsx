// src/components/pharmacy/PharmacyStats.jsx
import React from "react";
import {
  Clock,
  FileCheck,
  Package,
  CheckCircle,
  Truck,
  AlertTriangle
} from "lucide-react";

const PharmacyStats = ({ prescriptions = [] }) => {
  const statusConfig = {
    pending: {
      label: "En attente",
      color: "yellow",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: Clock
    },
    validated: {
      label: "Validées",
      color: "blue",
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: FileCheck
    },
    preparing: {
      label: "En préparation",
      color: "purple",
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: Package
    },
    ready: {
      label: "Prêtes",
      color: "green",
      bg: "bg-green-50",
      border: "border-green-200",
      icon: CheckCircle
    },
    delivered: {
      label: "Délivrées",
      color: "gray",
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: Truck
    },
    rejected: {
      label: "Rejetées",
      color: "red",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: AlertTriangle
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Object.entries(statusConfig).map(([status, config]) => {
        const count = prescriptions.filter(p => p.status === status).length;
        const Icon = config.icon;

        return (
          <div key={status} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{config.label}</p>
                <p className={`text-2xl font-bold ${
                  config.color === 'yellow' ? 'text-yellow-600' :
                  config.color === 'blue' ? 'text-blue-600' :
                  config.color === 'purple' ? 'text-purple-600' :
                  config.color === 'green' ? 'text-green-600' :
                  config.color === 'gray' ? 'text-gray-600' :
                  'text-red-600'
                }`}>
                  {count}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${
                config.color === 'yellow' ? 'text-yellow-500' :
                config.color === 'blue' ? 'text-blue-500' :
                config.color === 'purple' ? 'text-purple-500' :
                config.color === 'green' ? 'text-green-500' :
                config.color === 'gray' ? 'text-gray-500' :
                'text-red-500'
              }`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PharmacyStats;