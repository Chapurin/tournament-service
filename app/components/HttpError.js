const statuses = require('statuses');
const Sequelize = require('sequelize');
const production = process.env.NODE_ENV === 'production';



module.exports = function () {
	return function apiErrorHandler(err, req, res, next) {

		if(err instanceof Sequelize.ForeignKeyConstraintError) {
			err.status = 400;
		}

		doValidationErrorIfNeed();
		return sendError();


		function doValidationErrorIfNeed () {
			if(err instanceof Sequelize.ValidationError) {
				err.status = 400;
				err.name = 'ValidationError';
				err.message = err.errors.map((el) => { return el.path + " (" + el.message + ")"; }).join('. ');
			}
		}

		function sendError() {
			let status = err.status || err.statusCode || 500;
			if (status < 400) status = 500;
			res.statusCode = status;

			let body = {
				status: status
			};

			// show the stacktrace when not in production
			if (!production) body.stack = err.stack;

			// internal server errors
			if (status >= 500) {
				console.error(err.stack);
				body.message = statuses[status];
				res.json(body);
				return;
			}

			// client errors
			body.message = err.message;

			if (err.code) body.code = err.code;
			if (err.name) body.name = err.name;
			if (err.type) body.type = err.type;

			res.json(body);
		}

	}
};