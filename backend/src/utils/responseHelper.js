const logger = require('./logger');

/**
 * Utilitaires pour les réponses HTTP standardisées
 */
class ResponseHelper {
  /**
   * Réponse de succès avec données
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Réponse de succès pour une liste paginée
   */
  static successWithPagination(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages || Math.ceil(pagination.total / pagination.limit)
      }
    });
  }

  /**
   * Réponse d'erreur standardisée
   */
  static error(res, message = 'An error occurred', statusCode = 500, details = null) {
    const errorResponse = {
      success: false,
      message,
      error: true
    };

    if (details && process.env.NODE_ENV === 'development') {
      errorResponse.details = details;
    }

    // Log l'erreur pour le monitoring
    if (statusCode >= 500) {
      logger.error('Server error:', { message, statusCode, details });
    }

    return res.status(statusCode).json(errorResponse);
  }

  /**
   * Réponse pour les erreurs de validation
   */
  static validationError(res, validationErrors) {
    const errors = validationErrors.array ? validationErrors.array() : validationErrors;

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: true,
      validationErrors: errors
    });
  }

  /**
   * Réponse pour les accès non autorisés
   */
  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      message,
      error: true
    });
  }

  /**
   * Réponse pour les accès interdits
   */
  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      message,
      error: true
    });
  }

  /**
   * Réponse pour les ressources non trouvées
   */
  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      error: true
    });
  }

  /**
   * Wrapper pour les fonctions async avec gestion d'erreur automatique
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Valide les paramètres de pagination
   */
  static validatePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Formate les résultats de pagination Sequelize
   */
  static formatPaginatedResults(results, page, limit) {
    return {
      data: results.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.count,
        totalPages: Math.ceil(results.count / limit)
      }
    };
  }
}

module.exports = ResponseHelper;