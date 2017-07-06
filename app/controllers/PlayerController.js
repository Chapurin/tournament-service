const createError = require('http-errors');
const models = require('../models');

exports.fund = function(req, res, next){
	if(!req.query.playerId) return next(createError(400, 'playerId need'));
	if(!req.query.points) return next(createError(400, 'points need'));
	if(!req.query.points.match(/^[0-9]+$/)) return next(createError(400, 'points must be number'));
	if(+req.query.points <= 0 ) return next(createError(400, 'points cant be zero or below'));

	models.Player
		.findOrCreate({where: {playerId: req.query.playerId.trim()}})
		.spread((model) => {
			return model.updateAttributes({playerId: model.playerId, points: +model.points + +req.query.points})
				.then(() => res.end())
				.catch((err) => next(createError(err)));
		})
		.catch((err) => next(createError(err)));
};


exports.takePoints = function(req, res, next){
	if(!req.query.playerId) return next(createError(400, 'playerId need'));
	if(!req.query.points) return next(createError(400, 'points need'));
	if(!req.query.points.match(/^[0-9]+$/)) return next(createError(400, 'points must be number'));
	if(+req.query.points <= 0 ) return next(createError(400, 'points cant be zero or below'));

	models.Player
		.findOne({where: {playerId: req.query.playerId.trim()}})
		.then((model) => {
			if(!model) return next(createError(404, 'Player not found'));
			if((model.points - +req.query.points) < 0)  return next(createError(400, 'The balance falls below zero'));

			return model.updateAttributes({playerId: model.playerId, points: +model.points - +req.query.points})
				.then(() => res.end())
				.catch((err) => next(createError(err)));
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
