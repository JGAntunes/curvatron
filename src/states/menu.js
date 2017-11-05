const config = require('../config')
const MPNormal = require('../modes/mpnormal')

class Menu {
  constructor (game) {
    this.menuMusic = null
    this.ui = {}
  }

  create () {
    this.world.pivot.set(0, 0)
    this.world.angle = 0

    if (!config.mute) {
      if (!this.menuMusic) this.menuMusic = this.add.audio('dream')
      if (!this.menuMusic.isPlaying) {
        this.menuMusic.loop = true
        this.menuMusic.play()
      }
    }

    const ui = this.ui

    // Game Title
    ui.title = this.add.text(0, 0, 'curvatron', {
      font: '200px dosis',
      fill: '#ffffff',
      align: 'center'
    })
    ui.title.anchor.setTo(0.5, 0.5)

    // Multiplayer
    ui.mpButton = this.add.button(0, 0, 'multiplayer_button')
    ui.mpButton.anchor.setTo(0.5, 0.5)
    ui.mpButton.input.useHandCursor = true
    window.clickButton(ui.mpButton, this.multiplayer, this)

    if (!config.mobile) {
      ui.keysButton = this.add.button(0, 0, 'setkeys_button')
      ui.keysButton.anchor.setTo(0.5, 0.5)
      ui.keysButton.input.useHandCursor = true
      window.clickButton(ui.keysButton, this.setKeys, this)
    }

    // Audio
    if (config.mute) {
      ui.audioButton = this.add.button(0, 0, 'audiooff_button')
      ui.audioButton.anchor.setTo(0.5, 0.5)
      ui.audioButton.input.useHandCursor = true
    } else {
      ui.audioButton = this.add.button(0, 0, 'audio_button')
      ui.audioButton.anchor.setTo(0.5, 0.5)
      ui.audioButton.input.useHandCursor = true
    }

    window.clickButton(ui.audioButton, this.muteSound, this)

    this.scale.refresh()
    // Place the menu buttons and labels on their correct positions
    this.setPositions()
  }

  multiplayer () {
    if (config.mobile) {
      const mode = new MPNormal(1, this.game)
      this.game.state.start('PreloadGame', true, false, mode)
    } else {
      this.state.start('Multiplayer')
    }
  }

  setKeys () {
    if (!config.mobile) {
      this.state.start('SetKeys')
    }
  }

  muteSound () {
    const ui = this.ui

    if (config.mute) {
      ui.audioButton.loadTexture('audio_button')
      // this.game.sound.mute = false;
      config.setMute(false)
      if (!this.menuMusic) {
        this.menuMusic = this.add.audio('dream')
      }
      this.menuMusic.loop = true
      this.menuMusic.play()
      this.menuMusic.volume = 1
    } else {
      ui.audioButton.loadTexture('audiooff_button')
      // this.game.sound.mute = true;
      config.setMute(true)
      if (this.menuMusic && this.menuMusic.isPlaying) {
        this.menuMusic.stop()
      }
    }
  }

  setPositions () {
    const ui = this.ui
    const { w2, h2, mobile } = config

    ui.title.position.set(w2, h2 * 0.3)

    const winOrientation = config.winOrientation()
    if (winOrientation === 'portrait' && mobile) {
      ui.title.scale.set(0.8, 0.8)
    } else {
      ui.title.scale.set(1, 1)
    }

    ui.mpButton.position.set(w2, h2)

    if (!config.mobile) {
      ui.keysButton.position.set(w2 + w2 / 2, 1.6 * h2)
    }

    ui.audioButton.position.set(w2 / 2, 1.6 * h2)
  }

  shutdown () {
    if (this.menuMusic.isPlaying && (this.menuMusic.volume > 0) && !config.mute) {
      this.menuMusic.fadeOut(2000)
    }
  }
}

module.exports = Menu
