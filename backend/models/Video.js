const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Speech/Debate event types
const EVENT_TYPES = [
  'ld', 'pf', 'policy', 'congress', 'bigquestions',
  'extemp', 'oratory', 'oi', 'di', 'hi', 'duo', 'poe',
  'informative', 'persuasive', 'impromptu', 'after_dinner',
  'lecture', 'drill', 'other'
];

const ROUND_TYPES = [
  'practice', 'prelim', 'double_octos', 'octos',
  'quarters', 'semis', 'finals', 'exhibition', 'lecture'
];

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 150]
    }
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  thumbnail: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Speech & Debate specific fields
  eventType: {
    type: DataTypes.STRING,
    defaultValue: 'other',
    validate: {
      isIn: [EVENT_TYPES]
    }
  },
  roundType: {
    type: DataTypes.STRING,
    defaultValue: 'practice',
    validate: {
      isIn: [ROUND_TYPES]
    }
  },
  tournament: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  topic: {
    type: DataTypes.TEXT, // Resolution or topic
    defaultValue: ''
  },
  tags: {
    type: DataTypes.TEXT, // JSON array of tags
    defaultValue: '[]'
  },
  side: {
    type: DataTypes.STRING, // AFF/NEG for debate, or empty for speech
    defaultValue: ''
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Script fields (for interp events or manual entry)
  script: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  scriptTitle: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  scriptAuthor: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  // Auto-generated transcript
  transcript: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  transcriptStatus: {
    type: DataTypes.STRING, // 'pending', 'processing', 'completed', 'failed'
    defaultValue: 'pending'
  }
});

// Add static property for event types
Video.EVENT_TYPES = EVENT_TYPES;
Video.ROUND_TYPES = ROUND_TYPES;

module.exports = Video;
