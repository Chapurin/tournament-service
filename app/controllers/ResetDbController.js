const createError = require('http-errors');
const models = require('../models/index');
const sequelize = require('../orm');

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

		Models.forEach(function(Model) {
			chain = chain
				.then(() => Model.sync({force: true, transaction: t}))
		});

		chain = chain.then(() => {
			return sequelize.query('SET FOREIGN_KEY_CHECKS = 1', {transaction: t})
		});

		return chain;

	})
		.then(() => {res.end()})
		.catch((err) => next(createError(err)));
};
