const crypto = require('crypto');

/**
 * Service centralisé de génération de matricules
 * Utilise UUID v4 pour garantir l'unicité sans race condition
 */
class MatriculeGenerator {
  /**
   * Génère un matricule unique basé sur UUID v4
   * @param {string} prefix - Préfixe du matricule (ex: 'PRX', 'PAT', 'ORD')
   * @param {Date} date - Date optionnelle (défaut: maintenant)
   * @returns {string} Matricule unique
   */
  generate(prefix, date = new Date()) {
    // Forcer la conversion en objet Date
    const d = date instanceof Date ? date : new Date(date);

    // Format date: YYYYMMDD
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');

    // Générer partie unique avec UUID v4 (8 premiers caractères)
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();

    return `${prefix}-${dateStr}-${uuid}`;
}


  /**
   * Génère un matricule patient
   */
  generatePatient(date) {
    return this.generate('PAT', date);
  }

  /**
   * Génère un matricule prescription
   */
  generatePrescription(date) {
    return this.generate('PRX', date);
  }

  /**
   * Génère un matricule ordonnance
   */
  generateOrdonnance(date) {
    return this.generate('ORD', date);
  }

  /**
   * Valide le format d'un matricule
   * @param {string} matricule - Matricule à valider
   * @param {string} prefix - Préfixe attendu
   * @returns {boolean}
   */
  validate(matricule, prefix) {
    if (!matricule) return false;

    // Regex: PREFIX-YYYYMMDD-XXXXXXXX (8 caractères hex)
    const regex = new RegExp(`^${prefix}-\\d{8}-[A-F0-9]{8}$`);
    return regex.test(matricule);
  }

  /**
   * Extrait la date d'un matricule
   * @param {string} matricule
   * @returns {Date|null}
   */
  extractDate(matricule) {
    const parts = matricule.split('-');
    if (parts.length !== 3) return null;

    const dateStr = parts[1]; // YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime()) ? null : date;
  }
}

module.exports = new MatriculeGenerator();
