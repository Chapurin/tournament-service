const createError = require('http-errors');
const sequelize = require('../orm');
const models = require('../models');

exports.announceTournament = function(req, res, next){

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

	let playersModels = [];
	let playersIds = [];
	let backersPromisesChain = Promise.resolve();
	let transactionPromisesChain = Promise.resolve();

	return models.Tournament
		.findOne({where: {tournamentId: req.query.tournamentId.trim()}})
		.then((tournament) => {
			if(!tournament) return next(createError(404, 'Tournament not found'));
			if(tournament.status === 'closed') return next(createError(400, 'Tournament closed'));


			return models.Player
			  .findOne({where: {playerId: req.query.playerId.trim()}})
				.then((leader) => {
					if(!leader) return next(createError(404, 'Player not found'));

					playersModels.push(leader);
					playersIds.push(leader.playerId);

					console.log(req.query.backerId);

					if(req.query.backerId && !Array.isArray(req.query.backerId)) {
						req.query.backerId = [req.query.backerId];
					}


					if(Array.isArray(req.query.backerId)) {

						req.query.backerId.forEach((item) => {
							console.log(item);

							backersPromisesChain = backersPromisesChain.then(() => {
								if(playersIds.indexOf(item.trim()) === -1 ) {

									return models.Player
										.findOne({where: {playerId: item.trim()}})
										.then((backer) => {
											if(!backer) return next(createError(404, 'Backer ' + item + ' not found'));
											playersModels.push(backer);
											playersIds.push(backer.playerId);
										})
										.catch((err) => next(createError(err)));
								}
							});

						});

					}

					backersPromisesChain.then(() => {

						let investPointsProportion = +(tournament.deposit / playersIds.length);

						console.log(playersIds);

						return sequelize.transaction(function (t) {

							playersModels.forEach((playerItem) => {
								transactionPromisesChain = transactionPromisesChain.then(() => {
									return playerItem
										.updateAttributes({points: playerItem.points - investPointsProportion}, {transaction:t})
										.then((model) => {

											if(model.points < 0) {
												t.rollback();
												return next(createError(400, 'Player ' + model.playerId + ' not enough points '));
											}

											return models.Invest
												.create({tournamentId: tournament.tournamentId, playerId: playerItem.playerId, leaderId: playersIds[0]}, {transaction:t})
												.catch((err) => {
													t.rollback();
													return next(createError(err));
												});

										})
										.catch((err) => {
											t.rollback();
											return next(createError(err));
										});
								})
							});
							return transactionPromisesChain;

						})
							.then(() => {
								res.end();
							})
							.catch((err) => {
								next(createError(err));
							});

					})

				});

		})
		.catch((err) => next(createError(err)));
};


exports.setResultTournament = function(req, res, next){

	if(!req.body.tournamentId) return next(createError(400, 'tournamentId need'));
	if(!req.body.winners) return next(createError(400, 'winners need'));
	if(!Array.isArray(req.body.winners)) return next(createError(400, 'winners must be array'));

	let playersModels = [];
	let playersIds = [];
	let proportionPrize  = 0;
	let transactionPromisesChain = Promise.resolve();


	return models.Tournament
		.findOne({where: {tournamentId: req.body.tournamentId.trim()}})
		.then((tournament) => {
			if(!tournament) return next(createError(404, 'Tournament not found'));
			if(tournament.status === 'closed') return next(createError(400, 'Tournament closed'));


			return sequelize.transaction(function (t) {

				// winners list
				req.body.winners.forEach((winnerItem) => {
					playersModels = [];
					playersIds = [];


					transactionPromisesChain = transactionPromisesChain.then(() => {

						if(!winnerItem.prize) return next(createError(400, 'prize need'));

						if(winnerItem.playerId) {
							return models.Player
								.findOne({where: {playerId: winnerItem.playerId.trim()}})
								.then((player) => {
									if(!player) return next(createError(404, 'Player ' + winnerItem.playerId.trim() + ' not found'));


									return models.Invest
										.findOne({where: {playerId: player.playerId, leaderId: player.playerId, tournamentId: tournament.tournamentId}})
										.then((invest) => {

											return models.Invest
												.findAll({where: {leaderId: invest.leaderId, tournamentId: tournament.tournamentId}})
												.then((winners) => {
													proportionPrize = +winnerItem.prize / winners.length;
													let promises = [];
													winners.forEach((winner) => {
														promises.push(models.Player
															.update({points: sequelize.literal('points +' + proportionPrize)}, {where:{playerId: winner.playerId}, transaction:t})
															.catch((err) => {
																t.rollback();
																return next(createError(err));
															}));

													});
													return Promise.all(promises)
														.catch((err) => {
															t.rollback();
															return next(createError(err));
														});

												})
												.catch((err) => {
													t.rollback();
													return next(createError(err));
												});

										})
										.catch((err) => {
											t.rollback();
											return next(createError(err));
										});

								})
								.catch((err) => {
									t.rollback();
									return next(createError(err));
								});

						}

					});


				});

				transactionPromisesChain = transactionPromisesChain.then(() => {

					return tournament.updateAttributes({status: 'closed'},{transaction:t})
						.catch((err) => {
							t.rollback();
							return next(createError(err));
						});

				});
				return transactionPromisesChain;
			})
				.then(() => {
					res.end();
				});

		});

};
