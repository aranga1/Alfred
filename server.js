'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

app.set('port', (process.env.PORT || 8080));

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

app.post('/webhook/', function(req, res) {
	console.log("Came to post From facebook");

	var data = req.body;

	if (data.object == 'page') {
		data.entry.forEach(function(pageEntry) {
			var pageIF = pageEntry.idl
			var timeOfEvent = pageEntry.time;

			pageEntry.messaging.forEach(function(messagingEvent) {
				if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else {
					console.log("Webhook received messaging event which is not handled");
				}
			});
		});
		res.sendStatus(200);
	}
});
const token = 'EAAZAxJnnArZAMBACyWFARPnpnB9xom3aKuaLTZCFuJMyCMVHZC806wCZCz7VXse8JqIAlUH5NYOZBtleV6gZBK4WIrd6MPO3eXFIkG2JZCUDeOF0o3TvJjZAiGjOxscxK54OEUp7HgV3qNZAbUikYyV20qZAfM7LPLlo5bP46A04Q0E8gZDZD';

function sendTextMessage(sender, text) {
	var messageData = {
		recipient: {
			id: sender
		},
		message: {
			text: text
		}
	};

	callSendAPI(messageData);
}

function receivedMessage(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	console.log(JSON.stringify(message));

	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	var messageText = message.text;
	var messageAttachments = message.attachments;
	var isEcho = message.is_echo;
	var quickReply = message.quick_reply;

	if (isEcho) {
		console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
		return;
	}
	else if (quickReply) {
		var quickReplyPayload = quickReply.payload;
		console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);

		sendTextMessage(senderID, "Quick reply tapped");
		return;
	}
	if (messageText) {
		sendTextMessage(senderID, messageText);
	}
	else if (messageAttachments) {
		sendTextMessage(senderID, "Message with attachment received");
	}
}

function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages/',
		qs: { access_token: token },
		method: 'POST',
		json: messageData
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s", recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}




app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'));
});

module.exports = app;
