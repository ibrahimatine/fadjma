import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  Activity,
  Calendar,
  Hash,
  Users,
  FileText,
  Pill,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Server,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';

const AdminRegistry = () => {
  const [registryData, setRegistryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all', // all, prescription, medical_record, dispensation
    status: 'all', // all, verified, pending, failed
    dateRange: '7days', // 1day, 7days, 30days, all
    topicId: ''
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedItems, setExpandedItems] = useState({});
  const [hcsVerifications, setHcsVerifications] = useState({});
  const [loadingVerifications, setLoadingVerifications] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    failed: 0,
    topics: 0,
    lastUpdate: null
  });

  // Simulation de données du registre Hedera
  const mockRegistryData = [
    {
      id: 'HCS-1727264400000-abc123',
      type: 'prescription',
      topicId: '0.0.123456',
      sequenceNumber: 1001,
      consensusTimestamp: '2025-09-25T10:30:00Z',
      transactionId: '0.0.123456@1727264400.123456789',
      hash: 'sha256_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      status: 'verified',
      payload: {
        matricule: 'PRX-20250925-A1B2',
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        medication: 'Amlodipine',
        dosage: '5mg',
        quantity: 30
      },
      metadata: {
        size: 1024,
        fees: '0.0001 HBAR',
        node: '0.0.3'
      }
    },
    {
      id: 'HCS-1727260800000-def456',
      type: 'medical_record',
      topicId: '0.0.789012',
      sequenceNumber: 2047,
      consensusTimestamp: '2025-09-25T09:15:00Z',
      transactionId: '0.0.789012@1727260800.987654321',
      hash: 'sha256_def456ghi789jkl012mno345pqr678stu901vwx234yzabc123',
      status: 'verified',
      payload: {
        recordId: 'record-789',
        patientId: 'patient-456',
        doctorId: 'doctor-123',
        type: 'consultation',
        diagnosis: 'Hypertension arterielle'
      },
      metadata: {
        size: 2048,
        fees: '0.0002 HBAR',
        node: '0.0.4'
      }
    },
    {
      id: 'HCS-1727257200000-ghi789',
      type: 'dispensation',
      topicId: '0.0.345678',
      sequenceNumber: 3089,
      consensusTimestamp: '2025-09-25T08:00:00Z',
      transactionId: '0.0.345678@1727257200.456789012',
      hash: 'sha256_ghi789jkl012mno345pqr678stu901vwx234yzabc123def456',
      status: 'verified',
      payload: {
        dispensationId: 'disp-321',
        matricule: 'PRX-20250924-C3D4',
        pharmacyId: 'pharmacy-789',
        patientId: 'patient-789',
        deliveredAt: '2025-09-25T08:00:00Z'
      },
      metadata: {
        size: 1536,
        fees: '0.00015 HBAR',
        node: '0.0.5'
      }
    },
    {
      id: 'HCS-1727253600000-jkl012',
      type: 'prescription',
      topicId: '0.0.456789',
      sequenceNumber: 1789,
      consensusTimestamp: '2025-09-25T07:00:00Z',
      transactionId: '0.0.456789@1727253600.789012345',
      hash: 'sha256_jkl012mno345pqr678stu901vwx234yzabc123def456ghi789',
      status: 'pending',
      payload: {
        matricule: 'PRX-20250925-E5F6',
        patientId: 'patient-012',
        doctorId: 'doctor-789',
        medication: 'Metformine',
        dosage: '500mg',
        quantity: 60
      },
      metadata: {
        size: 896,
        fees: '0.0001 HBAR',
        node: '0.0.6'
      }
    }
  ];

  useEffect(() => {
    loadRegistryData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [registryData, searchQuery, activeFilters, sortBy, sortOrder]);

  const loadRegistryData = async () => {
    setLoading(true);
    try {
      // Appel API réel
      const [overviewResponse, dataResponse] = await Promise.all([
        adminService.getRegistryOverview(),
        adminService.getRegistryData({
          type: activeFilters.type,
          status: activeFilters.status,
          dateRange: activeFilters.dateRange,
          topicId: activeFilters.topicId,
          search: searchQuery,
          limit: 50
        })
      ]);

      if (overviewResponse.success && dataResponse.success) {
        console.log('Registry data loaded:', dataResponse.data);
        console.log('Number of records received:', dataResponse.data?.length || 0);
        console.log('Overview stats:', overviewResponse.stats);
        setRegistryData(dataResponse.data);
        setStats({
          total: overviewResponse.stats.total,
          verified: overviewResponse.stats.verified,
          pending: overviewResponse.stats.total - overviewResponse.stats.verified,
          failed: 0,
          topics: overviewResponse.stats.unique_topics,
          lastUpdate: overviewResponse.stats.last_updated
        });
        toast.success('Registre chargé avec succès');
      } else {
        // Fallback vers les données de simulation
        setRegistryData(mockRegistryData);
        updateStats(mockRegistryData);
        toast.info('Données de démonstration chargées');
      }
    } catch (error) {
      console.error('Registry load error:', error);

      if (error.response?.status === 403) {
        toast.error('Accès refusé - Droits administrateur requis');
        return;
      }

      // Fallback vers les données de simulation
      setRegistryData(mockRegistryData);
      updateStats(mockRegistryData);
      toast.info('Données de démonstration chargées');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const stats = {
      total: data.length,
      verified: data.filter(item => item.status === 'verified').length,
      pending: data.filter(item => item.status === 'pending').length,
      failed: data.filter(item => item.status === 'failed').length,
      topics: new Set(data.map(item => item.topicId)).size,
      lastUpdate: new Date().toISOString()
    };
    setStats(stats);
  };

  const applyFilters = () => {
    console.log('🔍 Applying filters with:', {
      registryData: registryData.length,
      searchQuery,
      activeFilters,
      sortBy,
      sortOrder
    });

    let filtered = [...registryData];

    // Filtre par recherche
    if (searchQuery) {
      const initialCount = filtered.length;
      filtered = filtered.filter(item =>
        (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.topicId && item.topicId.includes(searchQuery)) ||
        (item.hash && item.hash.includes(searchQuery.toLowerCase())) ||
        (item.payload?.matricule && item.payload.matricule.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.payload?.medication && item.payload.medication.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      console.log(`📝 Search filter: ${initialCount} → ${filtered.length} items`);
    }

    // Filtre par type
    if (activeFilters.type !== 'all') {
      const initialCount = filtered.length;
      filtered = filtered.filter(item => item.type === activeFilters.type);
      console.log(`📂 Type filter (${activeFilters.type}): ${initialCount} → ${filtered.length} items`);
    }

    // Filtre par statut
    if (activeFilters.status !== 'all') {
      const initialCount = filtered.length;
      filtered = filtered.filter(item => item.status === activeFilters.status);
      console.log(`🔄 Status filter (${activeFilters.status}): ${initialCount} → ${filtered.length} items`);
    }

    // Filtre par topic ID
    if (activeFilters.topicId) {
      const initialCount = filtered.length;
      filtered = filtered.filter(item => item.topicId && item.topicId.includes(activeFilters.topicId));
      console.log(`🏷️ Topic filter (${activeFilters.topicId}): ${initialCount} → ${filtered.length} items`);
    }

    // Filtre par date
    if (activeFilters.dateRange !== 'all') {
      const initialCount = filtered.length;
      const now = new Date();
      const cutoff = new Date();

      switch (activeFilters.dateRange) {
        case '1day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case '7days':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30days':
          cutoff.setDate(now.getDate() - 30);
          break;
      }

      filtered = filtered.filter(item => {
        if (!item.consensusTimestamp) return false;
        return new Date(item.consensusTimestamp) >= cutoff;
      });
      console.log(`📅 Date filter (${activeFilters.dateRange}): ${initialCount} → ${filtered.length} items`);
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'timestamp':
          aVal = new Date(a.consensusTimestamp);
          bVal = new Date(b.consensusTimestamp);
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'topicId':
          aVal = a.topicId;
          bVal = b.topicId;
          break;
        default:
          aVal = a.sequenceNumber;
          bVal = b.sequenceNumber;
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    console.log(`✅ Final filtered result: ${filtered.length} items`);
    setFilteredData(filtered);
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportData = async (format = 'json') => {
    try {
      await adminService.exportRegistryData(format, {
        type: activeFilters.type,
        status: activeFilters.status,
        dateRange: activeFilters.dateRange,
        search: searchQuery
      });
      toast.success(`Export ${format.toUpperCase()} terminé`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const updateStatuses = async () => {
    try {
      await adminService.updateStatuses();
      toast.success('Mise à jour des statuts lancée');

      // Recharger les données après quelques secondes
      setTimeout(() => {
        loadRegistryData();
      }, 3000);

    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Erreur lors de la mise à jour des statuts');
    }
  };

  const verifyWithHCS = async (item) => {
    setLoadingVerifications(prev => ({ ...prev, [item.id]: true }));

    try {
      // Tous les items doivent avoir des données Hedera valides
      if (!item.topicId || !item.transactionId || !item.sequenceNumber) {
        throw new Error('Données Hedera incomplètes pour la vérification HCS');
      }
      const hcsResult = await adminService.verifyHCSStatus(
        item.transactionId,
        item.topicId,
        item.sequenceNumber
      );

      setHcsVerifications(prev => ({
        ...prev,
        [item.id]: hcsResult.data
      }));

      console.log('HCS verification result:', hcsResult);

      if (hcsResult.data.isFullyVerified) {
        toast.success('Vérification HCS réussie');
      } else {
        toast.error('Vérification HCS incomplète');
      }

    } catch (error) {
      console.error('HCS verification error:', error);
      toast.error('Erreur lors de la vérification HCS');

      setHcsVerifications(prev => ({
        ...prev,
        [item.id]: {
          isFullyVerified: false,
          errors: [error.message]
        }
      }));
    } finally {
      setLoadingVerifications(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const getTopicStats = async (topicId) => {
    try {
      if (!topicId) {
        toast.error('Topic ID requis');
        return;
      }

      const response = await adminService.getTopicStats(topicId);
      const stats = response.data.stats.stats;
      const isSuccess = response.data.stats.success;
      console.log('Topic stats received:', stats, isSuccess);
      if (stats.totalMessages !== undefined) {
        toast.success(`Topic ${topicId}: ${stats.lastMessageTimestamp}  TimeStamp`);
      } else if (isSuccess && stats.lastMessageTimestamp !== undefined) {
        // Structure alternative directe depuis le backend
        toast.success(`Topic ${topicId}: ${stats.lastMessageTimestamp}  TimeStamp`);
      } else {
        console.log('Stats structure received:', stats);
        toast.error(`Topic ${topicId}: Aucune donnée disponible`);
      }
    } catch (error) {
      console.error('Topic stats error:', error);
      toast.error(`Erreur récupération stats topic ${topicId}`);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'prescription': return <Pill className="h-4 w-4 text-blue-600" />;
      case 'medical_record': return <FileText className="h-4 w-4 text-green-600" />;
      case 'dispensation': return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Vérifié' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Échec' }
    };

    const { bg, text, label } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registre Hedera</h1>
                <p className="text-gray-600">Administration du registre blockchain</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/admin/monitoring"
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Activity className="h-4 w-4" />
                Monitoring
              </a>
              <button
                onClick={loadRegistryData}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualisation...' : 'Actualiser'}
              </button>
              <button
                onClick={updateStatuses}
                disabled={loading}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Vérifier Statuts
              </button>
              <div className="relative group">
                <button
                  onClick={() => exportData('json')}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Exporter
                  <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportData('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t border-gray-100"
                  >
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vérifiés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Échecs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Hash className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Topics</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.topics}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par ID, topic, hash, matricule..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-3">
              <select
                value={activeFilters.type}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="prescription">Prescriptions</option>
                <option value="medical_record">Dossiers médicaux</option>
                <option value="dispensation">Dispensations</option>
              </select>

              <select
                value={activeFilters.status}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="verified">Vérifié</option>
                <option value="pending">En attente</option>
                <option value="failed">Échec</option>
              </select>

              <select
                value={activeFilters.dateRange}
                onChange={(e) => setActiveFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1day">Dernières 24h</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="all">Toutes les dates</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {filteredData.length} résultat(s) sur {registryData.length}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="timestamp">Date</option>
                <option value="type">Type</option>
                <option value="status">Statut</option>
                <option value="topicId">Topic ID</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Liste des entrées du registre */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement du registre...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
              <p className="text-gray-500">Aucune entrée ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getTypeIcon(item.type)}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{item.id}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>Topic: {item.topicId}</span>
                          <span>Seq: #{item.sequenceNumber}</span>
                          <span>{new Date(item.consensusTimestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => verifyWithHCS(item)}
                        disabled={loadingVerifications[item.id]}
                        className="flex items-center gap-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Vérifier via Hedera Consensus Service"
                      >
                        {loadingVerifications[item.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Server className="h-4 w-4" />
                        )}
                        Vérifier HCS
                      </button>

                      <button
                        onClick={() => getTopicStats(item.topicId)}
                        className="flex items-center gap-1 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Voir les statistiques du topic"
                      >
                        <Info className="h-4 w-4" />
                        Stats Topic
                      </button>

                      <button
                        onClick={() => window.open(`https://hashscan.io/testnet/transaction/${item.transactionId}`, '_blank')}
                        className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir sur HashScan Testnet"
                      >
                        <ExternalLink className="h-4 w-4" />
                        HashScan
                      </button>

                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        {expandedItems[item.id] ? 'Masquer' : 'Détails'}
                      </button>
                    </div>
                  </div>

                  {expandedItems[item.id] && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Informations techniques */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Informations techniques</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex">
                              <dt className="w-32 text-gray-500">Transaction ID:</dt>
                              <dd className="font-mono text-gray-900 break-all">{item.transactionId}</dd>
                            </div>
                            <div className="flex">
                              <dt className="w-32 text-gray-500">Hash:</dt>
                              <dd className="font-mono text-gray-900 break-all">{item.hash}</dd>
                            </div>
                            <div className="flex">
                              <dt className="w-32 text-gray-500">Taille:</dt>
                              <dd className="text-gray-900">{item.metadata.size} bytes</dd>
                            </div>
                            <div className="flex">
                              <dt className="w-32 text-gray-500">Frais:</dt>
                              <dd className="text-gray-900">{item.metadata.fees}</dd>
                            </div>
                            <div className="flex">
                              <dt className="w-32 text-gray-500">Nœud:</dt>
                              <dd className="text-gray-900">{item.metadata.node}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Vérification HCS */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Server className="h-4 w-4 text-purple-600" />
                            Vérification HCS
                          </h4>
                          {hcsVerifications[item.id] ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {hcsVerifications[item.id].isFullyVerified ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                                )}
                                <span className={`text-sm font-medium ${
                                  hcsVerifications[item.id].isFullyVerified ? 'text-green-800' : 'text-orange-800'
                                }`}>
                                  {hcsVerifications[item.id].isFullyVerified ? 'Entièrement vérifié' : 'Vérification partielle'}
                                </span>
                              </div>

                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Transaction:</span>
                                  <span className={hcsVerifications[item.id].transactionVerified ? 'text-green-600' : 'text-red-600'}>
                                    {hcsVerifications[item.id].transactionVerified ? '✓' : '✗'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Message:</span>
                                  <span className={hcsVerifications[item.id].messageVerified ? 'text-green-600' : 'text-red-600'}>
                                    {hcsVerifications[item.id].messageVerified ? '✓' : '✗'}
                                  </span>
                                </div>
                                {hcsVerifications[item.id].consensusTimestamp && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Consensus:</span>
                                    <span className="text-gray-700">
                                      {new Date(hcsVerifications[item.id].consensusTimestamp * 1000).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {hcsVerifications[item.id].errors && hcsVerifications[item.id].errors.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 mb-1">Erreurs:</p>
                                  <ul className="text-xs text-red-600 space-y-1">
                                    {hcsVerifications[item.id].errors.map((error, index) => (
                                      <li key={index}>• {error}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 italic">
                              Cliquez sur "Vérifier HCS" pour lancer la vérification
                            </div>
                          )}
                        </div>

                        {/* Payload */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Données métier</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                              {JSON.stringify(item.payload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination si nécessaire */}
        {filteredData.length > 50 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <div className="flex items-center justify-center">
              <p className="text-sm text-gray-500">
                Affichage de 50 résultats. Utilisez les filtres pour affiner votre recherche.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRegistry;