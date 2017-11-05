const MPNormal = require('../modes/mpnormal')
const Player = require('../entities/player')

const config = require('../config')
const gameState = require('../game-state')

const { Phaser } = window

class Multiplayer {
  constructor (game) {
    this.ui = {}
    this.nPlayers = 1
    this.mode = new MPNormal(this.nPlayers, game)
  }

  create () {
    const ui = this.ui

    ui.title = this.game.add.text(0, 0, 'multiplayer', {
      font: '150px dosis',
      fill: '#ffffff',
      align: 'center'})
    ui.title.anchor.setTo(0.5, 0.5)

    ui.instructions = this.game.add.text(0, 0, 'Create or join a room', {
      font: '50px dosis',
      fill: '#ffffff',
      align: 'center'})
    ui.instructions.anchor.setTo(0.5, 0.5)

    ui.playersText = this.game.add.text(0, 0, 'Connected players:', {
      font: '20px dosis',
      fill: '#ffffff',
      align: 'center'})
    ui.playersText.anchor.setTo(0.5, 0.5)

    ui.playersNum = this.game.add.text(0, 0, this.nPlayers, {
      font: '20px dosis',
      fill: '#ffffff',
      align: 'center'})
    ui.playersNum.anchor.setTo(0.5, 0.5)

    ui.code = this.game.add.inputField(0, 0, {
      font: '18px Arial',
          // fill: '#212121',
      fontWeight: 'bold',
      width: 400,
      padding: 8,
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 6
    })

    ui.playButton = this.game.add.button(0, 0, 'resume_button')
    ui.playButton.anchor.setTo(0.5, 0.5)
    ui.playButton.input.useHandCursor = true
    window.clickButton(ui.playButton, this.advance, this)

        // Join Button
    ui.joinButton = this.game.add.button(0, 0, 'endless_button')
    ui.joinButton.anchor.setTo(0.5, 0.5)
    ui.joinButton.input.useHandCursor = true
    ui.joinButton.scale.setTo(0.4, 0.4)
    window.clickButton(ui.joinButton, this.joinRoom, this)

        // Create Button
    ui.createButton = this.game.add.button(0, 0, 'accept_button')
    ui.createButton.anchor.setTo(0.5, 0.5)
    ui.createButton.input.useHandCursor = true
    ui.createButton.scale.setTo(0.5, 0.5)
    window.clickButton(ui.createButton, this.createRoom, this)

        // Go back Button
    ui.backButton = this.game.add.button(0, 0, 'back_button')
    ui.backButton.anchor.setTo(0.5, 0.5)
    ui.backButton.input.useHandCursor = true
    window.clickButton(ui.backButton, this.backPressed, this)
        // Place the menu buttons and labels on their correct positions
    this.setPositions()

    this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.backPressed, this)
  }

  createPlayer (remoteId, options = {}) {
    let angle = 0
    const winOrientation = config.winOrientation()
    const { w2, h2 } = config
    if (config.mobile && winOrientation === 'portrait') {
      angle = Math.PI / 2
    }
    const playerNum = Object.keys(gameState.players).length
    return new Player(playerNum, remoteId,
          Math.cos((2 * Math.PI / 9) * playerNum - angle) * (w2 - 200) + w2,
          Math.sin((2 * Math.PI / 9) * playerNum - angle) * (h2 - 100) + h2,
          this.mode, this.game, options)
  }

  // FIXME this approach is just the worst ever
  // need to remove all dependencies on the players ordered id
  joinRoom () {
    const gameId = this.ui.code.value
    console.log(gameId)
    window.network.setHandler('list', (from, msg) => {
      this.nPlayers = msg.players.length
      this.ui.playersNum.setText(this.nPlayers)
            // FIX ME such hack :'(  to get me
      let i
      for (i = 0; i < msg.players.length - 1; i++) {
        const currPlayer = msg.players.find((player) => i === player.id)
        gameState.players[currPlayer.remoteId] = this.createPlayer(currPlayer.remoteId, {actionable: false})
      }
            // It's me
      const currPlayer = msg.players.find((player) => i === player.id)
      gameState.players[currPlayer.remoteId] = this.createPlayer(currPlayer.remoteId, {actionable: true})
      gameState.me = gameState.players[currPlayer.remoteId]
    }, { once: true })
          // Set the handlers first
          // FIXME race conditions
    window.network.setHandler('start', (from, data) => {
            // debugger
      gameState.players[from].isReady = true
      this.checkIfReady()
    })

    window.network.join(gameId)
    window.network.setHandler('join', (from, data) => {
      gameState.players[from] = this.createPlayer(from, {actionable: false})
      this.nPlayers++
      this.ui.playersNum.setText(this.nPlayers)
      window.network.listUpdate(gameState.players)
    })
  }

  createRoom () {
          // Set the correct text
    this.ui.code.setText(window.network.create())
          // Create me
    gameState.players[window.network.peerId] = this.createPlayer(window.network.peerId, {actionable: true})
    gameState.me = gameState.players[window.network.peerId]
    window.network.setHandler('join', (from, data) => {
      gameState.players[from] = this.createPlayer(from, {actionable: false})
      this.nPlayers++
      this.ui.playersNum.setText(this.nPlayers)
      window.network.listUpdate(gameState.players)
    })
    window.network.setHandler('start', (from, data) => {
            // debugger
      gameState.players[from].isReady = true
      this.checkIfReady()
    })
  }

  checkIfReady () {
          // debugger
    const allReady = Object.keys(gameState.players).reduce((accumulator, key) => accumulator && gameState.players[key].isReady, true)
    if (allReady) this.play()
  }

  play () {
    // FIXME
    this.mode.nPlayers = this.nPlayers
    this.game.state.start('PreloadGame', true, false, this.mode)
  }

  advance () {
    gameState.me.isReady = true
    window.network.start()
    this.checkIfReady()
  }

  backPressed () {
    this.game.state.start('Menu')
  }

  setPositions () {
    const { w2, h2 } = config
    const ui = this.ui
    ui.title.position.set(w2, h2 * 0.3)
    ui.instructions.position.set(w2, h2 * 0.9)
    ui.code.position.set(w2 - 205, h2 * 1.1)
    ui.joinButton.position.set(w2 - 205, h2 * 1.4)
    ui.createButton.position.set(w2 + 205, h2 * 1.4)
    ui.playButton.position.set(w2 + w2 / 2, h2 * 1.6)
    ui.backButton.position.set(w2 / 2, h2 * 1.6)
    ui.playersText.position.set(w2 - w2 * 1 / 50, h2 * 1.4)
    ui.playersNum.position.set(w2 + 3 / 25 * w2, h2 * 1.4)
  }
}

module.exports = Multiplayer
