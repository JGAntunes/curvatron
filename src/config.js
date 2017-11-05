const CHOSEN_COLOR = Math.round(Math.random() * 3)
const BG_COLORS = ['#76b83d', '#cf5e4f', '#805296', '#4c99b9']
const BG_COLORS_DARK = ['#3b5c1e', '#672f27', '#40294b', '#264c5c']

const { Phaser } = window

const config = {
  baseW: 1366,
  baseH: 768,
  baseRatio: 1366 / 768,
  baseArea: 1024 * 1024,
  mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  w2: 0,
  h2: 0,
  scale: 1,
  mute: false,
  key: Phaser.Keyboard.W,
  // Background colors
  // [green, red, purple, blue]
  modesLB: ['CgkIr97_oIgHEAIQCQ', 'CgkIr97_oIgHEAIQCg', 'CgkIr97_oIgHEAIQCw'],
  colorHex: BG_COLORS[CHOSEN_COLOR],
  colorHexDark: BG_COLORS_DARK[CHOSEN_COLOR],
  colorPlayers: ['#eb1c1c', '#4368e0', '#f07dc1', '#44c83a', '#9e432e', '#3dd6e0', '#9339e0', '#ebd90f'],
  maxPlayers: 7
}

config.winRatio = () => window.innerWidth / window.innerHeight
config.winOrientation = () => Math.abs(window.orientation) - 90 === 0 ? 'landscape' : 'portrait'

config.setHalfSizes = (w2, h2) => {
  config.w2 = w2
  config.h2 = h2
}

config.toggleMute = () => {
  config.mute = !config.mute
}

config.setMute = (mute) => {
  config.mute = mute
}

config.setKey = (key) => {
  config.key = key
}

config.setScale = (scale) => {
  config.scale = scale
}

module.exports = config
