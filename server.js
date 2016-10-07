'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const request = request('request');
const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.get('/', function( req, res) {
	res.send('Hello world, I am a chat bot');
});

app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'alfred') {
		res.send(req.query['hub.challenge']);
	}
	res.send('Error, wrong token');
});

app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'));
});

