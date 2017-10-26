var MPNormal = function (nPlayers, game) {
  this.game = game
  this.nPlayers = nPlayers
  this.spawnPowers = false
  this.highScore = 0
  this.gridded = true
}

MPNormal.prototype = {

  preload: function () {
    console.log('NPLAYERS', this.nPlayers)
    this.game.load.image('point', 'assets/pointMP.png')
    this.game.load.image('tie', 'assets/sprites/menu/tie.png')
    this.game.load.image('crown', 'assets/crown.png')
    for (var i = 0; i <= this.nPlayers; i++) {
      this.game.load.image('player' + i, 'assets/player' + i + '.png')
      this.game.load.image('crown' + i, 'assets/crown' + i + '.png')
      this.game.load.image('trail' + i, 'assets/trail' + i + '.png')
    }
  },

  create: function (manager) {
    this.crowned = -1
    this.lastCrowned = -1
    this.manager = manager
    this.highScore = 0
    spawnPowers = false
    var textSize = 15
  	if (mobile) {
  		textSize = 30
  	}

    powerText = this.game.add.text(0, 0, '1', {
      font: '' + textSize + 'px dosis',
      	fill: '#ffffff',
      	align: 'center'
  	})
  	powerText.anchor.setTo(0.5, 0.5)
  },

  update: function () {
    if (this.crowned != -1) {
      players[this.crowned].addCrown()
    }
    if (this.manager.gameTime >= (totalTime)) {
      this.manager.ui.timeCircle.scale.set((-1 / this.manager.gameTime) * (totalTime) + 1)
    } else {
      this.manager.endGame()
    }

    var numberAlive = 0
    var playerAlive = -1
    Object.keys(players).forEach((remoteId) => {
      if (!players[remoteId].dead) {
        playerAlive = remoteId
        numberAlive++
      }
    })
    if (numberAlive < 2) {
      this.lastCrowned = playerAlive
      this.manager.endGame()
    }
  },

  erasesTrail: function () {
    return true
  },

  collect: function (playerSprite, powerSprite, player) {
    player.growth = 60 * powerSprite.scale.x
    player.size += player.growth

    if (player.size > this.highScore) {
      this.highScore = player.size
      if (this.crowned > -1) {
        players[this.crowned].removeCrown()
      }
      this.lastCrowned = this.crowned
      this.crowned = player.remoteId
    }
  },

  kill: function () {
    var alreadyDead = 0
    Object.keys(players).forEach((remoteId) => {
      if (players[remoteId].dead) {
        alreadyDead++
      }
    })

    var newMax = 0
    Object.keys(players).forEach((remoteId) => {
      if (Object.keys(players).length - alreadyDead == 1 && remoteId != this.id && !players[remoteId].dead) {
        newMax = players[remoteId].size
        this.crowned = remoteId
      } else if (remoteId != this.id && players[remoteId].size > newMax && !players[remoteId].dead) {
        newMax = players[remoteId].size
        this.crowned = remoteId
      }
    })

    if (this.crowned != -1 && players[this.crowned].dead) {
      this.crowned = -1
      this.highScore = 0
    }
  },

  endGame: function () {
    if (this.crowned == -1) {
      var tie = this.game.add.sprite(w2, h2 + 150, 'tie')
      tie.anchor.setTo(0.5, 0.5)
    } else {
  		var winnerFill = this.game.add.sprite(w2 - 75, h2 + 97, 'player' + players[this.crowned].id)
  		winnerFill.scale.set(5)
  		winnerFill.anchor.setTo(0.5, 0.5)

      var winnerLabel = this.game.add.sprite(w2, h2 + 97, 'winner')
      winnerLabel.scale.set(1, 1)
      winnerLabel.anchor.setTo(0.5, 0.5)
      var textWinner = this.game.add.text(w2 + 50, h2 + 105, String.fromCharCode(players[this.crowned].key), {
	      font: '100px dosis',
	      fill: colorPlayers[players[this.crowned].id],
	      align: 'center'
    	})
    	textWinner.anchor.setTo(0.5, 0.5)
    }
  },

  getHighScore: function () {
    return this.highScore
  },

  setHighScore: function (score) {
    this.highScore = score
  }

}

module.exports = MPNormal
