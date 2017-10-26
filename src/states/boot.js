var boot = function (game) {
  playCounter = 0
  w2 = 0
  h2 = 0
  changeColor = false
  mute = false
  firstTime = true
  iapDone = false
}

boot.prototype = {

  preload: function () {
    this.game.plugins.add(PhaserInput.Plugin)
    this.game.load.image('loading', 'assets/sprites/menu/loading.png')
  },

  create: function () {
    // this.game.add.plugin(Phaser.Plugin.Debug);
    window.orientation = Math.abs(window.orientation) - 90 == 0 ? 'landscape' : 'portrait'

    if (Cocoon.Social.GameCenter.nativeAvailable) {
      window.platform = 'ios'
    } else if (Cocoon.Social.GooglePlayGames.nativeAvailable) {
      window.platform = 'android'
    } else {
      window.platform = 'desktop'
    }

    console.log(JSON.stringify(platform))

    window.w2 = this.game.world.width / 2
    window.h2 = this.game.world.height / 2

    // Background colors
    // [green, red, purple, blue]
    window.bgColors = ['#76b83d', '#cf5e4f', '#805296', '#4c99b9']
    window.bgColorsDark = ['#3b5c1e', '#672f27', '#40294b', '#264c5c']

    window.modesLB = ['CgkIr97_oIgHEAIQCQ', 'CgkIr97_oIgHEAIQCg', 'CgkIr97_oIgHEAIQCw']

    window.chosenColor = this.game.rnd.integerInRange(0, 3)
    window.colorHex = window.bgColors[window.chosenColor]
    window.colorHexDark = window.bgColorsDark[window.chosenColor]
    document.body.style.background = window.colorHex
    this.stage.backgroundColor = window.colorHex

    // Player colors
    // [red, blue, pink, green, brown, cyan, purple, yellow]
    window.colorPlayers = ['#eb1c1c', '#4368e0', '#f07dc1', '#44c83a', '#9e432e', '#3dd6e0', '#9339e0', '#ebd90f']

    this.game.stage.disableVisibilityChange = true
    this.game.forcesSingleUpdate = true
    this.scale.scaleMode = window.Phaser.ScaleManager.SHOW_ALL
    this.scale.pageAlignHorizontally = true
    this.scale.pageAlignVertically = true
    this.scale.forceOrientation(true, false)
    this.scale.setResizeCallback(this.resize, this)

    this.physics.startSystem(window.Phaser.Physics.ARCADE)

    this.stage.smoothed = false

    if (window.mobile) {
      window.Cocoon.App.exitCallback(
        function () {
          if (this.state.states[this.game.state.current].backPressed) {
            this.state.states[this.game.state.current].backPressed()
          }
          if (this.state.current === 'Menu') {
            return true
          } else {
            return false
          }
        }.bind(this)
      )
    }

    this.state.start('PreloadMenu')
  },

  resize: function () {
    if ((this.state.current !== 'GameMananger') && (this.state.current !== 'PreloadMenu') && (this.state.current !== 'PreloadGame')) {
      window.orientation = Math.abs(window.orientation) - 90 === 0 ? 'landscape' : 'portrait'
      var winW = window.innerWidth
      var winH = window.innerHeight
      var winRatio = winW / winH
      var height = Math.round(Math.sqrt(window.baseArea / winRatio))
      var width = Math.round(winRatio * height)

      var game = this.game

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

      window.w2 = this.game.world.width / 2
      window.h2 = this.game.world.height / 2

      if (this.state.states[this.game.state.current].setPositions) {
        this.state.states[this.game.state.current].setPositions()
      }
    }
  }

}

module.exports = boot
