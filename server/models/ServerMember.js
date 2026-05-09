const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const User = require('./User');
const Server = require('./Server');

const ServerMember = sequelize.define('ServerMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'member' // 'owner', 'admin', 'member'
  }
});

User.belongsToMany(Server, { through: ServerMember, foreignKey: 'userId' });
Server.belongsToMany(User, { through: ServerMember, foreignKey: 'serverId' });

module.exports = ServerMember;
