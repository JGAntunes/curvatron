var setKeys = function (game) {
  this.ui = {}
}

setKeys.prototype = {
  create: function () {
    var ui = this.ui

    ui.title = this.game.add.text(0, 0, 'configure keys', {
      font: '150px dosis',
      fill: '#ffffff',
      align: 'center'
    })
    ui.title.anchor.setTo(0.5, 0.5)

      // key select button
    ui.keyButton = this.game.add.sprite(0, 0, 'key_button')
    ui.keyButton.anchor.setTo(0.5, 0.5)
    ui.keyText = this.game.add.text(0, 0, String.fromCharCode(window.gameConfig.key), {
      font: '150px dosis',
      fill: colorHex,
      align: 'center'
    })
    ui.keyText.anchor.setTo(0.5, 0.5)

    // Play Button
    ui.playButton = this.game.add.button(0, 0, 'accept_button')
    ui.playButton.anchor.setTo(0.5, 0.5)
    ui.playButton.input.useHandCursor = true
    clickButton(ui.playButton, this.backPressed, this)

    // Place the menu buttons and labels on their correct positions
    this.setPositions()

    this.game.input.keyboard.addCallbacks(this, this.onPressed)
    this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.backPressed, this)
  },

  backPressed: function () {
    this.game.state.start('Menu')
  },

  onPressed: function () {
    if (this.game.input.keyboard.lastKey.keyCode >= 48 && this.game.input.keyboard.lastKey.keyCode <= 90 && this.state.current == 'SetKeys') {
      window.gameConfig.key = this.game.input.keyboard.lastKey.keyCode
      this.ui.keyText.setText(String.fromCharCode(window.gameConfig.key))
    }
  },

  setPositions: function () {
    var ui = this.ui

    ui.title.position.set(w2, h2 * 0.3)
    var wOrientation = Math.abs(window.orientation) - 90 == 0 ? 'landscape' : 'portrait'
    if (wOrientation === 'portrait' && mobile) {
      ui.title.scale.set(0.7, 0.7)
    } else {
      ui.title.scale.set(1, 1)
    }

    ui.keyButton.position.set(w2, 140 + h2)
    ui.keyText.position.set(w2, h2 + 120)
    ui.playButton.position.set(w2 / 2, 1.6 * h2)
  }

}

module.exports = setKeys
