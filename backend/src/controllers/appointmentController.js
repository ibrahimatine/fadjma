const { Appointment, Specialty, DoctorSpecialty, DoctorAvailability, BaseUser } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { getAvailableSpecialties, getSpecialtyByName } = require('../config/medicalSpecialties');

// Obtenir la liste des spécialités médicales disponibles (non encore créées)
exports.getAvailableMedicalSpecialties = async (req, res) => {
  try {
    // Obtenir toutes les spécialités médicales de la configuration
    const allMedicalSpecialties = getAvailableSpecialties();

    // Obtenir les spécialités déjà créées dans la base de données
    const existingSpecialties = await Specialty.findAll({
      attributes: ['code']
    });

    const existingCodes = existingSpecialties.map(s => s.code);

    // Filtrer pour ne retourner que les spécialités non encore créées
    const availableSpecialties = allMedicalSpecialties.filter(
      specialty => !existingCodes.includes(specialty.code)
    );

    res.json({
      success: true,
      specialties: availableSpecialties,
      total: availableSpecialties.length
    });

  } catch (error) {
    logger.error('Error fetching available medical specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des spécialités disponibles'
    });
  }
};

// Admin - Mettre à jour une spécialité
exports.updateSpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;
    const { name, description, dailyAppointmentLimit, averageConsultationDuration, color, icon, isActive } = req.body;

    const specialty = await Specialty.findByPk(specialtyId);

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }

    // Valider la limite de rendez-vous quotidiens
    if (dailyAppointmentLimit !== undefined && (dailyAppointmentLimit < 1 || dailyAppointmentLimit > 100)) {
      return res.status(400).json({
        success: false,
        message: 'La limite de rendez-vous doit être entre 1 et 100'
      });
    }

    // Valider la durée de consultation
    if (averageConsultationDuration !== undefined && (averageConsultationDuration < 10 || averageConsultationDuration > 120)) {
      return res.status(400).json({
        success: false,
        message: 'La durée de consultation doit être entre 10 et 120 minutes'
      });
    }

    await specialty.update({
      name: name || specialty.name,
      description: description !== undefined ? description : specialty.description,
      dailyAppointmentLimit: dailyAppointmentLimit !== undefined ? dailyAppointmentLimit : specialty.dailyAppointmentLimit,
      averageConsultationDuration: averageConsultationDuration !== undefined ? averageConsultationDuration : specialty.averageConsultationDuration,
      color: color || specialty.color,
      icon: icon !== undefined ? icon : specialty.icon,
      isActive: isActive !== undefined ? isActive : specialty.isActive
    });

    logger.info(`Specialty ${specialtyId} updated by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Spécialité mise à jour avec succès',
      specialty
    });

  } catch (error) {
    logger.error('Error updating specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la spécialité'
    });
  }
};

// Admin - Créer une nouvelle spécialité
exports.createSpecialty = async (req, res) => {
  try {
    const { name, code, description, dailyAppointmentLimit, averageConsultationDuration, color, icon } = req.body;

    // Vérifier si le code existe déjà
    const existingSpecialty = await Specialty.findOne({ where: { code } });
    if (existingSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Une spécialité avec ce code existe déjà'
      });
    }

    // Vérifier que la spécialité existe dans la liste des spécialités reconnues
    const medicalSpecialty = getSpecialtyByName(name);
    if (!medicalSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Cette spécialité n\'est pas reconnue. Veuillez choisir dans la liste.'
      });
    }

    // Si les valeurs par défaut ne sont pas fournies, utiliser celles de la configuration
    const specialty = await Specialty.create({
      name: medicalSpecialty.name,
      code: medicalSpecialty.code,
      description: description || medicalSpecialty.description,
      dailyAppointmentLimit: dailyAppointmentLimit || medicalSpecialty.defaultDailyLimit,
      averageConsultationDuration: averageConsultationDuration || medicalSpecialty.defaultDuration,
      color: color || medicalSpecialty.color,
      icon: icon || medicalSpecialty.icon,
      isActive: true
    });

    logger.info(`New specialty created by admin ${req.user.id}: ${specialty.name}`);

    res.status(201).json({
      success: true,
      message: 'Spécialité créée avec succès',
      specialty
    });

  } catch (error) {
    logger.error('Error creating specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la spécialité'
    });
  }
};

// Obtenir toutes les spécialités (y compris inactives pour admin)
exports.getAllSpecialtiesForAdmin = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      attributes: ['id', 'name', 'code', 'description', 'color', 'icon', 'averageConsultationDuration', 'dailyAppointmentLimit', 'isActive', 'createdAt'],
      include: [{
        model: DoctorSpecialty,
        as: 'doctors',
        include: [{
          model: BaseUser,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        }]
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      specialties: specialties.map(s => ({
        ...s.toJSON(),
        doctorCount: s.doctors?.length || 0
      }))
    });

  } catch (error) {
    logger.error('Error fetching all specialties for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des spécialités'
    });
  }
};

// Obtenir toutes les spécialités (publiques - seulement actives)
exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'code', 'description', 'color', 'icon', 'averageConsultationDuration', 'dailyAppointmentLimit'],
      include: [{
        model: DoctorSpecialty,
        as: 'doctors',
        include: [{
          model: BaseUser,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName'],
          where: { isActive: true }
        }]
      }]
    });

    res.json({
      success: true,
      specialties: specialties.map(s => ({
        ...s.toJSON(),
        doctorCount: s.doctors?.length || 0
      }))
    });

  } catch (error) {
    logger.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des spécialités'
    });
  }
};

// Obtenir les médecins par spécialité
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;

    const doctorSpecialties = await DoctorSpecialty.findAll({
      where: { specialtyId },
      include: [{
        model: BaseUser,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        where: { isActive: true, role: 'doctor' }
      }, {
        model: Specialty,
        as: 'specialty',
        attributes: ['name', 'code']
      }]
    });

    res.json({
      success: true,
      doctors: doctorSpecialties.map(ds => ({
        ...ds.doctor.toJSON(),
        specialty: ds.specialty,
        isPrimary: ds.isPrimary,
        yearsOfExperience: ds.yearsOfExperience
      }))
    });

  } catch (error) {
    logger.error('Error fetching doctors by specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins'
    });
  }
};

// Obtenir les disponibilités d'un médecin
exports.getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const availabilities = await DoctorAvailability.findAll({
      where: {
        doctorId,
        isActive: true
      },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });

    res.json({
      success: true,
      availabilities
    });

  } catch (error) {
    logger.error('Error fetching doctor availability:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des disponibilités'
    });
  }
};

// Obtenir les créneaux disponibles pour un médecin à une date donnée
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise'
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Récupérer les disponibilités du médecin pour ce jour
    const availabilities = await DoctorAvailability.findAll({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true
      }
    });

    if (availabilities.length === 0) {
      return res.json({
        success: true,
        slots: []
      });
    }

    // Récupérer les RDV existants pour ce jour
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    // Générer les créneaux disponibles
    const slots = [];
    availabilities.forEach(avail => {
      const slotDuration = avail.slotDuration;
      let currentTime = new Date(`1970-01-01T${avail.startTime}`);
      const endTime = new Date(`1970-01-01T${avail.endTime}`);

      while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().slice(0, 5);

        // Vérifier si ce créneau est déjà pris
        const isBooked = existingAppointments.some(apt =>
          apt.appointmentTime === timeStr + ':00'
        );

        if (!isBooked) {
          slots.push({
            time: timeStr,
            available: true
          });
        }

        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
    });

    res.json({
      success: true,
      date: date,
      slots: slots.sort((a, b) => a.time.localeCompare(b.time))
    });

  } catch (error) {
    logger.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des créneaux'
    });
  }
};

// Créer un rendez-vous (patient)
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, specialtyId, appointmentDate, appointmentTime, reason } = req.body;
    const patientId = req.user.id;

    // Vérifier la limite quotidienne pour la spécialité
    const specialty = await Specialty.findByPk(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }

    // Compter les RDV existants pour ce jour et cette spécialité
    const appointmentsCount = await Appointment.count({
      where: {
        specialtyId,
        appointmentDate,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (appointmentsCount >= specialty.dailyAppointmentLimit) {
      return res.status(400).json({
        success: false,
        message: `Limite de rendez-vous atteinte pour cette spécialité (${specialty.dailyAppointmentLimit}/jour)`
      });
    }

    // Vérifier que le créneau est disponible
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau n\'est plus disponible'
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      specialtyId,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'pending',
      duration: specialty.averageConsultationDuration
    });

    logger.info(`Appointment created: ${appointment.id} by patient ${patientId}`);

    // Récupérer le RDV avec les relations
    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code'] }
      ]
    });

    // Envoyer des notifications via WebSocket
    const io = req.app.get('io');
    if (io) {
      // Notifier le médecin
      io.notifyUser(doctorId, {
        type: 'new_appointment',
        appointmentId: appointment.id,
        message: `Nouvelle demande de rendez-vous de ${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName}`,
        specialty: fullAppointment.specialty.name,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime
      });

      // Notifier tous les assistants
      if (io.notifyAssistants) {
        io.notifyAssistants({
          type: 'new_appointment',
          appointmentId: appointment.id,
          message: `Nouveau rendez-vous à confirmer pour Dr. ${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName}`,
          doctorName: `${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName}`,
          patientName: `${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName}`,
          specialty: fullAppointment.specialty.name,
          appointmentDate: appointmentDate,
          appointmentTime: appointmentTime
        });
      }
    }

    res.status(201).json({
      success: true,
      appointment: fullAppointment
    });

  } catch (error) {
    logger.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous',
      error: error.message
    });
  }
};

// Obtenir mes rendez-vous (patient)
exports.getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status, upcoming } = req.query;

    let whereClause = { patientId };

    if (status) {
      whereClause.status = status;
    }

    if (upcoming === 'true') {
      whereClause.appointmentDate = { [Op.gte]: new Date() };
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code', 'color'] }
      ],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    logger.error('Error fetching my appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};

// Obtenir les rendez-vous du médecin
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, status } = req.query;

    let whereClause = { doctorId };

    if (date) {
      whereClause.appointmentDate = date;
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'phoneNumber'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code'] }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    logger.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};

// Confirmer un rendez-vous (médecin ou assistant)
exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (appointment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Ce rendez-vous ne peut pas être confirmé'
      });
    }

    await appointment.update({ status: 'confirmed' });

    logger.info(`Appointment ${id} confirmed by ${req.user.id}`);

    // Récupérer les infos complètes pour la notification
    const fullAppointment = await Appointment.findByPk(id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name'] }
      ]
    });

    // Notifier le patient de la confirmation
    const io = req.app.get('io');
    if (io && fullAppointment) {
      io.notifyUser(fullAppointment.patientId, {
        type: 'appointment_confirmed',
        appointmentId: id,
        message: `Votre rendez-vous avec Dr. ${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName} a été confirmé`,
        appointmentDate: fullAppointment.appointmentDate,
        appointmentTime: fullAppointment.appointmentTime
      });
    }

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    logger.error('Error confirming appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du rendez-vous'
    });
  }
};

// Annuler un rendez-vous
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier que l'utilisateur a le droit d'annuler
    if (req.user.role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas annuler ce rendez-vous'
      });
    }

    await appointment.update({
      status: 'cancelled',
      cancellationReason,
      cancelledBy: req.user.id,
      cancelledAt: new Date()
    });

    logger.info(`Appointment ${id} cancelled by ${req.user.id}`);

    // Récupérer les infos complètes pour la notification
    const fullAppointment = await Appointment.findByPk(id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name'] }
      ]
    });

    // Notifier les parties concernées
    const io = req.app.get('io');
    if (io && fullAppointment) {
      if (req.user.role === 'patient') {
        // Si le patient annule, notifier le médecin et les assistants
        io.notifyUser(fullAppointment.doctorId, {
          type: 'appointment_cancelled',
          appointmentId: id,
          message: `Le rendez-vous avec ${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName} a été annulé`,
          appointmentDate: fullAppointment.appointmentDate,
          appointmentTime: fullAppointment.appointmentTime,
          reason: cancellationReason
        });

        if (io.notifyAssistants) {
          io.notifyAssistants({
            type: 'appointment_cancelled',
            appointmentId: id,
            message: `Rendez-vous annulé par le patient`,
            patientName: `${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName}`,
            doctorName: `${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName}`,
            appointmentDate: fullAppointment.appointmentDate,
            appointmentTime: fullAppointment.appointmentTime
          });
        }
      } else {
        // Si le médecin/assistant annule, notifier le patient
        io.notifyUser(fullAppointment.patientId, {
          type: 'appointment_cancelled',
          appointmentId: id,
          message: `Votre rendez-vous avec Dr. ${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName} a été annulé`,
          appointmentDate: fullAppointment.appointmentDate,
          appointmentTime: fullAppointment.appointmentTime,
          reason: cancellationReason
        });
      }
    }

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du rendez-vous'
    });
  }
};

// Marquer un rendez-vous comme complété
exports.completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier ce rendez-vous'
      });
    }

    await appointment.update({
      status: 'completed',
      notes: notes || appointment.notes
    });

    logger.info(`Appointment ${id} completed by doctor ${req.user.id}`);

    res.json({
      success: true,
      appointment
    });

  } catch (error) {
    logger.error('Error completing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation du rendez-vous'
    });
  }
};

// Rendez-vous gérés par assistant
exports.getAssistantAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;

    let whereClause = {};

    if (date) {
      whereClause.appointmentDate = date;
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'phoneNumber'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code'] }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    logger.error('Error fetching assistant appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};

// Créer un rendez-vous pour le compte d'un patient (assistant)
exports.createAppointmentOnBehalf = async (req, res) => {
  try {
    const { patientId, doctorId, specialtyId, appointmentDate, appointmentTime, reason } = req.body;
    const managedBy = req.user.id;

    // Vérifier la limite quotidienne
    const specialty = await Specialty.findByPk(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }

    const appointmentsCount = await Appointment.count({
      where: {
        specialtyId,
        appointmentDate,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (appointmentsCount >= specialty.dailyAppointmentLimit) {
      return res.status(400).json({
        success: false,
        message: `Limite de rendez-vous atteinte pour cette spécialité`
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      specialtyId,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'confirmed', // Confirmé directement par l'assistant
      duration: specialty.averageConsultationDuration,
      managedBy
    });

    logger.info(`Appointment created by assistant ${managedBy} for patient ${patientId}`);

    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code'] }
      ]
    });

    res.status(201).json({
      success: true,
      appointment: fullAppointment
    });

  } catch (error) {
    logger.error('Error creating appointment on behalf:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous',
      error: error.message
    });
  }
};

// Placeholder pour gestion des appels téléphoniques
exports.getPhoneCalls = async (req, res) => {
  res.json({
    success: true,
    calls: [],
    message: 'Fonctionnalité à implémenter'
  });
};

// Reprogrammer un rendez-vous
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, reason } = req.body;
    const { id: userId, role } = req.user;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier les permissions
    if (role === 'patient' && appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Mettre à jour
    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    if (reason) appointment.reason = reason;
    appointment.status = 'pending'; // Repasser en attente

    await appointment.save();

    logger.info(`Appointment ${id} rescheduled by ${role} ${userId}`);

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'email'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName', 'email'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code'] }
      ]
    });

    res.json({
      success: true,
      appointment: updatedAppointment
    });

  } catch (error) {
    logger.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la reprogrammation'
    });
  }
};

// Recherche de patients pour l'assistant
exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        patients: []
      });
    }

    const patients = await BaseUser.findAll({
      where: {
        role: 'patient',
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { phoneNumber: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth'],
      limit: 10
    });

    res.json({
      success: true,
      patients
    });

  } catch (error) {
    logger.error('Error searching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};

// Voir tous les rendez-vous pour l'assistant
exports.getAllAppointmentsForAssistant = async (req, res) => {
  try {
    const { date, status, doctorId } = req.query;

    const where = {};

    if (date) {
      where.appointmentDate = date;
    }

    if (status) {
      where.status = status;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Specialty, as: 'specialty', attributes: ['name', 'code', 'color'] }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    res.json({
      success: true,
      appointments,
      total: appointments.length
    });

  } catch (error) {
    logger.error('Error getting all appointments for assistant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};