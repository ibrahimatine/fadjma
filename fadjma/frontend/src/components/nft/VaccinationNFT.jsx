import React, { useState } from 'react';
import { Award, Download, ExternalLink, Shield, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../../services/api';
import toast from 'react-hot-toast';

const VaccinationNFT = ({ record }) => {
  const [nftData, setNftData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const createNFT = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/nft/vaccination/${record.id}`);
      setNftData(response.data.nft);
      
      // Générer le QR Code
      const qrData = JSON.stringify({
        tokenId: response.data.nft.tokenId,
        serial: response.data.nft.serialNumber,
        verify: response.data.nft.explorerUrl
      });
      const qr = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qr);
      
      toast.success(
        <div>
          <p>NFT Vaccination créé!</p>
          <p className="text-xs">+{response.data.reward?.amount} HEALTH tokens</p>
        </div>
      );
    } catch (error) {
      toast.error('Erreur création NFT');
    } finally {
      setLoading(false);
    }
  };

  if (!nftData && record.type !== 'vaccination') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
      {!nftData ? (
        <div className="text-center">
          <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Certificat NFT de Vaccination</h3>
          <p className="text-sm text-gray-600 mb-4">
            Créez un certificat NFT infalsifiable sur Hedera
          </p>
          <button
            onClick={createNFT}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Création du NFT...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Créer le Certificat NFT
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* En-tête NFT */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Certificat NFT #{nftData.serialNumber}
              </h3>
              <p className="text-sm text-gray-600">Token ID: {nftData.tokenId}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={nftData.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="bg-white p-4 rounded-lg text-center">
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto w-32 h-32" />
              <p className="text-xs text-gray-500 mt-2">
                Scanner pour vérifier l'authenticité
              </p>
            </div>
          )}

          {/* Métadonnées */}
          <div className="bg-white/70 p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vaccin:</span>
              <span className="font-medium">{nftData.metadata.vaccine.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lot:</span>
              <span className="font-medium">{nftData.metadata.vaccine.batchNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Dose:</span>
              <span className="font-medium">#{nftData.metadata.vaccine.doseNumber}</span>
            </div>
          </div>

          {/* Statut Hedera */}
          <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Vérifié sur Hedera Hashgraph</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccinationNFT;