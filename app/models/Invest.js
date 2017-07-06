module.exports = function(sequelize, DataTypes) {

	let Invest = sequelize.define("Invest", {
		tournamentId: {
			field: 'tournament_id',
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: 'tournament_player_leader',
		},
		playerId : {
			field: 'player_id',
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: 'tournament_player_leader',
		},
		leaderId : {
			field: 'leader_id',
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: 'tournament_player_leader',
		},
	}, {
		timestamps: true,
		updatedAt: false,
		underscored: true,
		tableName: 'invest',
		freezeTableName: true
	});

	Invest.removeAttribute('id');

	return Invest;
};
