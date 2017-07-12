module.exports = function(sequelize, DataTypes) {

	const Invest = sequelize.define("Invest", {
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
		freezeTableName: true,
		indexes: [
			{
				unique: false,
				fields: ['tournament_id', 'player_id']
			},
		]
	});

	Invest.removeAttribute('id');

	Invest.associate = function(models) {

		Invest.belongsTo(models.Player, {
			as: 'player',
			foreignKey: {
				name: 'playerId',
				field: 'player_id'
			}
		});

		Invest.belongsTo(models.Player, {
			as: 'leader',
			foreignKey: {
				name: 'leaderId',
				field: 'leader_id'
			}
		});

		Invest.belongsTo(models.Tournament, {
			as: 'tournament',
			foreignKey: {
				name: 'tournamentId',
				field: 'tournament_id'
			}
		});


	};

	return Invest;
};
