const config = require('../config')
const gameState = require('../game-state')

const { Phaser } = window

class GameManager {
  constructor (game) {
    this.game = game
    this.crown = null
    this.gameTime = 60 // sec
    this.powerTimer = null
    this.ui = {}
    this.mode = null

    this.gameState = {
      tick: 0,
      wait: -1,
      gameOver: false,
      muteAudio: false,
      paused: false,
      totalTime: 0,
      pauseTween: null,
      pauseSprite: null,
      borders: [],
      moveSounds: [],
      killSound: null,
      collectSound: null,
      bmd: null,
      nextBallHigh: 0
    }
  }

  init (mode) {
    this.mode = mode
  }

  create () {
    this.gameState.borders = [0, this.game.world.width, 0, this.game.world.height]
    config.setScale((-1 / 24) * this.mode.nPlayers + 7 / 12)

    Object.values(gameState.players).forEach((player) => player.create(this.gameState))

    // Listen for players updates
    window.network.setHandler('update', (from, msg) => {
      // Hack, should work with latency
      if (this.gameState.tick > msg.tick) {
        this.gameState.wait = (this.gameState.tick - msg.tick) + 2
        return
      }
      this.gameState.wait = 0
      gameState.players[from].onRemoteUpdate(msg)
    })

    // setInterval(() => me.sendUpdate(), 5000)

    // create sound effects
    this.gameState.moveSounds[0] = this.add.audio('move0')
    this.gameState.moveSounds[1] = this.add.audio('move1')
    this.gameState.killSound = this.add.audio('kill')
    this.gameState.collectSound = this.add.audio('sfx_collect0')

    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.game.physics.arcade.gravity.y = 0

    const ui = this.ui
    const { w2, h2 } = config
    ui.graphics = this.add.graphics(w2, h2)

    // Powers related stuff needs review
    // groupPowers = this.add.group()
    // if (this.mode.sp && this.mode.leaderboardID) {
    //   if (!mobile) {
    //     tempLabel = this.add.sprite(w2, h2, 'score')
    //     tempLabel.anchor.setTo(0.5, 0.5)
    //     tempLabel.alpha = 0.7
    //     tempLabelText = this.add.text(w2 + 50, h2 + 8, this.mode.getHighScore().toString(), {
    //       font: '100px dosis',
    //       fill: colorHex,
    //       align: 'center'
    //     })
    //     tempLabelText.anchor.setTo(0.5, 0.5)
    //   }
    // } else {
    this.crown = this.add.sprite(w2, -32, 'crown')
    this.crown.anchor.setTo(0.5, 0.8)
    this.game.physics.enable(this.crown, Phaser.Physics.ARCADE)

    ui.graphics.lineStyle(0)
    ui.graphics.beginFill(0x000000, 0.2)
    ui.timeCircle = ui.graphics.drawCircle(w2, h2, Math.sqrt(w2 * w2 + h2 * h2) * 2)
    ui.timeCircle.pivot.x = w2
    ui.timeCircle.pivot.y = h2
    ui.graphics.endFill()
    //
    //   if(!this.mode.sp){
    //     //Generate powers
    //     this.powerTimer = this.game.time.events.loop(Phaser.Timer.SECOND * 2, this.createPower, this);
    //   }
    // }

    if (config.mobile) {
      this.gameState.pauseSprite = this.add.button(2 * w2 - 100, 100, 'pauseButton', this.touchPauseButton, this)
      this.gameState.pauseSprite.anchor.setTo(0.5, 0.5)
      this.gameState.pauseSprite.input.useHandCursor = true
      this.gameState.pauseSprite.scale.set(0.5)
      this.gameState.pauseSprite.position.set(w2, h2)
      this.gameState.pauseSprite.scale.set(0.8)
    }

    // create BitmapData
    this.gameState.bmd = this.add.bitmapData(this.game.width, this.game.height)
    this.gameState.bmd.addToWorld()
    this.gameState.bmd.smoothed = false

    if (this.mode.create) {
      this.mode.create(this)
    }

    this.game.stage.backgroundColor = config.colorHexDark

    if (this.mode.spawnPowers) {
      this.createPower()
    }

    ui.overlay = this.add.button(0, 0, 'overlay', function () {
      if (this.gameState.gameOver) {
        this.restart()
      }
    }, this)
    ui.overlay.scale.set(0)
    ui.overlay.alpha = 0.5

    this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.pause, this)
  }

  update () {
    if (this.gameState.paused) return

    // Lagggg, we need to give some time to the remote players
    if (this.gameState.wait > 0) {
      this.gameState.wait--
      Object.values(gameState.players).forEach((player) => player.pause())
      return
    }
    if (this.gameState.wait === 0) {
      this.gameState.wait = -1
      Object.values(gameState.players).forEach((player) => player.unpause())
    }
    this.gameState.tick++
    this.gameState.totalTime += this.game.time.physicsElapsed

    if (!this.gameState.gameOver) {
    // Give crown
      if (this.mode.update) {
        this.mode.update()
      }
      if (gameState.me.dead) {
        this.endGame()
      }
    }
    // Update players
    Object.keys(gameState.players).forEach((key) => gameState.players[key].update(this.gameState))
  }

  // createPower () {
  //   if (this.mode.createPower) {
  //     this.mode.createPower('point')
  //   } else {
  //     const powerup = new PowerUp(this.game, 'point', this.mode)
  //     powerup.create()
  //   }
  // }

  endGame () {
    const ui = this.ui
    const { w2, h2 } = config
    if (!this.gameState.gameOver) {
      if (this.mode.endGame) {
        this.mode.endGame()
      }

      ui.overlay.inputEnabled = false
      ui.overlay.width = w2 * 2
      ui.overlay.height = h2 * 2
      this.game.time.events.remove(this.powerTimer)
      this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.restart, this)

      const restartButton = this.add.button(w2 + 97, h2 - 97, 'restart_button')

      restartButton.scale.set(1, 1)
      restartButton.anchor.setTo(0.5, 0.5)
      restartButton.input.useHandCursor = true
      window.clickButton(restartButton, this.restart, this)

      const mainMenu = this.add.button(w2 - 97, h2 - 97, 'exit_button')
      mainMenu.scale.set(1, 1)
      mainMenu.anchor.setTo(0.5, 0.5)
      mainMenu.input.useHandCursor = true
      window.clickButton(mainMenu, function () { this.state.start('Menu') }, this)

      if (config.mobile) {
        this.gameState.pauseSprite.alpha = 0
        this.gameState.pauseSprite.input.useHandCursor = false
      }
      this.gameState.gameOver = true
    }
  }

  pause () {
    const ui = this.ui
    const { w2, h2 } = config
    if (!this.gameState.paused) { // pause
      this.game.tweens.pauseAll()
      if (this.mode.pause) {
        this.mode.pause()
      }

      if (this.gameState.gameOver) {
        this.state.start('Menu')
      }
      ui.overlay.width = w2 * 2
      ui.overlay.height = h2 * 2

      if (this.gameState.pauseTween) {
        this.gameState.pauseTween.stop()
      }
      this.gameState.paused = true
      ui.overlay.inputEnabled = false

      if (config.mobile) {
        this.gameState.pauseSprite.alpha = 0
      }

      this.game.time.events.remove(this.powerTimer)

      ui.menu = this.add.button(w2, h2 - 150, 'resume_button')
      ui.menu.anchor.setTo(0.5, 0.5)
      ui.menu.scale.set(1, 1)
      ui.menu.input.useHandCursor = true
      window.clickButton(ui.menu, this.pause, this)

      ui.restart = this.add.button(w2 - 150, h2, 'restart_button')
      ui.restart.anchor.setTo(0.5, 0.5)
      ui.restart.scale.set(1, 1)
      ui.restart.input.useHandCursor = true
      window.clickButton(ui.restart, this.restart, this)

      ui.exit = this.add.button(w2, h2 + 150, 'exit_button')
      ui.exit.anchor.setTo(0.5, 0.5)
      ui.exit.scale.set(1, 1)
      ui.exit.input.useHandCursor = true
      window.clickButton(ui.exit, function () { this.state.start('Menu') }, this)

      if (config.mute) {
        ui.audioButton = this.add.button(w2 + 150, h2, 'audiooff_button')
        ui.audioButton.anchor.setTo(0.5, 0.5)
        ui.audioButton.scale.set(1, 1)
        ui.audioButton.input.useHandCursor = true
      } else {
        ui.audioButton = this.add.button(w2 + 150, h2, 'audio_button')
        ui.audioButton.anchor.setTo(0.5, 0.5)
        ui.audioButton.scale.set(1, 1)
        ui.audioButton.input.useHandCursor = true
      }
      window.clickButton(ui.audioButton, this.muteSound, this)
    } else { // unpause
      this.game.tweens.resumeAll()
      ui.overlay.scale.set(0)

      if (this.mode.unPause) {
        this.mode.unPause()
      }

    // if (!this.mode.sp) {
    //  this.powerTimer = this.game.time.events.loop(Phaser.Timer.SECOND * 2, this.createPower, this);
    // }

      ui.overlay.inputEnabled = true

      if (config.mobile) {
        this.gameState.pauseSprite.alpha = 0.2
        this.gameState.pauseSprite.input.useHandCursor = true
      }
      ui.menu.destroy()
      ui.restart.destroy()
      ui.exit.destroy()
      ui.audioButton.destroy()
      this.gameState.paused = false
    }
  }

  restart () {
    this.state.restart(true, false, this.mode)
  }

  touchPauseButton () {
    if (!this.gameState.paused) {
      this.pause()
      if (config.mobile) {
        this.gameState.pauseSprite.input.useHandCursor = false
      }
    }
  }

  muteSound () {
    if (config.mute) {
      this.ui.audioButton.loadTexture('audio_button')
      config.setMute(false)
    } else {
      this.ui.audioButton.loadTexture('audiooff_button')
      config.setMute(true)
    }
  }

  backPressed () {
    this.pause()
  }
}

module.exports = GameManager
