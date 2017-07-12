module.exports = {
	appName: 'TournamentService',
	port: process.env.PORT || 8080,

	db: {
		postgres: {
			dialect: 'mysql',
			port: 3306,
			host: process.env.MYSQL_HOST || 'mysql',
			name: process.env.DB_NAME || 'tournament_service',
			username: process.env.DB_USER || 'root',
			password: process.env.DB_PASS || '123456'
		}
	},
};
