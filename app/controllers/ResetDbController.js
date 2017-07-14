const createError = require('http-errors');
const models = require('../models/index');
const sequelize = require('../orm');
const config = require('../configs');

const Models  = [
	models.Player,
	models.Tournament,
	models.Invest,
];

exports.reset = function(req, res, next){
	return sequelize.transaction(function (t) {
		let chain = Promise.resolve();

		chain = chain.then(() => {
			return sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {transaction: t})
		});

		chain = chain.then(() => {
			return sequelize.query(`SHOW TABLES 
															FROM ${config.db.postgres.name} 
															WHERE 
																	Tables_in_${config.db.postgres.name} LIKE 'players' 
																	OR Tables_in_${config.db.postgres.name} LIKE 'invest' 
																	OR Tables_in_${config.db.postgres.name} LIKE 'tournaments'`, {transaction: t})
				.then((tables)=>{
					if(tables[0].length === 3) return sequelize.query('LOCK TABLES players WRITE, invest WRITE, tournaments WRITE', {transaction: t})
				})
		});

		chain = chain.then(() => {
			return Promise.all([
				sequelize.query('DROP TABLE IF EXISTS `players`', {transaction: t}),
				sequelize.query('DROP TABLE IF EXISTS `invest`', {transaction: t}),
				sequelize.query('DROP TABLE IF EXISTS `tournaments`', {transaction: t}),
			]);

		});

		chain = chain.then(() => {
			return sequelize.query('UNLOCK TABLES', {transaction: t})
		});

		Models.forEach(function(Model) {
			chain = chain
				.then(() => Model.sync({force: false, transaction: t}))
		});

		chain = chain.then(() => {
			return sequelize.query('SET FOREIGN_KEY_CHECKS = 1', {transaction: t})
		});

		return chain;

	})
		.then(() => {res.end()})
		.catch((err) => next(createError(err)));
};
