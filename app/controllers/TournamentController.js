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
			.findOne({where: {tournamentId: req.query.tournamentId.trim()}, transaction: t, lock: 'SHARE'})
			.then((tournament) => {
				if (!tournament) throw createError(404, 'Tournament not found');
				if (tournament.status === 'closed') throw createError(400, 'Tournament closed');

				const leaderId = req.query.playerId;
				let backersId = req.query.backerId;
				let allPlayes = [];


				// get all players
				if(backersId && !Array.isArray(backersId)) backersId = [backersId];
				if(!backersId) backersId = [];
				allPlayes = backersId;
				allPlayes.push(leaderId);
				allPlayes.map((el)=>el.trim());

				//lock all players
				return models.Player.findAll({
					attributes: [sequelize.literal('1')],
					where: {
						playerId: {
							$in: allPlayes
						}
					},
					transaction: t,
					lock: 'UPDATE'
				})
					.then(()=>{

						return models.Player
							.findOne({where: {playerId: req.query.playerId.trim()}, attributes: ['playerId'], transaction: t, lock: 'UPDATE'})
							.then((leader) => {
								if(!leader) throw createError(404, 'Player not found');

								playersModels.push(leader);
								playersIds.push(leader.playerId);

								backersId.forEach((item) => {
									backersPromisesChain = backersPromisesChain.then(() => {
										if(playersIds.indexOf(item.trim()) === -1 ) {
											return models.Player
												.findOne({where: {playerId: item.trim()}, transaction: t, lock: 'UPDATE'})
												.then((backer) => {
													if(!backer) throw createError(404, 'Backer ' + item + ' not found');
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
	let winnersAll = [];

	req.body.winners.forEach((winnerItem) => {
		winnersAll.push(winnerItem.playerId.trim());
	});

	return sequelize.transaction(function(t) {

		return models.Invest
			.findOne({
				attributes: [sequelize.literal('1')],
				where:{
					tournamentId: req.body.tournamentId.trim(),
					leaderId: {
						$in: winnersAll
					},
				},
				include: [
					{
						as: 'player',
						model: models.Player,
						attributes: []
					},
					{
						as: 'leader',
						model: models.Player,
						attributes: []
					},
					{
						as: 'tournament',
						model: models.Tournament,
						attributes: []
					},
				],
				transaction: t,
				lock: 'UPDATE'
			})
			.then(() => {

				// find Tournament
				return models.Tournament
					.findOne({where: {tournamentId: req.body.tournamentId.trim()}, transaction: t})
					.then((tournament) => {
						if(!tournament) throw createError(404, 'Tournament not found');
						if(tournament.status === 'closed') throw createError(400, 'Tournament closed');

						req.body.winners.forEach((winnerItem) => {
							transactionPromisesChain = transactionPromisesChain.then(() => {

								if(!winnerItem.prize) throw createError(400, 'prize need');
								if(!winnerItem.prize.toString().match(/^[0-9]+$/)) throw createError(400, 'prize must be number');
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
			});


	})
		.catch((err) => {
			next(createError(err));
		});

};
