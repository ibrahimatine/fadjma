const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrescriptionGroupItem = sequelize.define('PrescriptionGroupItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'PrescriptionGroups',
      key: 'id'
    }
  },
  prescriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Prescriptions',
      key: 'id'
    }
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'prescriptionId']
    }
  ]
});

module.exports = PrescriptionGroupItem;