module.exports = {
	appName: 'TournamentService',
	port: process.env.PORT || 8080,

	db: {
		postgres: {
			dialect: 'mysql',
			host: process.env.DB_NAME || 'localhost',
			port: process.env.MYSQL_PORT || 3306,
			name: process.env.DB_NAME || 'tournament_service',
			username: process.env.DB_USER || 'root',
			password: process.env.DB_PASS || '123'
		}
	},
};
