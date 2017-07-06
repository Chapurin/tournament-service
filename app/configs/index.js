module.exports = {
	appName: 'TournamentService',
	port: process.env.PORT || 8080,

	db: {
		postgres: {
			host: 'localhost',
			port: 3306,
			dialect: 'mysql',
			name: 'tournament_service',
			username: 'root',
			password: '123'
		}
	},
};
