const createError = require('http-errors');
const models = require('../models');
const sequelize = require('../orm');

exports.fund = function(req, res, next){
	if(!req.query.playerId) return next(createError(400, 'playerId need'));
	if(!req.query.points) return next(createError(400, 'points need'));
	if(!req.query.points.match(/^[0-9]+$/)) return next(createError(400, 'points must be number'));
	if(+req.query.points <= 0 ) return next(createError(400, 'points cant be zero or below'));

	return sequelize.transaction(function (t) {
		return models.Player
			.findOrCreate({where: {playerId: req.query.playerId.trim()}, transaction: t, lock: 'UPDATE'})
			.spread((model) => {
				return model.updateAttributes({playerId: model.playerId, points: sequelize.literal('points +' + +req.query.points)}, {transaction: t})
					.then(() => res.end())
					.catch((err) => {
						t.rollback();
						throw createError(err);
					});
			})
	})
		.catch((err) => next(err));
};


exports.takePoints = function(req, res, next){
	if(!req.query.playerId) return next(createError(400, 'playerId need'));
	if(!req.query.points) return next(createError(400, 'points need'));
	if(!req.query.points.match(/^[0-9]+$/)) return next(createError(400, 'points must be number'));
	if(+req.query.points <= 0 ) return next(createError(400, 'points cant be zero or below'));

	return sequelize.transaction(function (t) {
		return 	models.Player
			.findOne({where: {playerId: req.query.playerId.trim()}, transaction: t, lock: 'UPDATE'})
			.then((model) => {
				if(!model) return next(createError(404, 'Player not found'));
				if((model.points - +req.query.points) < 0)  return next(createError(400, 'The balance falls below zero'));

				return model.updateAttributes({playerId: model.playerId, points: sequelize.literal('points -' + +req.query.points)}, {transaction: t})
					.then(() => res.end())
			})
			.catch((err) => {
				t.rollback();
				throw createError(err);
			});
	})
		.catch((err) => next(createError(err)));
};


exports.getBalance = function(req, res, next){
	if(!req.query.playerId) return next(createError(400, 'playerId need'));

	models.Player
		.findOne({where: {playerId: req.query.playerId.trim()}})
		.then((model) => {
			if(!model) return next(createError(404, 'Player not found'));
			res.end(JSON.stringify({"playerId": model.playerId, "balance": model.points}));
		})
		.catch((err) => next(createError(err)));
};
