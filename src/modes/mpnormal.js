const config = require('../config')
const gameState = require('../game-state')

class MPNormal {
  constructor (nPlayers, game) {
    this.game = game
    this.nPlayers = nPlayers
    this.spawnPowers = false
    this.highScore = 0
    this.gridded = true
  }

  preload () {
    console.log('NPLAYERS', this.nPlayers)
    this.game.load.image('point', 'assets/pointMP.png')
    this.game.load.image('tie', 'assets/sprites/menu/tie.png')
    this.game.load.image('crown', 'assets/crown.png')
    for (let i = 0; i <= this.nPlayers; i++) {
      this.game.load.image('player' + i, 'assets/player' + i + '.png')
      this.game.load.image('crown' + i, 'assets/crown' + i + '.png')
      this.game.load.image('trail' + i, 'assets/trail' + i + '.png')
    }
  }

  create (manager) {
    this.crowned = -1
    this.lastCrowned = -1
    this.manager = manager
    this.highScore = 0
    // let textSize = 15
    // if (config.mobile) {
    //   textSize = 30
    // }

    // powerText = this.game.add.text(0, 0, '1', {
    //   font: '' + textSize + 'px dosis',
    //   fill: '#ffffff',
    //   align: 'center'
    // })
    // powerText.anchor.setTo(0.5, 0.5)
  }

  update () {
    const { players } = gameState
    if (this.crowned !== -1) {
      players[this.crowned].addCrown()
    }
    if (this.manager.gameTime >= this.manager.gameState.totalTime) {
      this.manager.ui.timeCircle.scale.set((-1 / this.manager.gameTime) * (this.manager.gameState.totalTime) + 1)
    } else {
      this.manager.endGame()
    }

    let numberAlive = 0
    let playerAlive = -1
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
  }

  erasesTrail () {
    return true
  }

  // collect: function (playerSprite, powerSprite, player) {
  //   player.growth = 60 * powerSprite.scale.x
  //   player.size += player.growth
  //
  //   if (player.size > this.highScore) {
  //     this.highScore = player.size
  //     if (this.crowned > -1) {
  //       players[this.crowned].removeCrown()
  //     }
  //     this.lastCrowned = this.crowned
  //     this.crowned = player.remoteId
  //   }
  // },

  kill () {
    const { players } = gameState
    let alreadyDead = 0
    Object.keys(players).forEach((remoteId) => {
      if (players[remoteId].dead) {
        alreadyDead++
      }
    })

    let newMax = 0
    Object.keys(players).forEach((remoteId) => {
      if (Object.keys(players).length - alreadyDead === 1 && !players[remoteId].dead) {
        newMax = players[remoteId].size
        this.crowned = remoteId
      } else if (players[remoteId].size > newMax && !players[remoteId].dead) {
        newMax = players[remoteId].size
        this.crowned = remoteId
      }
    })

    if (this.crowned !== -1 && players[this.crowned].dead) {
      this.crowned = -1
      this.highScore = 0
    }
  }

  endGame () {
    const { w2, h2 } = config
    const { players } = gameState
    if (this.crowned === -1) {
      const tie = this.game.add.sprite(w2, h2 + 150, 'tie')
      tie.anchor.setTo(0.5, 0.5)
    } else {
      const winnerFill = this.game.add.sprite(w2 - 75, h2 + 97, 'player' + players[this.crowned].id)
      winnerFill.scale.set(5)
      winnerFill.anchor.setTo(0.5, 0.5)

      const winnerLabel = this.game.add.sprite(w2, h2 + 97, 'winner')
      winnerLabel.scale.set(1, 1)
      winnerLabel.anchor.setTo(0.5, 0.5)
    }
  }

  getHighScore () {
    return this.highScore
  }

  setHighScore (score) {
    this.highScore = score
  }
}

module.exports = MPNormal
