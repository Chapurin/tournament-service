const fs        = require("fs");
const path      = require("path");
const Sequelize = require("sequelize");
const sequelize = require('../orm');

let db = {};

fs
	.readdirSync(__dirname)
	.filter(function(file) {
		return (file.indexOf(".") !== 0) && (file !== "index.js");
	})
	.forEach(function(file) {
		let model = sequelize.import(path.join(__dirname, file));
		db[model.name] = model;
	});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;