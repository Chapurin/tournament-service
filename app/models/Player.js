module.exports = function(sequelize, DataTypes) {

	const Player = sequelize.define("Player", {
		playerId: {
			field: 'player_id',
			type: DataTypes.STRING(20),
			primaryKey: true,
			allowNull: false,
		},
		points: {
			type: DataTypes.DECIMAL(10,2),
			defaultValue: 0
		}
	}, {
		timestamps: true,
		updatedAt: false,
		underscored: true,
		tableName: 'players',
		indexes: [
			{
				unique: true,
				fields: ['player_id']
			},
		]
	});

	return Player;
};
