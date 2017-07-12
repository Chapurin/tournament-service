const createError = require('http-errors');
const sequelize = require('../orm');
const models = require('../models');

exports.announceTournament = function(req, res, next){
	if(!req.query.tournamentId) return next(createError(400, 'tournamentId need'));
	if(!req.query.deposit) return next(createError(400, 'deposit need'));
	if(!req.query.deposit.match(/^[0-9]+$/)) return next(createError(400, 'deposit must be number'));
	if(+req.query.deposit <= 0 ) return next(createError(400, 'deposit cant be zero or below'));

	models.Tournament
		.findOrCreate({where: {tournamentId: req.query.tournamentId.trim(), deposit: req.query.deposit}})
		.spread((model, created) => {
			if(!created) return next(createError(409, 'Tournament already exists'));
			return res.end();
		})
		.catch((err) => next(createError(err)));

};


exports.playersJoinTournament = function(req, res, next){
	if(!req.query.tournamentId) return next(createError(400, 'tournamentId need'));
	if(!req.query.playerId) return next(createError(400, 'playerId need'));

	const playersModels = [];
	const playersIds = [];
	let backersPromisesChain = Promise.resolve();
	let transactionPromisesChain = Promise.resolve();

	return sequelize.transaction(function (t) {
		return models.Tournament
			.findOne({where: {tournamentId: req.query.tournamentId.trim()}, transaction: t})
			.then((tournament) => {
				if (!tournament) return next(createError(404, 'Tournament not found'));
				if (tournament.status === 'closed') return next(createError(400, 'Tournament closed'));

				return models.Player
					.findOne({where: {playerId: req.query.playerId.trim()}, transaction: t})
					.then((leader) => {
						if(!leader) return next(createError(404, 'Player not found'));

						playersModels.push(leader);
						playersIds.push(leader.playerId);

						if(req.query.backerId && !Array.isArray(req.query.backerId)) req.query.backerId = [req.query.backerId];
						if(!req.query.backerId) req.query.backerId = [];

						req.query.backerId.forEach((item) => {
							backersPromisesChain = backersPromisesChain.then(() => {
								if(playersIds.indexOf(item.trim()) === -1 ) {
									return models.Player
										.findOne({where: {playerId: item.trim()}, transaction: t})
										.then((backer) => {
											if(!backer) return next(createError(404, 'Backer ' + item + ' not found'));
											playersModels.push(backer);
											playersIds.push(backer.playerId);
										});
								}
							});
						});

						backersPromisesChain = backersPromisesChain.then(() => {
							const investPointsProportion = +tournament.deposit / playersIds.length;

							playersModels.forEach((playerItem) => {
								transactionPromisesChain = transactionPromisesChain.then(() => {
									return playerItem
										.updateAttributes({points: sequelize.literal('points -' + investPointsProportion)}, {transaction: t})
										.then((model) => {
											if(model.points < 0)  throw createError(400, 'Player ' + model.playerId + ' not enough points ');

											return models.Invest
												.create({tournamentId: tournament.tournamentId, playerId: playerItem.playerId, leaderId: playersIds[0]}, {transaction: t})
										});
								})
							});

							return transactionPromisesChain;
						});

						return backersPromisesChain;
					});

			})
			.then(() => {
				res.end();
			});
	})
		.catch((err) => {
			next(createError(err));
		});

};


exports.setResultTournament = function(req, res, next){
	if(!req.body.tournamentId) return next(createError(400, 'tournamentId need'));
	if(!req.body.winners) return next(createError(400, 'winners need'));
	if(!Array.isArray(req.body.winners)) return next(createError(400, 'winners must be array'));

	let transactionPromisesChain = Promise.resolve();

	return sequelize.transaction(function(t) {
		// find Tournament
		return models.Tournament
			.findOne({where: {tournamentId: req.body.tournamentId.trim()}, transaction: t})
			.then((tournament) => {
				if(!tournament) throw createError(404, 'Tournament not found');
				if(tournament.status === 'closed') throw createError(400, 'Tournament closed');

				req.body.winners.forEach((winnerItem) => {
					transactionPromisesChain = transactionPromisesChain.then(() => {
						if(!winnerItem.prize) throw createError(400, 'prize need');
						if(!winnerItem.prize.match(/^[0-9]+$/)) throw createError(400, 'prize must be number');
						if(+winnerItem.prize <= 0 ) throw createError(400, 'prize cant be zero or below');

						// find winner
						return models.Player
							.findOne({where: {playerId: winnerItem.playerId.trim()}, transaction: t})
							.then((player) => {
								if(!player) throw createError(404, 'Player ' + winnerItem.playerId.trim() + ' not found');

								// find winner invest
								return models.Invest
									.findOne({where: {playerId: player.playerId, leaderId: player.playerId, tournamentId: tournament.tournamentId}, transaction: t})
									.then((invest) => {
										if(!invest) throw createError(404, 'Invest for Player ' + player.playerId + ' not found');

										// find winner team
										return models.Invest
											.findAll({where: {leaderId: invest.leaderId, tournamentId: tournament.tournamentId}, transaction: t})
											.then((winners) => {
												if(!invest) throw createError(404, 'Invest for Player ' + invest.leaderId + ' not found');

												const proportionPrize = +winnerItem.prize / winners.length;
												const promises = [];

												// save new balance
												winners.forEach((winner) => {
													promises.push(
														models.Player
															.update({points: sequelize.literal('points +' + proportionPrize)}, {where:{playerId: winner.playerId}, transaction: t})
													);
												});

												return Promise.all(promises)
											});
									});
							})
					});
				});

				// close tournament
				transactionPromisesChain = transactionPromisesChain.then(() => {
					return tournament.updateAttributes({status: 'closed'},{ transaction: t} )
				});

				return transactionPromisesChain;
			})
			.then(() => {
				res.end();
			});

	})
		.catch((err) => {
			next(createError(err));
		});

};
