const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const BaseUser = sequelize.define('BaseUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for unclaimed patient profiles
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Allow null for unclaimed patient profiles
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['patient', 'doctor', 'pharmacy', 'admin']]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[+]?[0-9\s\-()]{0,20}$/i,
        msg: 'Le numéro de téléphone ne peut contenir que des chiffres, espaces, tirets et parenthèses'
      },
      len: {
        args: [0, 20],
        msg: 'Le numéro de téléphone ne peut pas dépasser 20 caractères'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Patient identifier for unclaimed profiles
  patientIdentifier: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      len: [8, 50]
    }
  },
  // Track if this is an unclaimed patient profile
  isUnclaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Doctor who created this unclaimed profile
  createdByDoctorId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  // Additional patient info for unclaimed profiles
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['male', 'female', 'other']]
    }
  },
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[+]?[0-9\s\-()]{0,20}$/i,
        msg: 'Le numéro de téléphone d\'urgence ne peut contenir que des chiffres, espaces, tirets et parenthèses'
      },
      len: {
        args: [0, 20],
        msg: 'Le numéro de téléphone d\'urgence ne peut pas dépasser 20 caractères'
      }
    }
  },
  socialSecurityNumber: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

BaseUser.prototype.validatePassword = async function(password) {
  if (!this.password) {
    return false; // Unclaimed profiles cannot authenticate
  }
  return bcrypt.compare(password, this.password);
};

BaseUser.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = BaseUser;