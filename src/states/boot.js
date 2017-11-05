const config = require('../config')

const { Phaser } = window

class Boot {
  constructor (game) {
    this.game = game
  }

  preload () {
    this.game.plugins.add(window.PhaserInput.Plugin)
    this.game.load.image('loading', 'assets/sprites/menu/loading.png')
  }

  create () {
    config.setHalfSizes(this.game.world.width / 2, this.game.world.height / 2)

    document.body.style.background = config.colorHex
    this.stage.backgroundColor = config.colorHex

    // Player colors
    // [red, blue, pink, green, brown, cyan, purple, yellow]

    this.game.stage.disableVisibilityChange = true
    this.game.forcesSingleUpdate = true
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    this.scale.pageAlignHorizontally = true
    this.scale.pageAlignVertically = true
    this.scale.forceOrientation(true, false)
    this.scale.setResizeCallback(this.resize, this)

    this.physics.startSystem(Phaser.Physics.ARCADE)

    this.stage.smoothed = false

    this.state.start('PreloadMenu')
  }

  resize () {
    if ((this.state.current === 'GameMananger') ||
      (this.state.current === 'PreloadMenu') ||
      (this.state.current === 'PreloadGame')) {
      return
    }
    const winRatio = config.winRatio()
    const height = Math.round(Math.sqrt(config.baseArea / winRatio))
    const width = Math.round(winRatio * height)

    const game = this.game

    game.width = width
    game.height = height
    game.canvas.width = width
    game.canvas.height = height
    game.renderer.resize(width, height)
    this.stage.width = width
    this.stage.height = height
    this.scale.width = width
    this.scale.height = height
    this.world.setBounds(0, 0, width, height)
    this.camera.setSize(width, height)
    this.camera.setBoundsToWorld()
    this.scale.refresh()

    config.setHalfSizes(this.game.world.width / 2, this.game.world.height / 2)

    if (this.state.states[this.game.state.current].setPositions) {
      this.state.states[this.game.state.current].setPositions()
    }
  }
}

module.exports = Boot
