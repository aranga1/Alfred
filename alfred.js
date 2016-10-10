const restify = require('restify');
const builder = require('botbuilder');
const server = restify.createServer().listen(8080);

const connector = new builder.UniversalBot(connector);

bot.dialog('/', (session) => {
	console.log(session.message.text);
});

server.post('/', connector.listen());