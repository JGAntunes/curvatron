const config = require('../config')

const { Phaser } = window

class SetKeys {
  constructor (game) {
    this.game = game
    this.ui = {}
  }

  create () {
    const ui = this.ui

    ui.title = this.game.add.text(0, 0, 'configure keys', {
      font: '150px dosis',
      fill: '#ffffff',
      align: 'center'
    })
    ui.title.anchor.setTo(0.5, 0.5)

      // key select button
    ui.keyButton = this.game.add.sprite(0, 0, 'key_button')
    ui.keyButton.anchor.setTo(0.5, 0.5)
    ui.keyText = this.game.add.text(0, 0, String.fromCharCode(config.key), {
      font: '150px dosis',
      fill: config.colorHex,
      align: 'center'
    })
    ui.keyText.anchor.setTo(0.5, 0.5)

    // Play Button
    ui.playButton = this.game.add.button(0, 0, 'accept_button')
    ui.playButton.anchor.setTo(0.5, 0.5)
    ui.playButton.input.useHandCursor = true
    window.clickButton(ui.playButton, this.backPressed, this)

    // Place the menu buttons and labels on their correct positions
    this.setPositions()

    this.game.input.keyboard.addCallbacks(this, this.onPressed)
    this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.backPressed, this)
  }

  backPressed () {
    this.game.state.start('Menu')
  }

  onPressed () {
    if (this.game.input.keyboard.lastKey.keyCode >= 48 && this.game.input.keyboard.lastKey.keyCode <= 90 && this.state.current === 'SetKeys') {
      config.setKey(this.game.input.keyboard.lastKey.keyCode)
      this.ui.keyText.setText(String.fromCharCode(config.key))
    }
  }

  setPositions () {
    const ui = this.ui
    const { w2, h2 } = config

    ui.title.position.set(w2, h2 * 0.3)
    const winOrientation = config.winOrientation()
    if (winOrientation === 'portrait' && config.mobile) {
      ui.title.scale.set(0.7, 0.7)
    } else {
      ui.title.scale.set(1, 1)
    }

    ui.keyButton.position.set(w2, 140 + h2)
    ui.keyText.position.set(w2, h2 + 120)
    ui.playButton.position.set(w2 / 2, 1.6 * h2)
  }
}

module.exports = SetKeys
