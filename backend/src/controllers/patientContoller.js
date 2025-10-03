const {
  BaseUser,
  MedicalRecord,
  MedicalRecordAccessRequest,
} = require("../models");
const { Op } = require("sequelize");
const PatientIdentifierService = require("../services/patientIdentifierService");
const SecurityService = require("../services/securityService");
const AccessControlService = require('../services/accessControlService');
const PatientService = require('../services/patientService'); // Add this line
const ResponseHelper = require('../utils/responseHelper');
const { validationResult } = require('express-validator');

// 📌 Liste tous les patients (pagination + recherche optionnelle)
exports.getAllPatients = ResponseHelper.asyncHandler(async (req, res) => {
  if (!['doctor', 'admin', 'assistant'].includes(req.user.role)) {
    return ResponseHelper.forbidden(res, 'Access denied');
  }

  const { page, limit, offset } = ResponseHelper.validatePagination(req.query);
  const { search } = req.query;

  const where = { role: "patient" };

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phoneNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const patients = await BaseUser.findAndCountAll({
    where,
    attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
    limit,
    offset,
    order: [["lastName", "ASC"]],
  });

  const result = ResponseHelper.formatPaginatedResults(patients, page, limit);
  return ResponseHelper.successWithPagination(res, result.data, result.pagination, 'Patients retrieved successfully');
});

// 📌 Liste des patients auxquels le médecin a accès (pour créer des dossiers)
exports.getAccessiblePatients = ResponseHelper.asyncHandler(async (req, res) => {
  if (req.user.role !== "doctor") {
    return ResponseHelper.forbidden(res, "Seuls les médecins peuvent accéder à cette fonctionnalité");
  }

  const patients = await AccessControlService.getAccessiblePatientsForDoctor(req.user.id);

  // Apply search filter if provided
  const { search } = req.query;
  let filteredPatients = patients;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredPatients = patients.filter(patient =>
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower))
    );
  }

  return ResponseHelper.success(res, {
    patients: filteredPatients,
    total: filteredPatients.length
  }, `${filteredPatients.length} patient(s) accessible(s)`);
});

// 📌 Récupère un patient par son ID
exports.getPatientById = ResponseHelper.asyncHandler(async (req, res) => {
  if (!['doctor', 'admin'].includes(req.user.role)) {
    return ResponseHelper.forbidden(res, 'Access denied');
  }

  const patientId = req.params.id;

  // Check access permissions
  const canAccess = await AccessControlService.canAccessResource(req.user, 'patient', patientId);
  if (!canAccess) {
    return ResponseHelper.forbidden(res, 'Access denied - no permission to view this patient');
  }

  const patient = await BaseUser.findOne({
    where: { id: patientId, role: "patient" },
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "dateOfBirth",
      "gender",
      "address",
      "phoneNumber",
      "emergencyContactName",
      "emergencyContactPhone",
      "socialSecurityNumber",
      "isUnclaimed",
      "patientIdentifier"
    ],
  });

  if (!patient) {
    return ResponseHelper.notFound(res, 'Patient not found');
  }

  return ResponseHelper.success(res, patient, 'Patient retrieved successfully');
});

// 📌 Récupère les statistiques d'un patient
exports.getPatientStats = async (req, res) => {
  try {
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const patientId = req.params.id;

    // Check if doctor has access to this patient (only for doctors, not admin)
    if (req.user.role === "doctor") {
      const hasAccess = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId,
          requesterId: req.user.id,
          status: "approved",
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } },
          ],
        },
      });

      if (!hasAccess) {
        return res
          .status(403)
          .json({
            message:
              "Access denied - no permission to view this patient's statistics",
          });
      }
    }

    // Vérifier que le patient existe
    const patient = await BaseUser.findOne({
      where: { id: patientId, role: "patient" },
    });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const stats = await PatientService.getPatientStats(patientId);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get patient stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Creates an unclaimed patient profile (doctor only)
exports.createUnclaimedPatient = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Seuls les assistants peuvent créer des profils patients
    if (req.user.role !== "assistant") {
      return res.status(403).json({
        success: false,
        message: "Seuls les assistants peuvent créer des profils patients"
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      socialSecurityNumber
    } = req.body;

    // Create unclaimed patient profile
    const patient = await PatientIdentifierService.createUnclaimedPatient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      socialSecurityNumber
    }, req.user.id);

    // Automatically grant the doctor access to this patient
    await MedicalRecordAccessRequest.create({
      patientId: patient.id,
      requesterId: req.user.id,
      reason: 'Médecin créateur du profil patient',
      accessLevel: 'write',
      status: 'approved',
      reviewedBy: patient.id, // Self-approved since doctor created the profile
      reviewedAt: new Date()
    });

    // Log security event
    SecurityService.logSecurityEvent('UNCLAIMED_PATIENT_CREATED', {
      doctorId: req.user.id,
      patientId: patient.id,
      identifier: patient.patientIdentifier
    });

    // Format response for doctor
    const formattedPatient = PatientIdentifierService.formatPatientForDoctor(patient);

    res.status(201).json({
      success: true,
      message: 'Profil patient créé avec succès',
      data: {
        patient: formattedPatient,
        accessGranted: true
      }
    });

  } catch (error) {
    console.error("Create unclaimed patient error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du profil patient",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 📌 Gets unclaimed patients created by the current doctor
exports.getMyUnclaimedPatients = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Seuls les médecins peuvent accéder à cette fonctionnalité"
      });
    }

    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await PatientIdentifierService.getUnclaimedPatientsByDoctor(
      req.user.id,
      { limit: parseInt(limit), offset, search }
    );

    const formattedPatients = result.patients.map(patient =>
      PatientIdentifierService.formatPatientForDoctor(patient)
    );

    res.json({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(result.total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error("Get unclaimed patients error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des profils non réclamés",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 📌 Links a patient identifier to a user account (patient registration)
exports.linkPatientIdentifier = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { patientIdentifier, email, password, phoneNumber } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    const rateLimitOk = await SecurityService.checkRateLimit(patientIdentifier, clientIp);
    if (!rateLimitOk) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.'
      });
    }

    // Validate identifier format and security
    const identifierValidation = SecurityService.validatePatientIdentifier(patientIdentifier);
    if (!identifierValidation.valid) {
      return res.status(400).json({
        success: false,
        message: identifierValidation.error
      });
    }

    // Check linking eligibility
    const eligibilityCheck = await SecurityService.checkIdentifierLinkingEligibility(patientIdentifier, email);
    if (!eligibilityCheck.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibilityCheck.error
      });
    }

    // Link identifier to account
    const patient = await PatientIdentifierService.linkIdentifierToAccount(
      patientIdentifier,
      { email, password, phoneNumber }
    );

    // Log security event
    SecurityService.logSecurityEvent('PATIENT_IDENTIFIER_LINKED', {
      patientId: patient.id,
      identifier: patientIdentifier,
      email,
      ip: clientIp
    });

    res.json({
      success: true,
      message: 'Compte patient lié avec succès',
      data: {
        patientId: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email
      }
    });

  } catch (error) {
    console.error("Link patient identifier error:", error);

    let message = "Erreur serveur lors de la liaison du compte";
    let statusCode = 500;

    if (error.message.includes('not found') || error.message.includes('already claimed')) {
      message = 'Identifiant patient introuvable ou déjà utilisé';
      statusCode = 404;
    } else if (error.message.includes('already in use')) {
      message = 'Adresse email déjà utilisée';
      statusCode = 409;
    } else if (error.message.includes('Invalid')) {
      message = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 📌 Verifies a patient identifier (for patient registration form)
exports.verifyPatientIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    const rateLimitOk = await SecurityService.checkRateLimit(identifier, clientIp);
    if (!rateLimitOk) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer plus tard.'
      });
    }

    // Validate identifier format and security
    const identifierValidation = SecurityService.validatePatientIdentifier(identifier);
    if (!identifierValidation.valid) {
      return res.status(400).json({
        success: false,
        message: identifierValidation.error
      });
    }

    const patient = await PatientIdentifierService.findPatientByIdentifier(identifier);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Identifiant patient introuvable'
      });
    }

    if (!patient.isUnclaimed) {
      return res.status(409).json({
        success: false,
        message: 'Cet identifiant a déjà été utilisé pour créer un compte'
      });
    }

    // Log security event
    SecurityService.logSecurityEvent('PATIENT_IDENTIFIER_VERIFIED', {
      identifier,
      ip: clientIp,
      found: true
    });

    res.json({
      success: true,
      message: 'Identifiant valide',
      data: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        identifier: patient.patientIdentifier
      }
    });

  } catch (error) {
    console.error("Verify patient identifier error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification de l'identifiant",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
