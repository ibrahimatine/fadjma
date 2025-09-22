import React from "react";
import { Shield, FileText } from "lucide-react";
import IntegrityButton from "../verification/IntegrityButton";

const DoctorDashboard = ({ records, setShowForm }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun dossier médical trouvé</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 btn-primary"
          >
            Créer votre premier dossier
          </button>
        </div>
      ) : (
        records.map((record) => (
          <div
            key={record.id}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <span
                className={`badge-${
                  record.type === "allergy" ? "danger" : "success"
                }`}
              >
                {record.type}
              </span>
              {record.isVerified && (
                <Shield className="h-5 w-5 text-green-500" />
              )}
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {record.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {record.description}
            </p>

            <div className="text-xs text-gray-500 mb-4">
              {new Date(record.createdAt).toLocaleDateString("fr-FR")}
            </div>

            <IntegrityButton recordId={record.id} />
          </div>
        ))
      )}
    </div>
  );
};

export default DoctorDashboard;