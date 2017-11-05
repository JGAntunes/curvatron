const config = require('../config')
const gameState = require('../game-state')

const { Phaser } = window

const COLLISION_MARGIN = 16

class Player {
  constructor (id, remoteId, x, y, mode, game, { actionable } = {}) {
    this.game = game
    this.mode = mode
    this.sprite = null
    this.score = 0
    this.direction = 1
    // New multiplayer stuff
    this.gameState = {}
    this.remoteId = remoteId
    this.tick = 0
    this.isReady = false
    this.created = null
    this.updates = []
    this.actionable = typeof actionable === 'boolean' ? actionable : true
    // ----

    this.id = id
    this.x = x
    this.y = y
    this.key = config.key
    this.dead = false
    this.ready = false

    this.speed = 1
    this.angularVelocity = 200
    this.growth = 30
    this.initialSize = 60
    this.size = this.initialSize
    this.frameCount = 0
    this.keyText = null
    this.paused = false
    this.textTween = null
    // Snake trail
    this.trailArray = []
    this.trail = null

    this.showKeyTime = 0
    this.showOneKey = true
    this.shrink = false
    this.shrinkAmount = 200
    this.touch = null
    this.playerMobileButton = null
    this.collectSemaphore = 0
  }

  static findById (id) {
    Object.keys(gameState.players).find((key) => gameState.players[key].id === parseInt(id))
  }

  create (managerGameState) {
    this.gameState = managerGameState
    const { scale, w2, h2 } = config
    this.created = Date.now()
    this.sprite = this.game.add.sprite(this.x, this.y, 'player' + this.id)
    this.sprite.name = '' + this.id

    this.sprite.anchor.setTo(0.5, 0.5)
    this.trail = this.game.make.sprite(0, 0, 'trail' + this.id)
    this.trail.anchor.set(0.5)
    this.trail.scale.set(scale)

    // used to do this in a fancier way, but it broke some stuff
    if (this.y > h2) {
      this.sprite.rotation = Math.PI
    }

    this.color = Phaser.Color.hexToColor(config.colorPlayers[this.id])

    this.game.physics.enable(this.sprite, Phaser.Physics.ARCADE)
    this.sprite.scale.set(scale)

    this.setAngularVelocity({ scaled: true })

    if (!this.actionable) return

    // Set the controls for the player
    if (config.mobile) {
      if (config.orientation === 'portrait') {
        this.playerMobileButton = this.game.add.button(w2, this.y, 'overlay', null, this)
        this.playerMobileButton.width = this.game.width
        this.playerMobileButton.height = this.game.height / 2
        this.playerMobileButton.onInputDown.add(this.click, this)
      } else {
        this.playerMobileButton = this.game.add.button(this.x, h2, 'overlay', null, this)
        this.playerMobileButton.width = this.game.width / 2
        this.playerMobileButton.height = this.game.height
        this.playerMobileButton.onInputDown.add(this.click, this)
      }
      this.playerMobileButton.alpha = 0
      this.playerMobileButton.anchor.setTo(0.5, 0.5)
      this.playerMobileButton.input.useHandCursor = true
    } else {
      this.game.input.onDown.add(this.keyPressed, this)
    }

    this.showKey()

    this.input = this.game.input.keyboard.addKey(this.key).onDown.add(this.keyPressed, this)
  }

  onRemoteUpdate (status) {
    this.updates.push(status)
  }

  collisionDetection (x, y) {
    if (this.mode.noCollisions) return false

    const collSize = 12 * config.scale
    return Object.values(gameState.players).reduce((acc, player) => (
      acc || player.trailArray.reduce((acc, curTrail) => (
        acc || (curTrail.x - collSize < x && curTrail.x + collSize > x &&
           curTrail.y - collSize < y && curTrail.y + collSize > y)
      ), false)
    ), false)
  }

  update (managerGameState) {
    const { paused, tick, bmd, borders } = managerGameState
    const { scale } = config
    this.gameState = managerGameState
    this.tick = tick
    // Remote players need a time buffer
    // if (!this.actionable && Date.now() - this.created <= 100) return

    // Paused?
    if (!this.paused && paused) {
      this.paused = true
      this.pause()
    } else if (this.paused && !paused) {
      this.paused = false
      this.unpause()
    }

    // Paused
    if (this.paused) return

    // Remote update are in queue
    if (!this.actionable && this.updates.length > 0) {
      const newPos = this.updates[0]

      const angleDiff = newPos.angle - this.sprite.body.angle
      // Get the shortest angle between both angles
      let shortestAngleDiff = angleDiff
      if (angleDiff > Math.PI) {
        shortestAngleDiff -= Math.PI * 2
      }
      if (angleDiff < -Math.PI) {
        shortestAngleDiff += Math.PI * 2
      }

      if (this.direction * shortestAngleDiff <= 0) {
        this.updates.shift()
        this.sprite.body.angle = newPos.angle
        this.direction = newPos.direction
        if (newPos.dead) this.kill()
      }
    }

    if (!this.sprite.alive) {
      this.kill()
    }

    this.game.physics.arcade.velocityFromAngle(this.sprite.angle, 300 * this.speed * scale, this.sprite.body.velocity)
    this.setAngularVelocity()
    this.frameCount = (this.frameCount + 1) % 1 / (this.speed * scale)

    const xx = Math.cos(this.sprite.rotation) * 18 * scale + this.sprite.x
    const yy = Math.sin(this.sprite.rotation) * 18 * scale + this.sprite.y

    if (!this.dead) {
      // Create trail
      if (this.frameCount === 0) {
        const trailPiece = {'x': this.sprite.x, 'y': this.sprite.y, 'n': 1}
        this.trailArray.push(trailPiece)
        bmd.draw(this.trail, this.sprite.x, this.sprite.y)
      }

      // Collision detection
      const collisionExists = this.collisionDetection(xx, yy)
      // console.log(`Collision ${collisionExists}`)
      if (collisionExists) this.kill()
    }

    // this.game.physics.arcade.overlap(this.sprite, groupPowers, this.collect, null, this)

    if (this.mode.obstacleGroup) {
      if (this.game.physics.arcade.overlap(this.sprite, this.mode.obstacleGroup, this.kill, null, this)) {
      }
    }

    Object.values(gameState.players).forEach((player) => {
      if (player.id !== this.id) {
        this.game.physics.arcade.overlap(this.sprite, player.sprite, this.kill, null, this)
      }
    })

    let trailPiece = null
    const ctx = bmd.context

    // erase trail from behind
    if (this.trailArray.length >= this.size && this.frameCount === 0 && (this.trailArray[0] || this.dead)) {
      if (this.mode.erasesTrail() || this.dead) {
        let nRemove = 1
        if (this.shrink) {
          if (this.trailArray.length <= this.size) {
            this.shrink = false
          } else {
            nRemove = 4
          }
        }
        for (let i = 0; i < nRemove && this.trailArray.length > 0; i++) {
          trailPiece = this.trailArray.shift()
          ctx.clearRect(trailPiece.x - 10 * scale, trailPiece.y - 10 * scale, 20 * scale, 20 * scale)
        }

        if (this.trailArray.length > 0) {
          bmd.draw(this.trail, this.trailArray[0].x, this.trailArray[0].y)
        }
      }
    }

    // erase trail from front
    if (this.dead && this.frameCount === 0 && this.trailArray[0]) {
      trailPiece = this.trailArray.pop()
      ctx.clearRect(trailPiece.x - 10 * scale, trailPiece.y - 10 * scale, 20 * scale, 20 * scale)

      if (this.trailArray.length > 0) {
        trailPiece = this.trailArray[this.trailArray.length - 1]
        bmd.draw(this.trail, trailPiece.x, trailPiece.y)
      }
    }

    // Border's collisions
    if ((xx + COLLISION_MARGIN * scale) <= borders[0]) {
      this.sprite.x = borders[1] - Math.cos(this.sprite.rotation) * 30 * scale
    } else if ((xx - COLLISION_MARGIN * scale) >= borders[1]) {
      this.sprite.x = borders[0] - Math.cos(this.sprite.rotation) * 30 * scale
    }

    if ((yy + COLLISION_MARGIN * scale) <= borders[2]) {
      this.sprite.y = borders[3] - Math.sin(this.sprite.rotation) * 30 * scale
    } else if ((yy - COLLISION_MARGIN * scale) >= borders[3]) {
      this.sprite.y = borders[2] - Math.sin(this.sprite.rotation) * 30 * scale
    }
  }

  keyPressed () {
    const { totalTime, gameOver, paused, moveSounds, pauseSprite } = this.gameState
    this.ready = true
    this.showOneKey = true
    this.showKeyTime = 2 + totalTime

    if (this.dead) return

    if (this.direction === 1 && !gameOver && !paused) {
      this.direction = -1
      if (!config.mute && !paused) {
        moveSounds[0].play()
      }
    } else if (!gameOver && !paused) {
      this.direction = 1
      if (!config.mute) {
        moveSounds[1].play()
      }
    }

    if (this.keyText.alpha === 1) {
      this.textTween = this.game.add.tween(this.keyText).to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, true)

      if (config.mobile) {
        this.game.add.tween(this.touch).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.None, true)
        this.game.add.tween(this.touch).to({ y: this.touch.y + 100 }, 1000, Phaser.Easing.Circular.In, true)
      }

      if (config.mobile && pauseSprite.alpha === 1) {
        this.gameState.pauseTween = this.game.add.tween(pauseSprite).to({ alpha: 0.2 }, 2000, Phaser.Easing.Linear.None, true)
      }
    }

    this.sendUpdate()
  }

  sendUpdate () {
    // Update peers
    window.network.update({
      tick: this.tick,
      angle: this.sprite.body.angle,
      x: this.sprite.body.x,
      y: this.sprite.body.y,
      dead: this.dead,
      direction: this.direction
    })
  }

  click () {
    const { w2, h2 } = config
    const x1 = w2 - 65
    const x2 = w2 + 65
    const y1 = h2 - 65
    const y2 = h2 + 65
    if (!(this.game.input.position.x > x1 &&
      this.game.input.position.x < x2 &&
      this.game.input.position.y > y1 &&
      this.game.input.position.y < y2)) {
      this.keyPressed()
    }
  }

  kill (player, other) {
    if (this.keyText) this.keyText.destroy()
    if (!this.dead) {
      if (!player && !other) {
        this.sprite.kill()
        this.dead = true
      }

      if (!config.mute) {
        this.gameState.killSound.play()
      }

      if (this.mode.kill) {
        this.mode.kill()
      }
    }

    if (other && !this.mode.sp) {
      debugger
      const thisPlayer = Player.findById(player.name)
      const otherPlayer = Player.findById(other.name)
      if (thisPlayer.score >= otherPlayer.score) {
        otherPlayer.kill()
      }
      if (thisPlayer.score <= otherPlayer.score) {
        thisPlayer.kill()
      }
    }
  }

  // collect (player, power) {
  //   if (this.collectSemaphore === 0) {
  //     this.collectSemaphore = 1
  //     if (!mute) {
  //       collectSound.play()
  //     }
  //
  //     if (this.mode.collect) {
  //       this.mode.collect(player, power, this)
  //     }
  //
  //     this.game.add.tween(power).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true)
  //     const powerTween = this.game.add.tween(power.scale).to({x: 0, y: 0}, 300, Phaser.Easing.Back.In, true)
  //     powerTween.onComplete.add(function () { power.destroy(); this.collectSemaphore = 0 }, this)
  //   }
  // }

  showKey () {
    // Show player's key
    const { w2, h2, scale, mobile } = config
    if (!this.showOneKey) return

    const keyX = Math.round(Math.cos(this.sprite.rotation + Math.PI / 2 * this.direction) * 88 * scale) + this.sprite.x
    const keyY = Math.round(Math.sin(this.sprite.rotation + Math.PI / 2 * this.direction) * 88 * scale) + this.sprite.y
    this.showOneKey = false
    if (this.keyText) {
      this.textTween = this.game.add.tween(this.keyText).to({ alpha: 1 }, 500, Phaser.Easing.Linear.None, true)
      this.keyText.x = keyX
      this.keyText.y = keyY
    } else {
      this.keyText = this.game.add.text(keyX, keyY, String.fromCharCode(this.key), {
        font: '60px dosis',
        fill: '#ffffff',
        align: 'center'})
      this.keyText.scale.set(scale)
      this.keyText.anchor.setTo(0.5, 0.5)

      if (mobile && this.mode.getHighScore) {
        this.keyText.setText(this.mode.getHighScore())
      }
    }

    if (mobile) {
      if (config.orientation === 'portrait') {
        this.touch = this.game.add.sprite(w2, h2 * 1.5 + 100, 'touch')
      } else {
        this.touch = this.game.add.sprite(w2 * 0.5, h2 + 100, 'touch')
      }
      this.touch.anchor.setTo(0.5, 0.5)
      this.touch.alpha = 0
      this.game.add.tween(this.touch).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true)
      this.game.add.tween(this.touch).to({ y: this.touch.y - 100 }, 1000, Phaser.Easing.Circular.Out, true)
    }
  }

  addCrown () {
    this.sprite.loadTexture('crown' + this.id)
  }

  removeCrown () {
    this.sprite.loadTexture('player' + this.id)
  }

  pause () {
    if (this.mode.submitScore) {
      this.mode.submitScore()
    }
    if (this.textTween) {
      this.textTween.pause()
    }
    this.sprite.body.angularVelocity = 0
    this.sprite.body.velocity.x = 0
    this.sprite.body.velocity.y = 0
  }

  unpause () {
    if (this.textTween) {
      this.textTween.resume()
    }
    this.setAngularVelocity({ scaled: true })
  }

  setAngularVelocity ({ scaled = false } = {}) {
    const vel = this.direction * this.angularVelocity * this.speed
    this.sprite.body.angularVelocity = scaled ? vel * config.scale : vel
  }

  render () {
    this.game.debug.body(this.sprite)
  }
}

module.exports = Player
