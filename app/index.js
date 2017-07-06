const express = require('express');
const app = express();
const config = require('./configs');
const swagger = require('swagger-express');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const path = require('path');
const bodyParser = require('body-parser');
const sequelize = require('./orm');
const errorHandler = require('./components/HttpError');
const routes = require('./routers/index');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/api/swagger/spec.js', function(req, res) {
	res.send(require('./spec.js'));
});


app.use(swagger.init(app, {
	apiVersion: '1.0',
	swaggerVersion: '2.0',
	swaggerURL: '/api/swagger',
	swaggerUI: './public/swagger/',
	basePath: '/api/swagger',
}));


app.all('*', function(req, res, next){
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Cache-Control', 'no-cache');
	next();
});

app.use('/api', routes);
app.use(errorHandler());

sequelize
	.authenticate()
  .then(() => {
		 console.log('Database connection has been established successfully.');
	}, function (err) {
		console.log('Unable to connect to the database:', err);
	});


app.listen(config.port, () => {
	console.log('listen ' + config.port );
});

