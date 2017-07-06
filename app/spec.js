const responsesCodes = {
	'200': {
		description: 'OK',
	},
	'400': {
		description: 'Bad Request'
	},
	'404': {
		description: 'Not found'
	},
	'50x': {
		description: 'Ошибка сервера'
	}
};



module.exports = {
	swagger: '2.0',
	info: {
		title: 'Sim-Track API',
		version: '1.0.0'
	},
	basePath: '/api',
	paths: {
		'/fund': {
			get: {
				tags: ['Player'],
				summary: 'Fund player account',
				parameters: [
					{
						name: 'playerId',
						type: 'string',
						in: 'query',
					},
					{
						name: 'points',
						type: 'integer',
						in: 'query',
					}
				],
				responses: responsesCodes
			},
		},
		'/take': {
			get: {
				tags: ['Player'],
				summary: 'Take player account',
				parameters: [
					{
						name: 'playerId',
						type: 'string',
						in: 'query',
					},
					{
						name: 'points',
						type: 'integer',
						in: 'query',
					}
				],
				responses: responsesCodes
			},
		},
		'/balance': {
			get: {
				tags: ['Player'],
				summary: 'Player balance',
				parameters: [
					{
						name: 'playerId',
						type: 'string',
						in: 'query',
					}
				],
				responses: responsesCodes
			},
		},
		'/announceTournament': {
			get: {
				tags: ['Tournament'],
				summary: 'Announce tournament specifying the entry deposit',
				parameters: [
					{
						name: 'tournamentId',
						type: 'string',
						in: 'query',
					},
					{
						name: 'deposit',
						type: 'integer',
						in: 'query',
					}
				],
				responses: responsesCodes
			},
		},
		'/joinTournament': {
			get: {
				tags: ['Tournament'],
				summary: 'Join player into a tournament',
				parameters: [
					{
						name: 'tournamentId',
						type: 'string',
						in: 'query',
					},
					{
						name: 'playerId',
						type: 'string',
						in: 'query',
					},
					{
						name: 'backerId',
						type: 'string',
						in: 'query',
					},
				],
				responses: responsesCodes
			},
		},
		'/resultTournament': {
			post: {
				tags: ['Tournament'],
				summary: 'Result tournament winners and prizes',
				parameters: [
					{
						name: 'results',
						type: 'string',
						in: 'body',
					},
				],
				responses: responsesCodes
			},
		},
	},



};