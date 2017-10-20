
var multiplayer = function (game) {
	this.ui = {};
	this.maxPlayers = 7;
	this.nPlayers = 1;
};

multiplayer.prototype = {
	create: function () {
  	var ui = this.ui;

		ui.title = this.game.add.text(0,0, "multiplayer", {
	    font: "150px dosis",
	    fill: "#ffffff",
	    align: "center"});
  	ui.title.anchor.setTo(0.5,0.5);

		// ui.code = this.game.add.sprite(0,0, "RANDOM CODE", {
	  //   font: "120px dosis",
	  //   fill: colorHex,
	  //   align: "center"});
    // ui.code.anchor.setTo(0.5,0.5);
		ui.instructions = this.game.add.text(0,0, "Create or join a room", {
			font: "50px dosis",
			fill: "#ffffff",
			align: "center"});
		ui.instructions.anchor.setTo(0.5,0.5);

		ui.code = this.game.add.inputField(0,0, {
		    font: '18px Arial',
		    // fill: '#212121',
		    fontWeight: 'bold',
		    width: 400,
		    padding: 8,
		    borderWidth: 1,
		    borderColor: '#000',
		    borderRadius: 6
		});
		//Play Button
		ui.playButton = this.game.add.button(0,0,"resume_button");
		ui.playButton.anchor.setTo(0.5,0.5);
		ui.playButton.input.useHandCursor = true;
		clickButton(ui.playButton, this.playTheGame, this);

		//Join Button
		ui.joinButton = this.game.add.button(0,0,"endless_button");
		ui.joinButton.anchor.setTo(0.5,0.5);
		ui.joinButton.input.useHandCursor = true;
		ui.joinButton.scale.setTo(0.4,0.4)
		clickButton(ui.joinButton, this.joinRoom, this);

		//Create Button
		ui.createButton = this.game.add.button(0,0,"accept_button");
		ui.createButton.anchor.setTo(0.5,0.5);
		ui.createButton.input.useHandCursor = true;
		ui.createButton.scale.setTo(0.5,0.5)
		clickButton(ui.createButton, this.createRoom, this);

	  //Go back Button
		ui.backButton = this.game.add.button(0,0,"back_button");
		ui.backButton.anchor.setTo(0.5,0.5);
		ui.backButton.input.useHandCursor = true;
		clickButton(ui.backButton, this.backPressed, this);

		//Place the menu buttons and labels on their correct positions
    	this.setPositions();

		this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.backPressed, this);

		players = {}

	},

	createPlayer: function (remoteId, options = {}) {
		let angle = 0;
		const orientation = Math.abs(window.orientation) - 90 == 0 ? "landscape" : "portrait";
		if (mobile && orientation == "portrait") {
			angle = Math.PI/2;
		}
		const playerNum = Object.keys(players).length
		return new Player(playerNum, remoteId,
		Math.cos((2*Math.PI/9)*playerNum - angle)*(w2-200)+w2,
		Math.sin((2*Math.PI/9)*playerNum - angle)*(h2-100)+h2,
		keys[playerNum], this.mode, this.game, options);
	},

	// FIXME this approach is just the worst ever
	// need to remove all dependencies on the players ordered id
	joinRoom: function () {
		const gameId = this.ui.code.value
		console.log(gameId)
		network.setHandler('list', (from, msg) => {
			this.nPlayers = msg.players.length
			// FIX ME such hack :'(  to get me
			let i
			for (i = 0; i < msg.players.length - 1; i++) {
				const currPlayer = msg.players.find((player) => i === player.id)
				players[currPlayer.remoteId] = this.createPlayer(currPlayer.remoteId, {actionable: false})
			}
			// It's me
			const currPlayer = msg.players.find((player) => i === player.id)
			players[currPlayer.remoteId] = this.createPlayer(currPlayer.remoteId, {actionable: true})
			me = players[currPlayer.remoteId]
		}, { once: true })
		network.join(gameId)
	},

	createRoom: function () {
		// Set the correct text
		this.ui.code.setText(network.create())
		// Create me
		players[network.peerId] =  this.createPlayer(network.peerId)
		me = players[network.peerId]
		network.setHandler('join', (from, data) => {
			players[from] = this.createPlayer(from, {actionable: false})
			this.nPlayers++;
			network.listUpdate(players)
		})
		network.setHandler('start', (from, data) => {
			players[from].isReady = true
			checkIfReady()
		})
	},

	checkIfReady: function () {
		const allReady = Object.keys(players).reduce((accumulator, key) => accumulator && players[key].isReady)
		if (allReady) playTheGame()
	},

	playTheGame: function () {
		me.isReady = true
		network.start()
		checkIfReady()
	},

	backPressed:function () {
		this.game.state.start("Menu");
	},

	setPositions: function () {
		var ui = this.ui;

	  ui.title.position.set(w2,h2*0.3);
	  ui.instructions.position.set(w2,h2*0.9);
		ui.code.position.set(w2-205,h2*1.1);
		ui.joinButton.position.set(w2-205,h2*1.4);
		ui.createButton.position.set(w2+205,h2*1.4);
		ui.playButton.position.set(w2+w2/2,h2*1.6);
		ui.backButton.position.set(w2/2,h2*1.6);
	}

};
