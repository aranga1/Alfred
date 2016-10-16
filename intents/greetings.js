function random(array) {
                return array[Math.floor(Math.random() * array.length)]
}

module.exports = {
	getGreetings : function(sender_name) {
		const answers = [
			'Hello ' + sender_name,
			'Why hello there ' + sender_name,
			'Hello ' + sender_name + ' Hope the day is going well for you!',
			'And a good day to you too ' + sender_name,
		]
		return random(answers);
	},
};
