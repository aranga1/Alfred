'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const recast = require('recastai');
const config = require('./config');
const urls = require('./urls');

const greeting = require('./intents/greetings');

const client = new recast.Client(config.recast_token, 'en');

app.set('port', (process.env.PORT || 8080));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.get('/', function( req, res) {
	res.send('Official Page for the chatbot Alfred');
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

function sendImageMessage(sender, image_url) {
	var messageData = {
    recipient: {
      id: sender
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: image_url
        }
      }
    }
  };

  callSendAPI(messageData);

}

function sendToRecast(sender, message) {
	var custom_url = urls.get_user_info_url + "/" + sender + "?access_token=" + config.token;
	var user_details;
	request(custom_url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			user_details = JSON.parse(body);
		}
		else {
			console.error("Failed calling get API", response.statusCode, response.statusMessage, body.error);
		}
	});
	client.textRequest(message).then((res) => {
		var intent = res.intent().slug;
		var message_to_send = '';
		switch (intent) {
			case 'greeting':
				sendTextMessage(sender,greeting.getGreetings(user_details.first_name));
				break;
			case 'tellweather':
				sendTextMessage(sender, "working on that " + user_details['first_name']);
				break;
			case 'appreciationintent':
				sendTextMessage(sender, "It's my job " + user_details['first_name']);
				break;
			default:
				sendTextMessage(sender, "Didn't really get that " + user_details['first_name'] + ". Could you try something else?");
		}
	}).catch(e => {
		console.log(e);
	});
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
		sendToRecast(senderID, messageText);
	}
	else if (messageAttachments) {
		messageAttachments.forEach(function(attachment) {
			console.log("The message type is: " + attachment.type);
			if (attachment.type == 'image') {
				console.log("The attachment url is : " + attachment.payload.url);
				sendImageMessage(senderID, attachment.payload.url);
			}
		});
	}
}

function callSendAPI(messageData) {
	request({
		uri: urls.post_message_url,
		qs: { access_token: config.token },
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
