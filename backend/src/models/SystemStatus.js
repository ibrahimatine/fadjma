const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');

const SystemStatus = sequelize.define('SystemStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  component: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['database', 'hedera', 'websocket', 'api', 'blockchain', 'storage', 'authentication']]
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['operational', 'degraded', 'outage', 'maintenance']]
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['component', 'timestamp']
    },
    {
      fields: ['status']
    }
  ]
});

// Association avec BaseUser
SystemStatus.belongsTo(BaseUser, {
  as: 'updater',
  foreignKey: 'updatedBy'
});

module.exports = SystemStatus;