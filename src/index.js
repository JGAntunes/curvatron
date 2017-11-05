
window.PIXI = require('phaser/build/custom/pixi')
window.p2 = require('phaser/build/custom/p2')
window.Phaser = require('phaser/build/custom/phaser-split')

const Boot = require('./states/boot')
const PreloadMenu = require('./states/preload-menu')
const Menu = require('./states/menu')
const Multiplayer = require('./states/multiplayer')
const SetKeys = require('./states/set-keys')
const PreloadGame = require('./states/preload-game')
const GameMananger = require('./states/game-manager')
const config = require('./config')

require('./network')

const height = Math.round(Math.sqrt(config.baseArea / config.winRatio))
const width = Math.round(config.winRatio * height)

const game = new window.Phaser.Game(width, height, window.Phaser.CANVAS, '')

game.state.add('Boot', Boot)
game.state.add('PreloadMenu', PreloadMenu)
game.state.add('Menu', Menu)
game.state.add('Multiplayer', Multiplayer)
game.state.add('SetKeys', SetKeys)
game.state.add('PreloadGame', PreloadGame)
game.state.add('GameMananger', GameMananger)
game.state.start('Boot')

window.buttonDown = function buttonDown () {
  this.tweenOut.onComplete.active = true
  this.tween.start()
}

window.buttonUp = function buttonUp () {
  this.tween.start()
}

window.clickButton = function clickButton (button, callback, state) {
  var s = button.scale
  var tweenTime = 30
  if (window.mobile) {
    tweenTime = 80
  }
  var tweenIn = button.game.add.tween(s).to({ x: s.x * 0.85, y: s.y * 0.85 }, tweenTime, window.Phaser.Easing.Linear.None, false)
  var tweenOut = button.game.add.tween(s).to({ x: s.x, y: s.y }, tweenTime, window.Phaser.Easing.Linear.None, false)

  tweenOut.onComplete.add(function () {
    if (!tweenOut.isRunning && !tweenIn.isRunning) {
      callback.call(this)
    }
  }
  , state)

  button.onInputOver.add(function () {
    tweenOut.onComplete.active = true
  })

  button.onInputOut.add(function () {
    tweenOut.onComplete.active = false
  })

  button.onInputDown.add(window.buttonDown, {
    tween: tweenIn,
    tweenOut: tweenOut
  })

  button.onInputUp.add(window.buttonUp, {
    tween: tweenOut
  })
}
