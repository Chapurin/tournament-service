module.exports = function(sequelize, DataTypes) {

	const Tournament = sequelize.define("Tournament", {
		tournamentId: {
			field: 'tournament_id',
			type: DataTypes.STRING(20),
			primaryKey: true,
			allowNull: false
		},
		deposit: {
			type: DataTypes.DECIMAL(10,2),
			allowNull: false
		},
		status: {
			type: DataTypes.STRING(6),
			allowNull: false,
			isIn: [['open', 'closed']],
			defaultValue: 'open'
		}
	}, {
		timestamps: true,
		updatedAt: false,
		underscored: true,
		tableName: 'tournaments',
		indexes: [
			{
				unique: true,
				fields: ['tournament_id']
			},
		]
	});

	return Tournament;
};
