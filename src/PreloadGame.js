var preloadGame = function(game){}

preloadGame.prototype = {
	init: function(){
		this.players = null;
	},

	preload: function(){ 
	    var loadingBar = this.add.sprite(w2,h2,"loading");
	    loadingBar.anchor.setTo(0.5,0.5);
	    this.game.physics.enable(loadingBar, Phaser.Physics.ARCADE);
	    loadingBar.body.angularVelocity = 200;
		this.game.physics.arcade.velocityFromAngle(loadingBar.angle, 300*this.speed, loadingBar.body.velocity);

    	//Load all stuf from game
		this.game.load.image('power', 'assets/power.png');
		this.game.load.image('pauseButton', 'assets/sprites/menu/pause.png');
		this.game.load.image('winner', 'assets/sprites/menu/winner.png');
		this.game.load.image('overlay', 'assets/overlay.png');
		this.game.load.audio('move0', 'assets/sfx/move0.ogg');
		this.game.load.audio('move1', 'assets/sfx/move1.ogg');
		this.game.load.audio('move1', 'assets/sfx/move1.ogg');
		this.game.load.audio('kill', 'assets/sfx/kill.ogg');

		numberSounds = 0;
		for(var i=0; i<=numberSounds; i++) {
			this.game.load.audio('sfx_collect' + i, 'assets/sfx/collect' + i + '.ogg');	
		}

		if (numberPlayers == 0) {
			this.game.load.image('player0', 'assets/playerSingle.png');
			this.game.load.image('superPower', 'assets/powerHS.png');
		} else {
			this.game.load.image('crown', 'assets/crown.png');
			for(var i=0; i <= numberPlayers; i++){
				this.game.load.image('player' + i, 'assets/player' + i +'.png');
				this.game.load.image('crown' + i, 'assets/crown'+ i +'.png');
			}
		}

	},

  	create: function(){
		this.game.state.start("GameMananger");
	};
}