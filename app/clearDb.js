const models = require('./models/index');

const Models  = [
	models.Player,
	models.Tournament,
	models.Invest,
];


(() => {
	let chain = Promise.resolve();
	Models.forEach(function(Model) {
		chain = chain
			.then(() => Model.sync({force: true}))
	});


	chain
		.then(() => {
			console.info('Done');
		})
		.catch((err) => {
			console.error(err);
		});
})();