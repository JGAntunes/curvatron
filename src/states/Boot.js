var boot = function (game) {
  playCounter = 0
  w2 = 0
  h2 = 0
  changeColor = false
  mute = false
  firstTime = true
  scale = 1

  menuArray = []
  selection = 0
  pressingSelect = false

}

boot.prototype = {
  preload: function () {
    this.game.load.image('loading', 'assets/sprites/gui/loading.png')
  },

  create: function () {
    w2 = this.game.world.width / 2
    h2 = this.game.world.height / 2

    this.game.stage.disableVisibilityChange = true

    // Background colors
    // [green, red, purple, blue]
    bgColors = ['#76b83d', '#cf5e4f', '#805296', '#4c99b9']
    bgColorsDark = ['#3b5c1e', '#672f27', '#40294b', '#264c5c']

    modesLB = ['CgkIr97_oIgHEAIQCQ', 'CgkIr97_oIgHEAIQCg', 'CgkIr97_oIgHEAIQCw']

    chosenColor = this.game.rnd.integerInRange(0, 3)
    colorHex = bgColors[chosenColor]
    colorHexDark = bgColorsDark[chosenColor]
    document.body.style.background = colorHex
    this.stage.backgroundColor = colorHex

    // Player colors
    // [red, blue, pink, green, brown, cyan, purple, yellow]
    colorPlayers = ['#eb1c1c', '#4368e0', '#f07dc1', '#44c83a', '#9e432e', '#3dd6e0', '#9339e0', '#ebd90f']

    // this.game.forcesSingleUpdate = true
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    this.scale.pageAlignHorizontally = true
    this.scale.pageAlignVertically = true
    // this.scale.setResizeCallback(this.resize, this)

    this.physics.startSystem(Phaser.Physics.ARCADE)

    this.stage.smoothed = true

    this.state.start('PreloadMenu')

    this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(this.down, this)
    this.game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(this.up, this)

    this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(this.left, this)
    this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(this.right, this)

    this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(this.selectPress, this)
    this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onUp.add(this.selectRelease, this)

    this.game.input.keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(this.backPressed, this)

    this.game.input.resetLocked = true

  },

  backPressed: function () {
    if (this.state.states[this.game.state.current].backPressed) {
      this.state.states[this.game.state.current].backPressed()
    }
  },

  up: function () {
    if (this.state.states[this.game.state.current].up) {
      this.state.states[this.game.state.current].up()
    }
  },

  down: function () {
    if (this.state.states[this.game.state.current].down) {
      this.state.states[this.game.state.current].down()
    }
  },

  left: function () {
    if (this.state.states[this.game.state.current].left) {
      this.state.states[this.game.state.current].left()
    }
  },

  right: function () {
    if (this.state.states[this.game.state.current].right) {
      this.state.states[this.game.state.current].right()
    }
  },

  selectPress: function () {
    if (this.state.states[this.game.state.current].selectPress) {
      this.state.states[this.game.state.current].selectPress()
    }
  },

  selectRelease: function () {
    if (this.state.states[this.game.state.current].selectRelease) {
      this.state.states[this.game.state.current].selectRelease()
    }
  },

  resize: function () {
    if ((this.state.current != 'GameMananger') && (this.state.current != 'PreloadMenu') && (this.state.current != 'PreloadGame')) {
      var winW = window.innerWidth
      var winH = window.innerHeight
      var winRatio = winW / winH
      var height = Math.round(Math.sqrt(baseArea / winRatio))
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

      w2 = this.game.world.width / 2
      h2 = this.game.world.height / 2

      if (this.state.states[this.game.state.current].setPositions) {
        this.state.states[this.game.state.current].setPositions()
      }
    }
  }

}
