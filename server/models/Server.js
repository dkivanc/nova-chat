const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Server = sequelize.define('Server', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  inviteCode: {
    type: DataTypes.STRING,
    unique: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Server;
