const logger = require('../utils/logger');

/**
 * Service de rate limiting pour respecter les limites Hedera
 * Hedera Testnet limite à 10 TPS (transactions par seconde)
 * Nous utilisons 8 TPS pour avoir une marge de sécurité
 */
class RateLimiterService {
  constructor() {
    // Configuration
    this.maxTPS = parseInt(process.env.HEDERA_MAX_TPS) || 8; // 8 TPS par défaut
    this.windowMs = 1000; // 1 seconde
    this.enabled = process.env.HEDERA_RATE_LIMITER_ENABLED !== 'false'; // Activé par défaut

    // État
    this.tokens = this.maxTPS; // Jetons disponibles
    this.lastRefill = Date.now(); // Dernier remplissage
    this.queue = []; // Queue d'attente
    this.isProcessingQueue = false;

    // Statistiques
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      avgWaitTime: 0,
      peakQueueSize: 0,
      currentTPS: 0
    };

    // Historique pour calculer le TPS actuel
    this.requestHistory = [];

    // Démarrer le remplissage automatique des jetons
    this.startTokenRefill();
  }

  /**
   * Démarre le remplissage automatique des jetons
   */
  startTokenRefill() {
    this.refillInterval = setInterval(() => {
      this.refillTokens();
      this.calculateCurrentTPS();
    }, 100); // Check toutes les 100ms pour une meilleure réactivité
  }

  /**
   * Remplit les jetons selon le temps écoulé
   */
  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    // Calculer combien de jetons à ajouter
    const tokensToAdd = (elapsed / this.windowMs) * this.maxTPS;

    if (tokensToAdd >= 1) {
      // Remplir jusqu'au maximum
      this.tokens = Math.min(this.maxTPS, this.tokens + Math.floor(tokensToAdd));
      this.lastRefill = now;

      // Traiter la queue si des jetons sont disponibles
      if (this.tokens > 0 && this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * Calcule le TPS actuel
   */
  calculateCurrentTPS() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Garder seulement les requêtes de la dernière seconde
    this.requestHistory = this.requestHistory.filter(time => time > oneSecondAgo);

    this.stats.currentTPS = this.requestHistory.length;
  }

  /**
   * Acquiert un jeton pour effectuer une requête
   * Retourne une promesse qui se résout quand un jeton est disponible
   */
  async acquire() {
    if (!this.enabled) {
      return { acquired: true, waitTime: 0, immediate: true };
    }

    this.stats.totalRequests++;

    const startTime = Date.now();

    // Refill les jetons
    this.refillTokens();

    // Si un jeton est disponible, l'utiliser immédiatement
    if (this.tokens > 0) {
      this.tokens--;
      this.requestHistory.push(Date.now());

      return {
        acquired: true,
        waitTime: 0,
        immediate: true,
        tokensRemaining: this.tokens
      };
    }

    // Sinon, mettre en queue
    this.stats.throttledRequests++;

    logger.debug('Rate limit reached, queueing request', {
      queueSize: this.queue.length,
      tokensRemaining: this.tokens,
      currentTPS: this.stats.currentTPS
    });

    return new Promise((resolve) => {
      this.queue.push({
        resolve,
        startTime
      });

      // Mettre à jour la taille max de la queue
      if (this.queue.length > this.stats.peakQueueSize) {
        this.stats.peakQueueSize = this.queue.length;
      }

      // Démarrer le traitement de la queue
      this.processQueue();
    });
  }

  /**
   * Traite la queue d'attente
   */
  async processQueue() {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.queue.length > 0 && this.tokens > 0) {
      this.refillTokens();

      if (this.tokens <= 0) {
        break;
      }

      const request = this.queue.shift();
      this.tokens--;
      this.requestHistory.push(Date.now());

      const waitTime = Date.now() - request.startTime;

      // Mettre à jour le temps d'attente moyen
      const totalWaitTime = this.stats.avgWaitTime * this.stats.throttledRequests + waitTime;
      this.stats.avgWaitTime = totalWaitTime / (this.stats.throttledRequests + 1);

      logger.debug('Request released from queue', {
        waitTime: `${waitTime}ms`,
        queueSize: this.queue.length,
        tokensRemaining: this.tokens
      });

      request.resolve({
        acquired: true,
        waitTime,
        immediate: false,
        tokensRemaining: this.tokens,
        queueSize: this.queue.length
      });

      // Petit délai pour éviter de consommer tous les jetons d'un coup
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;

    // Si encore des items en queue, reprendre plus tard
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Exécute une fonction avec rate limiting
   */
  async execute(fn) {
    const result = await this.acquire();

    logger.debug('Rate limiter acquired', {
      immediate: result.immediate,
      waitTime: result.waitTime,
      tokensRemaining: result.tokensRemaining
    });

    try {
      return await fn();
    } catch (error) {
      logger.error('Rate-limited function error:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      tokensAvailable: this.tokens,
      maxTPS: this.maxTPS,
      queueSize: this.queue.length,
      enabled: this.enabled,
      throttleRate: this.stats.totalRequests > 0 ?
        ((this.stats.throttledRequests / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      avgWaitTime: 0,
      peakQueueSize: 0,
      currentTPS: 0
    };

    logger.info('Rate limiter stats reset');
  }

  /**
   * Change le TPS maximum
   */
  setMaxTPS(maxTPS) {
    if (maxTPS <= 0 || maxTPS > 10) {
      throw new Error('Max TPS must be between 1 and 10');
    }

    this.maxTPS = maxTPS;
    this.tokens = Math.min(this.tokens, maxTPS);

    logger.info(`Max TPS changed to ${maxTPS}`);
  }

  /**
   * Active/désactive le rate limiter
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Rate limiter ${enabled ? 'enabled' : 'disabled'}`);

    if (!enabled) {
      // Vider la queue immédiatement
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        request.resolve({
          acquired: true,
          waitTime: Date.now() - request.startTime,
          immediate: false,
          disabled: true
        });
      }
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
    }

    // Rejeter toutes les requêtes en queue
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      request.resolve({
        acquired: false,
        error: 'Rate limiter stopped'
      });
    }

    logger.info('Rate limiter cleaned up');
  }

  /**
   * Attend que la queue soit vide
   */
  async waitForQueue() {
    while (this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

module.exports = new RateLimiterService();
