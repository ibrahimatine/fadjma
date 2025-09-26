import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  FileText,
  Pill,
  Filter,
  Download,
  ExternalLink,
  Shield,
  Clock,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { historyService } from '../../services/historyService';
import HashScanVerification from '../verification/HashScanVerification';
import toast from 'react-hot-toast';

const DoctorPatientHistory = ({ doctorId, patientId, doctorName, patientName }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    includeUnverified: 'true',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [expandedItems, setExpandedItems] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (doctorId && patientId) {
      loadHistory();
    }
  }, [doctorId, patientId, filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await historyService.getDoctorPatientHistory(doctorId, patientId, filters);

      if (response.success) {
        setHistory(response.data.history);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('History load error:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportHistory = async (format) => {
    try {
      await historyService.exportHistory(doctorId, patientId, format, filters);
      toast.success(`Export ${format.toUpperCase()} terminé`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'medical_record': return <FileText className="h-5 w-5 text-green-600" />;
      case 'prescription': return <Pill className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'medical_record': return 'Dossier Médical';
      case 'prescription': return 'Prescription';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historique des Interactions</h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Dr. {doctorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{patientName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="h-4 w-4" />
              Exporter
              <ChevronDown className="h-3 w-3" />
            </button>

            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportHistory('json')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                JSON
              </button>
              <button
                onClick={() => exportHistory('csv')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t border-gray-100"
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{stats.totalInteractions || 0}</div>
          <div className="text-sm text-blue-600">Total Interactions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{stats.medicalRecords || 0}</div>
          <div className="text-sm text-green-600">Dossiers Médicaux</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">{stats.prescriptions || 0}</div>
          <div className="text-sm text-purple-600">Prescriptions</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-700">{stats.verifiedOnHedera || 0}</div>
          <div className="text-sm text-orange-600">Vérifiés Hedera</div>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="medical_record">Dossiers Médicaux</option>
                <option value="prescription">Prescriptions</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
            <p className="text-gray-500">Aucune interaction trouvée pour ces critères.</p>
          </div>
        ) : (
          history.map((item) => (
            <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getTypeIcon(item.type)}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{getTypeLabel(item.type)}</h3>
                      {item.isVerified ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <Shield className="h-3 w-3 mr-1" />
                          Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(item.date)}
                      {item.type === 'prescription' && item.details.matricule && (
                        <span className="ml-3 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {item.details.matricule}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.verification.transactionUrl && (
                    <button
                      onClick={() => window.open(item.verification.transactionUrl, '_blank')}
                      className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      HashScan
                    </button>
                  )}

                  <button
                    onClick={() => toggleExpanded(`${item.type}-${item.id}`)}
                    className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:bg-gray-50 rounded text-sm"
                  >
                    {expandedItems[`${item.type}-${item.id}`] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    Détails
                  </button>
                </div>
              </div>

              {expandedItems[`${item.type}-${item.id}`] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Détails</h4>
                      {item.type === 'medical_record' ? (
                        <div className="text-sm space-y-1">
                          <p><strong>Titre :</strong> {item.details.title}</p>
                          <p><strong>Type :</strong> {item.details.recordType}</p>
                          {item.details.diagnosis && (
                            <p><strong>Diagnostic :</strong> {item.details.diagnosis}</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p><strong>Médicament :</strong> {item.details.medication}</p>
                          <p><strong>Dosage :</strong> {item.details.dosage}</p>
                          <p><strong>Quantité :</strong> {item.details.quantity}</p>
                          <p><strong>Statut :</strong> {item.details.deliveryStatus}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      {item.isVerified && (
                        <HashScanVerification
                          verification={item.verification}
                          recordHash={item.hash}
                          timestamp={item.hederaTimestamp}
                          compact={true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorPatientHistory;