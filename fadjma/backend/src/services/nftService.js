const crypto = require('crypto');
const hederaClient = require('../config/hedera');

class NFTVaccinationService {
  constructor() {
    // En production, ces IDs seraient créés via Hedera Token Service
    this.vaccinationCollectionId = process.env.HEDERA_NFT_TOKEN_ID || "0.0.DEMO";
  }

  async createVaccinationCertificate(recordData) {
    try {
      // Créer les métadonnées du NFT
      const nftMetadata = {
        name: `Vaccination Certificate #${Date.now()}`,
        type: "VACCINATION_CERTIFICATE",
        patient: {
          id: recordData.patientId,
          name: `${recordData.patient?.firstName} ${recordData.patient?.lastName}`
        },
        vaccine: {
          name: recordData.metadata?.vaccine || "COVID-19",
          batchNumber: recordData.metadata?.batchNumber || "BATCH-" + Math.random().toString(36).substring(7),
          doseNumber: recordData.metadata?.doseNumber || 1
        },
        administeredBy: {
          doctorId: recordData.doctorId,
          hospital: "FadjMa Medical Center",
          date: new Date().toISOString()
        },
        certificateHash: crypto.createHash('sha256')
          .update(JSON.stringify(recordData))
          .digest('hex'),
        verificationUrl: `https://fadjma.app/verify/${recordData.id}`
      };

      // En production : Mint réel sur Hedera
      // const mintTx = await new TokenMintTransaction()
      //   .setTokenId(this.vaccinationCollectionId)
      //   .setMetadata([Buffer.from(JSON.stringify(nftMetadata))])
      //   .execute(hederaClient.client);

      // Pour la démo : Simulation
      const nftResponse = {
        tokenId: this.vaccinationCollectionId,
        serialNumber: Math.floor(Math.random() * 10000),
        metadata: nftMetadata,
        transactionId: `0.0.${Date.now()}@${Math.floor(Date.now()/1000)}.${Math.floor(Math.random()*1000000000)}`,
        explorerUrl: `https://hashscan.io/testnet/token/${this.vaccinationCollectionId}`,
        status: "SUCCESS"
      };

      console.log('✅ NFT Vaccination créé:', nftResponse.serialNumber);
      return nftResponse;
      
    } catch (error) {
      console.error('Erreur création NFT:', error);
      throw error;
    }
  }

  generateQRCode(nftData) {
    // Générer les données pour le QR Code
    return {
      type: "VACCINATION_NFT",
      tokenId: nftData.tokenId,
      serialNumber: nftData.serialNumber,
      verifyUrl: `https://hashscan.io/testnet/token/${nftData.tokenId}/${nftData.serialNumber}`,
      hash: nftData.metadata.certificateHash
    };
  }
}

module.exports = new NFTVaccinationService();