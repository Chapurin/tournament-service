const models = require('../models/index');

const Models  = [
	models.Points,
	models.Player,
	models.Tournament,
	models.Invest,
];


exports.reset = function(req, res, next){

	(() => {
		let chain = Promise.resolve();
		Models.forEach(function(Model) {
			chain = chain
				.then(() => Model.sync({force: true}))
		});

		chain
			.then(() => {
				res.end();
			})
			.catch((err) => {
				next(createError(err));
			});
	})();

};
