const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl ? new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
}) : new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

module.exports = sequelize;
