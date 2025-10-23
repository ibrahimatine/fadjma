const zlib = require('zlib');
const { promisify } = require('util');
const logger = require('../utils/logger');

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);

/**
 * Service de compression pour réduire la taille des messages Hedera
 * Utilise gzip pour une compression efficace des données JSON
 */
class CompressionService {
  constructor() {
    this.enabled = process.env.HEDERA_COMPRESSION_ENABLED !== 'false'; // Activé par défaut
    this.minSizeForCompression = parseInt(process.env.HEDERA_MIN_COMPRESSION_SIZE) || 100; // bytes
  }

  /**
   * Compresse des données en gzip et retourne en base64
   */
  async compress(data) {
    try {
      // Convertir en string si objet
      const stringData = typeof data === 'object' ? JSON.stringify(data) : data;
      const originalSize = Buffer.byteLength(stringData, 'utf8');

      // Ne pas compresser si trop petit (overhead de compression)
      if (originalSize < this.minSizeForCompression) {
        logger.debug('Data too small for compression', { originalSize });
        return {
          compressed: false,
          data: stringData,
          originalSize,
          compressedSize: originalSize,
          ratio: 1.0
        };
      }

      if (!this.enabled) {
        return {
          compressed: false,
          data: stringData,
          originalSize,
          compressedSize: originalSize,
          ratio: 1.0
        };
      }

      // Compression gzip
      const compressed = await gzipAsync(stringData);
      const compressedBase64 = compressed.toString('base64');
      const compressedSize = Buffer.byteLength(compressedBase64, 'utf8');

      // Ratio de compression
      const ratio = originalSize / compressedSize;

      logger.debug('Data compressed successfully', {
        originalSize,
        compressedSize,
        ratio: ratio.toFixed(2),
        savings: `${((1 - 1/ratio) * 100).toFixed(1)}%`
      });

      return {
        compressed: true,
        data: compressedBase64,
        originalSize,
        compressedSize,
        ratio
      };

    } catch (error) {
      logger.error('Compression error:', error);
      // Fallback vers données non compressées
      const stringData = typeof data === 'object' ? JSON.stringify(data) : data;
      return {
        compressed: false,
        data: stringData,
        error: error.message
      };
    }
  }

  /**
   * Décompresse des données depuis base64 gzip
   */
  async decompress(compressedBase64) {
    try {
      const buffer = Buffer.from(compressedBase64, 'base64');
      const decompressed = await gunzipAsync(buffer);
      const stringData = decompressed.toString('utf8');

      logger.debug('Data decompressed successfully', {
        compressedSize: buffer.length,
        decompressedSize: Buffer.byteLength(stringData, 'utf8')
      });

      return {
        success: true,
        data: stringData
      };

    } catch (error) {
      logger.error('Decompression error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compresse un message Hedera (format spécifique)
   */
  async compressHederaMessage(messageObject) {
    const result = await this.compress(messageObject);

    // Envelopper avec métadonnées de compression
    return {
      v: '2.0', // version
      c: result.compressed, // compressed flag
      d: result.data, // data (compressed or not)
      meta: {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        ratio: result.ratio
      }
    };
  }

  /**
   * Décompresse un message Hedera
   */
  async decompressHederaMessage(messageWrapper) {
    try {
      // Si pas de flag de compression, retourner tel quel
      if (!messageWrapper.c) {
        return {
          success: true,
          data: typeof messageWrapper.d === 'string' ?
                JSON.parse(messageWrapper.d) : messageWrapper.d
        };
      }

      // Décompresser
      const result = await this.decompress(messageWrapper.d);

      if (result.success) {
        return {
          success: true,
          data: JSON.parse(result.data)
        };
      }

      return result;

    } catch (error) {
      logger.error('Hedera message decompression error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Estime les économies potentielles pour un type de données
   */
  async estimateSavings(sampleData, count = 1) {
    const result = await this.compress(sampleData);

    const originalCost = result.originalSize * count;
    const compressedCost = result.compressedSize * count;
    const savings = originalCost - compressedCost;
    const savingsPercent = ((savings / originalCost) * 100).toFixed(1);

    return {
      sampleSize: result.originalSize,
      compressedSize: result.compressedSize,
      ratio: result.ratio,
      count,
      totalOriginalSize: originalCost,
      totalCompressedSize: compressedCost,
      totalSavings: savings,
      savingsPercent: `${savingsPercent}%`
    };
  }

  /**
   * Active/désactive la compression
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Compression ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Obtient les statistiques de compression
   */
  getStats() {
    return {
      enabled: this.enabled,
      minSizeForCompression: this.minSizeForCompression
    };
  }
}

module.exports = new CompressionService();
