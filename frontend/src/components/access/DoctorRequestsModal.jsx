// src/components/access/DoctorRequestsModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  FileText,
  RefreshCw
} from 'lucide-react';
import { accessService } from '../../services/accessService';
import toast from 'react-hot-toast';

const DoctorRequestsModal = ({ isOpen, onClose, doctorId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Fetch doctor's requests
  const fetchRequests = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await accessService.getRequestsByRequester(doctorId);

      if (response.success) {
        setRequests(response.data.requests || []);
      } else {
        toast.error('Erreur lors du chargement des demandes');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  // Cancel request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      return;
    }

    try {
      const response = await accessService.cancelAccessRequest(requestId);

      if (response.success) {
        toast.success('Demande annulée avec succès');
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        toast.error('Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Load requests when modal opens
  useEffect(() => {
    if (isOpen && doctorId) {
      fetchRequests();
    }
  }, [isOpen, doctorId]);

  if (!isOpen) return null;

  const statusConfig = {
    pending: {
      label: 'En attente',
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    approved: {
      label: 'Approuvée',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    rejected: {
      label: 'Rejetée',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    expired: {
      label: 'Expirée',
      icon: AlertCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Mes demandes d'accès
              </h3>
              <p className="text-sm text-gray-600">
                Gérez vos demandes d'accès aux dossiers patients
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="all">Tous</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvées</option>
                <option value="rejected">Rejetées</option>
                <option value="expired">Expirées</option>
              </select>
            </div>

            <button
              onClick={fetchRequests}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des demandes...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'Aucune demande' : 'Aucune demande trouvée'}
              </h4>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Vous n\'avez encore envoyé aucune demande d\'accès'
                  : `Aucune demande avec le statut "${statusConfig[filter]?.label || filter}"`
                }
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onCancel={handleCancelRequest}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredRequests.length} demande(s) {filter !== 'all' ? `(${statusConfig[filter]?.label || filter})` : ''}
            </span>
            <span>Total: {requests.length} demande(s)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual request card
const RequestCard = ({ request, onCancel, statusConfig }) => {
  const config = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const patient = request.patient;

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'à l\'instant';
    if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `il y a ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `il y a ${diffInDays} jour(s)`;

    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <User className="h-5 w-5 text-gray-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900">
                {patient?.firstName} {patient?.lastName}
              </h4>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color} bg-white`}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Patient ID:</span> {patient?.id}
              </p>

              <p>
                <span className="font-medium">Niveau d'accès:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs ${
                  request.accessLevel === 'read' ? 'bg-blue-100 text-blue-800' :
                  request.accessLevel === 'write' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.accessLevel === 'read' ? 'Lecture seule' :
                   request.accessLevel === 'write' ? 'Lecture et écriture' :
                   request.accessLevel}
                </span>
              </p>

              {request.reason && (
                <p>
                  <span className="font-medium">Raison:</span> {request.reason}
                </p>
              )}

              {request.expiresAt && (
                <p>
                  <span className="font-medium">Expire le:</span>{' '}
                  {new Date(request.expiresAt).toLocaleDateString('fr-FR')}
                </p>
              )}

              <p className="text-gray-500">
                <Calendar className="h-4 w-4 inline mr-1" />
                Demandé {getTimeAgo(request.createdAt)}
              </p>

              {request.reviewedAt && (
                <p className="text-gray-500">
                  Traité {getTimeAgo(request.reviewedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {request.status === 'pending' && (
            <button
              onClick={() => onCancel(request.id)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorRequestsModal;