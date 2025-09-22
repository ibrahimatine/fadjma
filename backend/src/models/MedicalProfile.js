const MedicalProfile = sequelize.define('MedicalProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  bloodType: {
    type: DataTypes.STRING, // "A+", "O-", etc.
    allowNull: true
  },
  allergies: {
    type: DataTypes.JSON, // ex: ["penicillin", "nuts"]
    defaultValue: []
  },
  chronicDiseases: {
    type: DataTypes.JSON, // ex: ["diabetes", "hypertension"]
    defaultValue: []
  },
  surgeries: {
    type: DataTypes.JSON, // ex: [{ name: "appendectomy", date: "2022-04-10" }]
    defaultValue: []
  },
  vaccines: {
    type: DataTypes.JSON, // ex: [{ name: "Hepatitis B", date: "2024-02-14" }]
    defaultValue: []
  },
  mainDoctorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'Users', key: 'id' }
  },
  hash: { type: DataTypes.STRING, allowNull: true },
  hederaTransactionId: { type: DataTypes.STRING, allowNull: true },
  hederaTimestamp: { type: DataTypes.DATE, allowNull: true }
}, {
  timestamps: true
});
