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
      is: /^[+]?[0-9\s\-]{6,20}$/i // Vérifie un format de numéro basique
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
      is: /^[+]?[0-9\s\-]{6,20}$/i
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
