const {
  BaseUser,
  MedicalRecord,
  MedicalRecordAccessRequest,
} = require("../models");
const { Op } = require("sequelize");

// 📌 Liste tous les patients (pagination + recherche optionnelle)
exports.getAllPatients = async (req, res) => {
  try {
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: "patient" };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    const patients = await BaseUser.findAndCountAll({
      where,
      attributes: ["id", "firstName", "lastName"],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["lastName", "ASC"]],
    });

    res.json({
      patients: patients.rows,
      total: patients.count,
      page: parseInt(page),
      totalPages: Math.ceil(patients.count / limit),
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Liste des patients auxquels le médecin a accès (pour créer des dossiers)
exports.getAccessiblePatients = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Seuls les médecins peuvent accéder à cette fonctionnalité",
        success: false
      });
    }

    const { search } = req.query;

    // Get all patients the doctor has approved access to
    const accessRequests = await MedicalRecordAccessRequest.findAll({
      where: {
        requesterId: req.user.id,
        status: 'approved',
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      include: [
        {
          model: BaseUser,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
          where: search ? {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${search}%` } },
              { lastName: { [Op.iLike]: `%${search}%` } },
              { email: { [Op.iLike]: `%${search}%` } },
            ]
          } : {}
        }
      ],
      order: [['patient', 'lastName', 'ASC']]
    });

    const patients = accessRequests.map(request => ({
      id: request.patient.id,
      firstName: request.patient.firstName,
      lastName: request.patient.lastName,
      email: request.patient.email,
      phoneNumber: request.patient.phoneNumber,
      accessLevel: request.accessLevel,
      accessGrantedAt: request.reviewedAt,
      expiresAt: request.expiresAt
    }));

    res.json({
      success: true,
      patients,
      total: patients.length,
      message: `${patients.length} patient(s) accessible(s)`
    });

  } catch (error) {
    console.error("Get accessible patients error:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des patients accessibles",
      error: error.message,
      success: false
    });
  }
};

// 📌 Récupère un patient par son ID
exports.getPatientById = async (req, res) => {
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
            message: "Access denied - no permission to view this patient",
          });
      }
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
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Get patient by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
    console.log("le patient existe");

    // Calculer les statistiques
    const totalRecords = await MedicalRecord.count({
      where: { patientId },
    });
    console.log("total records:", totalRecords);

    const recordsByType = await MedicalRecord.findAll({
      where: { patientId },
      attributes: [
        "type",
        [
          MedicalRecord.sequelize.fn(
            "COUNT",
            MedicalRecord.sequelize.col("type")
          ),
          "count",
        ],
      ],
      group: ["type"],
    });
    console.log("records by type:", recordsByType);

    const recentRecords = await MedicalRecord.findAll({
      where: {
        patientId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Derniers 30 jours
        },
      },
    });
    console.log("recent records count:", recentRecords.length);

    // Récupérer la date du dernier dossier séparément
    let lastRecordDate = null;
    if (totalRecords > 0) {
      const lastRecord = await MedicalRecord.findOne({
        where: { patientId },
        order: [["createdAt", "DESC"]],
        attributes: ["createdAt"],
      });
      lastRecordDate = lastRecord ? lastRecord.createdAt : null;
    }

    // Construire l'objet recordsByType de façon sécurisée
    const recordsByTypeObj = {};
    recordsByType.forEach(item => {
      try {
        // Essayer différentes façons d'accéder au count
        const count = item.dataValues?.count || item.get('count') || 0;
        const type = item.dataValues?.type || item.get('type') || item.type;
        recordsByTypeObj[type] = parseInt(count) || 0;
      } catch (err) {
        console.error('Error processing recordsByType item:', err);
      }
    });

    const stats = {
      totalRecords: totalRecords || 0,
      recentRecordsCount: recentRecords.length || 0,
      recordsByType: recordsByTypeObj,
      lastRecordDate: lastRecordDate
    };

    console.log("Sending stats:", JSON.stringify(stats, null, 2));
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get patient stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
