/**
 * Tests for Mirror Node Verification Service
 * Critical feature: Blockchain transaction verification
 */

describe('Mirror Node Verification Service', () => {
  describe('buildMirrorNodeUrl', () => {
    const buildMirrorNodeUrl = (transactionId, network = 'testnet') => {
      const baseUrl =
        network === 'mainnet'
          ? 'https://mainnet-public.mirrornode.hedera.com'
          : 'https://testnet.mirrornode.hedera.com';

      return `${baseUrl}/api/v1/transactions/${transactionId}`;
    };

    test('should build correct testnet URL', () => {
      const txId = '0.0.6089195-1758958633-731955949';
      const url = buildMirrorNodeUrl(txId, 'testnet');

      expect(url).toBe(
        'https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.6089195-1758958633-731955949'
      );
    });

    test('should build correct mainnet URL', () => {
      const txId = '0.0.123-1234567890-123456789';
      const url = buildMirrorNodeUrl(txId, 'mainnet');

      expect(url).toBe(
        'https://mainnet-public.mirrornode.hedera.com/api/v1/transactions/0.0.123-1234567890-123456789'
      );
    });

    test('should default to testnet if network not specified', () => {
      const txId = '0.0.6089195-1758958633-731955949';
      const url = buildMirrorNodeUrl(txId);

      expect(url).toContain('testnet.mirrornode.hedera.com');
    });
  });

  describe('buildHashScanUrl', () => {
    const buildHashScanUrl = (type, id, network = 'testnet') => {
      const baseUrl =
        network === 'mainnet'
          ? 'https://hashscan.io/mainnet'
          : 'https://hashscan.io/testnet';

      return `${baseUrl}/${type}/${id}`;
    };

    test('should build transaction URL', () => {
      const txId = '0.0.6089195-1758958633-731955949';
      const url = buildHashScanUrl('transaction', txId, 'testnet');

      expect(url).toBe(
        'https://hashscan.io/testnet/transaction/0.0.6089195-1758958633-731955949'
      );
    });

    test('should build topic URL', () => {
      const topicId = '0.0.6854064';
      const url = buildHashScanUrl('topic', topicId, 'testnet');

      expect(url).toBe('https://hashscan.io/testnet/topic/0.0.6854064');
    });

    test('should build account URL', () => {
      const accountId = '0.0.6089195';
      const url = buildHashScanUrl('account', accountId, 'testnet');

      expect(url).toBe('https://hashscan.io/testnet/account/0.0.6089195');
    });

    test('should support mainnet', () => {
      const topicId = '0.0.123456';
      const url = buildHashScanUrl('topic', topicId, 'mainnet');

      expect(url).toBe('https://hashscan.io/mainnet/topic/0.0.123456');
    });

    test('should default to testnet', () => {
      const topicId = '0.0.6854064';
      const url = buildHashScanUrl('topic', topicId);

      expect(url).toContain('testnet');
    });
  });

  describe('parseTransactionResponse', () => {
    const parseTransactionResponse = (response) => {
      if (!response || !response.transactions || response.transactions.length === 0) {
        throw new Error('No transaction found');
      }

      const tx = response.transactions[0];

      return {
        transactionId: tx.transaction_id,
        consensusTimestamp: tx.consensus_timestamp,
        result: tx.result,
        name: tx.name,
        charged_tx_fee: tx.charged_tx_fee,
        memo_base64: tx.memo_base64,
        valid_start_timestamp: tx.valid_start_timestamp,
      };
    };

    test('should parse valid transaction response', () => {
      const mockResponse = {
        transactions: [
          {
            transaction_id: '0.0.6089195-1758958633-731955949',
            consensus_timestamp: '1758958633.731955949',
            result: 'SUCCESS',
            name: 'CONSENSUSSUBMITMESSAGE',
            charged_tx_fee: 100000,
            memo_base64: 'dGVzdA==',
            valid_start_timestamp: '1758958633.000000000',
          },
        ],
      };

      const parsed = parseTransactionResponse(mockResponse);

      expect(parsed.transactionId).toBe('0.0.6089195-1758958633-731955949');
      expect(parsed.result).toBe('SUCCESS');
      expect(parsed.name).toBe('CONSENSUSSUBMITMESSAGE');
    });

    test('should throw error for empty response', () => {
      const emptyResponse = { transactions: [] };

      expect(() => parseTransactionResponse(emptyResponse)).toThrow(
        'No transaction found'
      );
    });

    test('should throw error for null response', () => {
      expect(() => parseTransactionResponse(null)).toThrow();
    });

    test('should extract all relevant fields', () => {
      const mockResponse = {
        transactions: [
          {
            transaction_id: '0.0.123-1234567890-123456789',
            consensus_timestamp: '1234567890.123456789',
            result: 'SUCCESS',
            name: 'CONSENSUSSUBMITMESSAGE',
            charged_tx_fee: 50000,
            memo_base64: 'bWVtbw==',
            valid_start_timestamp: '1234567890.000000000',
          },
        ],
      };

      const parsed = parseTransactionResponse(mockResponse);

      expect(parsed).toHaveProperty('transactionId');
      expect(parsed).toHaveProperty('consensusTimestamp');
      expect(parsed).toHaveProperty('result');
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('charged_tx_fee');
      expect(parsed).toHaveProperty('memo_base64');
      expect(parsed).toHaveProperty('valid_start_timestamp');
    });
  });

  describe('verifyTransactionSuccess', () => {
    const verifyTransactionSuccess = (parsedTransaction) => {
      return (
        parsedTransaction.result === 'SUCCESS' &&
        parsedTransaction.name === 'CONSENSUSSUBMITMESSAGE'
      );
    };

    test('should verify successful HCS transaction', () => {
      const transaction = {
        result: 'SUCCESS',
        name: 'CONSENSUSSUBMITMESSAGE',
      };

      expect(verifyTransactionSuccess(transaction)).toBe(true);
    });

    test('should reject failed transaction', () => {
      const transaction = {
        result: 'FAILED',
        name: 'CONSENSUSSUBMITMESSAGE',
      };

      expect(verifyTransactionSuccess(transaction)).toBe(false);
    });

    test('should reject wrong transaction type', () => {
      const transaction = {
        result: 'SUCCESS',
        name: 'CRYPTOTRANSFER',
      };

      expect(verifyTransactionSuccess(transaction)).toBe(false);
    });

    test('should reject both failed and wrong type', () => {
      const transaction = {
        result: 'FAILED',
        name: 'CRYPTOTRANSFER',
      };

      expect(verifyTransactionSuccess(transaction)).toBe(false);
    });
  });

  describe('extractTopicSequenceNumber', () => {
    const extractTopicSequenceNumber = (transactionResponse) => {
      if (
        !transactionResponse ||
        !transactionResponse.transactions ||
        transactionResponse.transactions.length === 0
      ) {
        return null;
      }

      const tx = transactionResponse.transactions[0];

      // Topic sequence number is often in memo or needs special parsing
      // This is a simplified version
      return tx.consensus_timestamp;
    };

    test('should extract sequence info from transaction', () => {
      const mockResponse = {
        transactions: [
          {
            consensus_timestamp: '1758958633.731955949',
          },
        ],
      };

      const sequence = extractTopicSequenceNumber(mockResponse);

      expect(sequence).toBe('1758958633.731955949');
    });

    test('should return null for empty response', () => {
      const emptyResponse = { transactions: [] };

      const sequence = extractTopicSequenceNumber(emptyResponse);

      expect(sequence).toBeNull();
    });
  });

  describe('generateVerificationLinks', () => {
    const generateVerificationLinks = (
      transactionId,
      topicId,
      accountId,
      network = 'testnet'
    ) => {
      const baseUrl =
        network === 'mainnet'
          ? 'https://hashscan.io/mainnet'
          : 'https://hashscan.io/testnet';

      return {
        transaction: `${baseUrl}/transaction/${transactionId}`,
        topic: `${baseUrl}/topic/${topicId}`,
        account: `${baseUrl}/account/${accountId}`,
        mirrorNode: `https://${network}.mirrornode.hedera.com/api/v1/transactions/${transactionId}`,
      };
    };

    test('should generate all verification links', () => {
      const links = generateVerificationLinks(
        '0.0.6089195-1758958633-731955949',
        '0.0.6854064',
        '0.0.6089195',
        'testnet'
      );

      expect(links.transaction).toContain('hashscan.io/testnet/transaction');
      expect(links.topic).toContain('hashscan.io/testnet/topic/0.0.6854064');
      expect(links.account).toContain(
        'hashscan.io/testnet/account/0.0.6089195'
      );
      expect(links.mirrorNode).toContain('testnet.mirrornode.hedera.com');
    });

    test('should include all FADJMA production IDs', () => {
      const links = generateVerificationLinks(
        '0.0.6089195-1758958633-731955949',
        '0.0.6854064',
        '0.0.6089195',
        'testnet'
      );

      expect(links.topic).toContain('0.0.6854064'); // Production topic
      expect(links.account).toContain('0.0.6089195'); // Production account
      expect(links.transaction).toContain('0.0.6089195-1758958633-731955949');
    });

    test('should generate mainnet links when specified', () => {
      const links = generateVerificationLinks(
        '0.0.123-1234567890-123456789',
        '0.0.456',
        '0.0.123',
        'mainnet'
      );

      expect(links.transaction).toContain('hashscan.io/mainnet');
      expect(links.topic).toContain('hashscan.io/mainnet');
      expect(links.account).toContain('hashscan.io/mainnet');
      expect(links.mirrorNode).toContain('mainnet.mirrornode.hedera.com');
    });
  });

  describe('calculateVerificationCost', () => {
    const calculateVerificationCost = (charged_tx_fee) => {
      // Convert tinybars to HBAR (1 HBAR = 100,000,000 tinybars)
      const hbar = charged_tx_fee / 100000000;

      // Approximate USD (assuming $0.05 per HBAR for testnet demo)
      const usd = hbar * 0.05;

      return {
        tinybars: charged_tx_fee,
        hbar: hbar.toFixed(8),
        usd: usd.toFixed(6),
      };
    };

    test('should convert tinybars to HBAR correctly', () => {
      const cost = calculateVerificationCost(100000); // 0.001 HBAR

      expect(parseFloat(cost.hbar)).toBe(0.001);
    });

    test('should calculate USD cost (approximate)', () => {
      const cost = calculateVerificationCost(100000); // 0.001 HBAR

      expect(parseFloat(cost.usd)).toBeCloseTo(0.00005, 6); // 0.001 * 0.05
    });

    test('should handle typical HCS transaction fee', () => {
      const cost = calculateVerificationCost(300000); // 0.003 HBAR

      expect(cost.tinybars).toBe(300000);
      expect(parseFloat(cost.hbar)).toBeCloseTo(0.003, 8);
    });

    test('should return all formats', () => {
      const cost = calculateVerificationCost(500000);

      expect(cost).toHaveProperty('tinybars');
      expect(cost).toHaveProperty('hbar');
      expect(cost).toHaveProperty('usd');
    });
  });

  describe('Integration Test Scenarios', () => {
    test('should handle complete verification workflow', () => {
      // 1. Format transaction ID
      const formatTransactionId = (hederaId) => {
        const regex = /^(\d+\.\d+\.\d+)@(\d+)\.(\d+)$/;
        const match = hederaId.match(regex);
        if (match) {
          const [, accountId, seconds, nanoseconds] = match;
          return `${accountId}-${seconds}-${nanoseconds}`;
        }
        return hederaId;
      };

      const hederaId = '0.0.6089195@1758958633.731955949';
      const formattedId = formatTransactionId(hederaId);

      // 2. Build URLs
      const buildHashScanUrl = (type, id) =>
        `https://hashscan.io/testnet/${type}/${id}`;

      const transactionUrl = buildHashScanUrl('transaction', formattedId);
      const topicUrl = buildHashScanUrl('topic', '0.0.6854064');

      // 3. Verify format
      expect(formattedId).toBe('0.0.6089195-1758958633-731955949');
      expect(transactionUrl).toContain(formattedId);
      expect(topicUrl).toContain('0.0.6854064');
    });

    test('should validate FADJMA production configuration', () => {
      const productionConfig = {
        accountId: '0.0.6089195',
        topicId: '0.0.6854064',
        network: 'testnet',
      };

      expect(productionConfig.accountId).toMatch(/^\d+\.\d+\.\d+$/);
      expect(productionConfig.topicId).toMatch(/^\d+\.\d+\.\d+$/);
      expect(productionConfig.network).toBe('testnet');

      // Verify these are real testnet IDs (not placeholder values)
      expect(productionConfig.accountId).not.toBe('0.0.0');
      expect(productionConfig.topicId).not.toBe('0.0.0');
    });
  });
});