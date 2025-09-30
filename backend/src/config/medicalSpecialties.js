/**
 * Liste exhaustive des spécialités médicales reconnues
 * Basée sur les spécialités médicales officielles
 */

const MEDICAL_SPECIALTIES = [
  // Spécialités générales
  { name: 'Médecine Générale', code: 'GENERAL', description: 'Soins de santé primaires et prévention', icon: 'stethoscope', color: '#3B82F6' },

  // Spécialités chirurgicales
  { name: 'Chirurgie Générale', code: 'CHIRGEN', description: 'Interventions chirurgicales générales', icon: 'scissors', color: '#EF4444' },
  { name: 'Chirurgie Cardiaque', code: 'CHIRCARD', description: 'Chirurgie du cœur et des vaisseaux', icon: 'heart', color: '#DC2626' },
  { name: 'Chirurgie Orthopédique', code: 'ORTHOPED', description: 'Chirurgie des os et articulations', icon: 'bone', color: '#F59E0B' },
  { name: 'Neurochirurgie', code: 'NEUROCHIR', description: 'Chirurgie du système nerveux', icon: 'brain', color: '#8B5CF6' },
  { name: 'Chirurgie Plastique', code: 'CHIRPLAS', description: 'Chirurgie reconstructrice et esthétique', icon: 'sparkles', color: '#EC4899' },
  { name: 'Chirurgie Pédiatrique', code: 'CHIRPED', description: 'Chirurgie infantile', icon: 'baby', color: '#10B981' },

  // Spécialités médicales
  { name: 'Cardiologie', code: 'CARDIO', description: 'Maladies cardiovasculaires', icon: 'heart-pulse', color: '#EF4444' },
  { name: 'Dermatologie', code: 'DERMATO', description: 'Maladies de la peau', icon: 'droplet', color: '#F59E0B' },
  { name: 'Endocrinologie', code: 'ENDO', description: 'Troubles hormonaux et métaboliques', icon: 'activity', color: '#14B8A6' },
  { name: 'Gastro-entérologie', code: 'GASTRO', description: 'Système digestif', icon: 'pill', color: '#06B6D4' },
  { name: 'Gériatrie', code: 'GERIATRIE', description: 'Médecine des personnes âgées', icon: 'user', color: '#9CA3AF' },
  { name: 'Gynécologie', code: 'GYNECO', description: 'Santé reproductive féminine', icon: 'venus', color: '#EC4899' },
  { name: 'Hématologie', code: 'HEMATO', description: 'Maladies du sang', icon: 'droplet', color: '#DC2626' },
  { name: 'Médecine Interne', code: 'MEDINTERNE', description: 'Diagnostic et traitement global', icon: 'clipboard-check', color: '#6366F1' },
  { name: 'Néphrologie', code: 'NEPHRO', description: 'Maladies rénales', icon: 'filter', color: '#0EA5E9' },
  { name: 'Neurologie', code: 'NEURO', description: 'Système nerveux', icon: 'brain', color: '#8B5CF6' },
  { name: 'Oncologie', code: 'ONCO', description: 'Cancers et tumeurs', icon: 'shield', color: '#7C3AED' },
  { name: 'Pédiatrie', code: 'PEDIATRIE', description: 'Médecine infantile', icon: 'baby', color: '#10B981' },
  { name: 'Pneumologie', code: 'PNEUMO', description: 'Maladies respiratoires', icon: 'wind', color: '#06B6D4' },
  { name: 'Psychiatrie', code: 'PSYCHIA', description: 'Santé mentale', icon: 'brain', color: '#6366F1' },
  { name: 'Rhumatologie', code: 'RHUMATO', description: 'Maladies articulaires et osseuses', icon: 'bone', color: '#F59E0B' },

  // Spécialités techniques
  { name: 'Anesthésiologie', code: 'ANESTH', description: 'Anesthésie et réanimation', icon: 'syringe', color: '#6B7280' },
  { name: 'Radiologie', code: 'RADIO', description: 'Imagerie médicale', icon: 'scan', color: '#8B5CF6' },
  { name: 'Médecine Nucléaire', code: 'MEDNUC', description: 'Imagerie et traitement nucléaire', icon: 'radiation', color: '#F59E0B' },
  { name: 'Pathologie', code: 'PATHO', description: 'Analyse anatomopathologique', icon: 'microscope', color: '#4B5563' },
  { name: 'Biologie Médicale', code: 'BIOMED', description: 'Analyses de laboratoire', icon: 'flask', color: '#14B8A6' },

  // Spécialités sensorielles
  { name: 'Ophtalmologie', code: 'OPHTALMO', description: 'Maladies oculaires', icon: 'eye', color: '#06B6D4' },
  { name: 'ORL', code: 'ORL', description: 'Oreille, nez, gorge', icon: 'ear', color: '#10B981' },

  // Autres spécialités
  { name: 'Dentisterie', code: 'DENT', description: 'Santé bucco-dentaire', icon: 'tooth', color: '#14B8A6' },
  { name: 'Médecine du Travail', code: 'MEDTRAV', description: 'Santé au travail', icon: 'briefcase', color: '#F59E0B' },
  { name: 'Médecine du Sport', code: 'MEDSPORT', description: 'Santé des sportifs', icon: 'activity', color: '#10B981' },
  { name: 'Médecine Physique', code: 'MEDPHYS', description: 'Réadaptation et rééducation', icon: 'repeat', color: '#3B82F6' },
  { name: 'Médecine d\'Urgence', code: 'URGENCE', description: 'Soins d\'urgence', icon: 'ambulance', color: '#EF4444' },
  { name: 'Urologie', code: 'URO', description: 'Appareil urinaire', icon: 'droplet', color: '#06B6D4' },
  { name: 'Allergologie', code: 'ALLERGO', description: 'Allergies et immunologie', icon: 'alert-circle', color: '#F59E0B' },
  { name: 'Nutrition', code: 'NUTRITION', description: 'Diététique et nutrition', icon: 'apple', color: '#10B981' },
  { name: 'Génétique Médicale', code: 'GENETIC', description: 'Maladies génétiques', icon: 'dna', color: '#8B5CF6' },
  { name: 'Médecine Légale', code: 'MEDLEGALE', description: 'Expertise médico-légale', icon: 'gavel', color: '#6B7280' },
];

/**
 * Obtenir toutes les spécialités disponibles
 */
const getAvailableSpecialties = () => {
  return MEDICAL_SPECIALTIES.map(specialty => ({
    ...specialty,
    defaultDailyLimit: getDefaultDailyLimit(specialty.code),
    defaultDuration: getDefaultDuration(specialty.code)
  }));
};

/**
 * Obtenir une spécialité par son code
 */
const getSpecialtyByCode = (code) => {
  return MEDICAL_SPECIALTIES.find(s => s.code === code);
};

/**
 * Obtenir une spécialité par son nom
 */
const getSpecialtyByName = (name) => {
  return MEDICAL_SPECIALTIES.find(s => s.name === name);
};

/**
 * Limites quotidiennes par défaut selon le type de spécialité
 */
const getDefaultDailyLimit = (code) => {
  const limits = {
    // Spécialités à fort volume
    'GENERAL': 30,
    'PEDIATRIE': 25,
    'DENT': 25,
    'DERMATO': 25,

    // Spécialités à volume moyen
    'CARDIO': 15,
    'GYNECO': 18,
    'OPHTALMO': 20,
    'ORL': 20,
    'URO': 18,
    'GASTRO': 15,
    'PNEUMO': 15,
    'RHUMATO': 18,
    'ENDO': 15,
    'ALLERGO': 20,

    // Spécialités techniques à volume élevé
    'RADIO': 40,
    'BIOMED': 50,

    // Spécialités chirurgicales (plus long)
    'CHIRGEN': 10,
    'CHIRCARD': 8,
    'ORTHOPED': 12,
    'NEUROCHIR': 6,
    'CHIRPLAS': 10,
    'CHIRPED': 10,

    // Spécialités spécifiques
    'NEURO': 12,
    'PSYCHIA': 15,
    'ONCO': 12,
    'NEPHRO': 15,
    'HEMATO': 12,
    'URGENCE': 50,

    // Par défaut
    'DEFAULT': 20
  };

  return limits[code] || limits.DEFAULT;
};

/**
 * Durées moyennes par défaut selon le type de spécialité
 */
const getDefaultDuration = (code) => {
  const durations = {
    // Consultations rapides
    'URGENCE': 20,
    'MEDSPORT': 20,
    'MEDTRAV': 25,
    'ALLERGO': 25,

    // Consultations standards
    'GENERAL': 30,
    'PEDIATRIE': 30,
    'DERMATO': 25,
    'ORL': 30,
    'OPHTALMO': 30,
    'DENT': 30,

    // Consultations longues
    'CARDIO': 40,
    'NEURO': 45,
    'PSYCHIA': 50,
    'ONCO': 45,
    'GYNECO': 35,
    'ENDO': 40,
    'GASTRO': 40,
    'RHUMATO': 35,
    'NEPHRO': 40,

    // Consultations très longues
    'CHIRGEN': 60,
    'CHIRCARD': 90,
    'ORTHOPED': 45,
    'NEUROCHIR': 90,
    'CHIRPLAS': 60,

    // Spécialités techniques
    'RADIO': 20,
    'MEDNUC': 30,
    'PATHO': 30,
    'BIOMED': 15,

    // Par défaut
    'DEFAULT': 30
  };

  return durations[code] || durations.DEFAULT;
};

module.exports = {
  MEDICAL_SPECIALTIES,
  getAvailableSpecialties,
  getSpecialtyByCode,
  getSpecialtyByName,
  getDefaultDailyLimit,
  getDefaultDuration
};