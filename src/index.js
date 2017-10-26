
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

// TODO clear this
window.baseW = 1366
window.baseH = 768
window.baseRatio = 1366 / 768
window.baseArea = 1024 * 1024
window.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const winW = window.innerWidth
const winH = window.innerHeight
const winRatio = winW / winH
// mobile = true;

const height = Math.round(Math.sqrt(window.baseArea / winRatio))
const width = Math.round(winRatio * height)

const game = new Phaser.Game(width, height, Phaser.CANVAS, '')

game.state.add('Boot', Boot)
game.state.add('PreloadMenu', PreloadMenu)
game.state.add('Menu', Menu)
game.state.add('Multiplayer', Multiplayer)
game.state.add('SetKeys', SetKeys)
game.state.add('PreloadGame', PreloadGame)
game.state.add('GameMananger', GameMananger)
game.state.start('Boot')
