const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Server = require('./Server');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('text', 'voice'),
    defaultValue: 'text'
  }
});

Server.hasMany(Channel, { foreignKey: 'serverId', as: 'channels' });
Channel.belongsTo(Server, { foreignKey: 'serverId' });

module.exports = Channel;
