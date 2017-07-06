const Sequelize = require('sequelize');
const sequelizeLogger = require('sequelize-log-syntax-colors');
const config = require('../configs');

const sequelize = new Sequelize(config.db.postgres.name, config.db.postgres.username, config.db.postgres.password, {
      host: config.db.postgres.host,
      dialect: config.db.postgres.dialect,
      port:    config.db.postgres.port,
      logging: sequelizeLogger
    }, {
      define: {
        underscored: true
      }
    });

module.exports = sequelize;
