const sequelize = require('../config/database');
const User = require('./User');
const Video = require('./Video');
const Comment = require('./Comment');
const Like = require('./Like');

// User has many Videos
User.hasMany(Video, { foreignKey: 'userId', as: 'videos' });
Video.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User has many Comments
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Video has many Comments
Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' });
Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });

// User has many Likes
User.hasMany(Like, { foreignKey: 'userId', as: 'userLikes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Video has many Likes
Video.hasMany(Like, { foreignKey: 'videoId', as: 'videoLikes' });
Like.belongsTo(Video, { foreignKey: 'videoId', as: 'video' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Video,
  Comment,
  Like,
  syncDatabase
};
