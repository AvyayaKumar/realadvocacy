const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30]
    }
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
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  // Account type: competitor, organizer, or guest
  accountType: {
    type: DataTypes.STRING,
    defaultValue: 'competitor',
    validate: {
      isIn: [['competitor', 'organizer', 'guest']]
    }
  },
  // Profile fields
  fullName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  // Competitor-specific fields
  school: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  events: {
    type: DataTypes.TEXT, // JSON array
    defaultValue: '[]'
  },
  achievements: {
    type: DataTypes.TEXT, // JSON array
    defaultValue: '[]'
  },
  // Organizer-specific fields
  organization: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  organizationType: {
    type: DataTypes.STRING, // youth-group, nonprofit, activism, community
    defaultValue: ''
  },
  website: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  causes: {
    type: DataTypes.TEXT, // JSON array of causes they focus on
    defaultValue: '[]'
  },
  // Social
  followers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Password reset
  resetToken: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  try {
    values.events = JSON.parse(values.events || '[]');
    values.achievements = JSON.parse(values.achievements || '[]');
    values.causes = JSON.parse(values.causes || '[]');
  } catch (e) {
    values.events = [];
    values.achievements = [];
    values.causes = [];
  }
  return values;
};

// Helper to check permissions
User.prototype.canUpload = function() {
  return this.accountType === 'competitor' || this.accountType === 'organizer';
};

User.prototype.canComment = function() {
  return this.accountType !== 'guest';
};

User.prototype.canLike = function() {
  return this.accountType !== 'guest';
};

module.exports = User;
