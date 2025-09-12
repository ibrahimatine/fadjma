const hederaClient = require('../config/hedera');
const hashService = require('./hashService');
const { Client,TransferTransaction, PrivateKey, AccountCreateTransaction, Hbar } = require("@hashgraph/sdk");

class HederaService {
  async createAccount() {
    try {
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;


      // ✅ Debug - vérifie les credentials
      console.log('Account ID:', accountId);
      console.log('Private Key existe:', !!privateKey);

      if (!accountId || !privateKey) {
        throw new Error('Missing Hedera credentials in environment variables');
      }
      // generates a new ECDSA key pair in memory
        const newPrivateKey = PrivateKey.generateED25519();
    const newPublicKey = newPrivateKey.publicKey;

      const client = Client.forTestnet()
        .setOperator(accountId, privateKey);
      console.log("avant l'appel de setalias")

      // const balance = await new AccountBalanceQuery()
      //   .setAccountId(accountId)
      //   .execute(client);
      // console.log("Balance :",balance)
       const aliasAccountId = newPublicKey.toAccountId(0, 0);

      const transferTx = new TransferTransaction()
      .addHbarTransfer(accountId, Hbar.fromTinybars(-100_000_000)) // -1 HBAR
      .addHbarTransfer(aliasAccountId, Hbar.fromTinybars(100_000_000)); // +1 HBAR
      
    const txResponse = await transferTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    console.log(`Auto-created account: ${aliasAccountId}`);

      return {
        accountId: newAccountId.toString(),
        privateKey: newPrivateKey.toString(), 
      };
    } catch (error) {
      console.error('Error creating Hedera account:', error);
      throw error;
    }
  }

  async anchorRecord(record) {
    try {
      // Generate hash
      const hash = hashService.generateRecordHash(record);

      // Prepare message for Hedera
      const message = JSON.stringify({
        recordId: record.id,
        hash: hash,
        timestamp: new Date().toISOString(),
        type: 'MEDICAL_RECORD'
      });

      // Submit to Hedera
      const result = await hederaClient.submitMessage(message);

      return {
        hash,
        ...result
      };
    } catch (error) {
      console.error('Error anchoring record:', error);
      throw error;
    }
  }

  async verifyRecord(record) {
    try {
      // Calculate current hash
      const currentHash = hashService.generateRecordHash(record);

      // Compare with stored hash
      const isValid = currentHash === record.hash;

      // In production, also verify against Hedera
      // This would require Mirror Node API integration

      return {
        isValid,
        currentHash,
        storedHash: record.hash,
        hederaTransactionId: record.hederaTransactionId,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error verifying record:', error);
      throw error;
    }
  }
}

module.exports = new HederaService();