const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serverId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Message;
