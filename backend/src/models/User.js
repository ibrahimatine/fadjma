const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
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
    type: DataTypes.STRING, // Pas d'ENUM pour garder la flexibilité
    defaultValue: 'patient',
    validate: {
      isIn: [['patient', 'doctor', 'admin', 'pharmacy']]
    }
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // 🔽 NOUVELLES INFORMATIONS COMPLÉMENTAIRES
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['male', 'female', 'other']] // Pour éviter des valeurs incohérentes
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
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
  },

  // Doctor specific fields
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hospital: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Pharmacy specific fields
  pharmacyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pharmacyAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Vérification du mot de passe
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Supprimer le mot de passe de la réponse JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
