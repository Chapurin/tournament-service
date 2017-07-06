const createError = require('http-errors');
const models = require('../models');

exports.fund = function(req, res, next){
	models.Player
		.findOrCreate({where: {playerId: req.query.playerId.trim()}})
		.spread((model) => {

			if(+req.query.points >= 0) { // !Добавить валидацию
				return model.updateAttributes({playerId: model.playerId, points: +model.points + +req.query.points})
					.then(() => res.end());
			} else {
				res.end();
			}

		})
		.catch((err) => next(createError(err)));
};


exports.takePoints = function(req, res, next){
	models.Player
		.findOne({where: {playerId: req.query.playerId.trim()}})
		.then((model) => {
			if(!model) return next(createError(404, 'Player not found'));

			if(+req.query.points >= 0) { // !Добавить валидацию добавить !обработку ошибки баланс меньше нуля

				if((model.points - +req.query.points) < 0)  return next(createError(400, 'The balance falls below zero'));

				return model.updateAttributes({playerId: model.playerId, points: +model.points - +req.query.points})
					.then(() => res.end());

			} else {
				res.end();
			}

		})
		.catch((err) => next(createError(err)));
};


exports.getBalance = function(req, res, next){
	//

	models.Player
		.findOne({where: {playerId: req.query.playerId.trim()}})
		.then((model) => {
			if(!model) return next(createError(404, 'Player not found'));
			res.end(JSON.stringify({"playerId": model.playerId, "balance": model.points}));
		})
		.catch((err) => next(createError(err)));
};
