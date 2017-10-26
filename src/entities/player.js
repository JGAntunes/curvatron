const COLLISION_MARGIN = 16
// const {
//   mobile,
//   players,
//   scale,
//   h2,
//   w2,
//   paused,
//   Phaser,
//   totalTime,
//   groupPowers,
//   bmd,
//   borders,
//   network,
//   colorPlayers,
//   localStorage,
//   killSound,
//   mute,
//   gameOver,
//   moveSounds,
//   tempLabel,
//   tempLabelText,
//   collectSound,
//   pauseSprite
// } = window

var Player = function (id, remoteId, x, y, key, mode, game, { actionable } = {}) {
  this.game = game
  this.mode = mode
  this.sprite = null
  this.score = 0
  this.direction = 1
  // New multiplayer stuff
  this.remoteId = remoteId
  this.isReady = false
  // debugger
  this.created = null
  this.updates = []
  this.actionable = typeof actionable === 'boolean' ? actionable : true
  // ----

  this.id = id
  this.x = x
  this.y = y
  this.key = key
  this.dead = false
  this.ready = false
  // this.speed = actionable? 1 : 0.8;
  this.speed = 1
  this.angularVelocity = 1
  this.growth = 30
  this.initialSize = 60
  this.size = this.initialSize
  this.frameCount = 0
  this.keyText = null
  this.paused = false
  this.textTween = null
  this.trailArray = []
  this.trail = null
  this.showKeyTime = 0
  this.showOneKey = true
  this.shrink = false
  this.shrinkAmount = 200
  this.touch = null
  this.orientation = null
  this.playerMobileButton = null
  this.collectSemaphore = 0
}

Player.findById = (id) => Object.keys(players).find((key) => players[key].id === id)

Player.prototype = {
  create: function () {
    // debugger
    this.created = Date.now()
    this.orientation = Math.abs(window.orientation) - 90 === 0 ? 'landscape' : 'portrait'
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

    if (!this.mode.sp) {
      this.color = Phaser.Color.hexToColor(colorPlayers[this.id])
    } else {
      this.color = Phaser.Color.hexToColor('#FFFFFF')
    }

    this.game.physics.enable(this.sprite, Phaser.Physics.ARCADE)
    this.sprite.scale.set(scale)
    // this.sprite.body.setSize(20,20,0,0);

    this.sprite.body.angularVelocity = this.direction * 200 * this.angularVelocity * this.speed * scale

    // debugger
    if (!this.actionable) return

    // Control stuff
    if (mobile && this.mode.sp) {
      this.game.input.onDown.add(this.click, this)
    } else if (mobile && !this.mode.sp) {
      if (this.orientation === 'portrait') {
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
    } else if (!mobile && this.mode.sp) {
      this.game.input.onDown.add(this.keyPressed, this)
    }

    this.showKey()

    this.input = this.game.input.keyboard.addKey(this.key).onDown.add(this.keyPressed, this)
  },

  remoteUpdate: function (status) {
    this.updates.push(status)
  },

  update: function () {
    if (!this.actionable && Date.now() - this.created <= 500) return
    // this.speed = 1
    if (!this.actionable && this.updates.length > 0) {
      const newPos = this.updates[0]
      // const xDiff = newPos.x - this.sprite.x
      // const yDiff = newPos.y - this.sprite.y
      // const distance = Math.sqrt(Math.abs(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)))
      const angleDiff = Math.abs(newPos.angle - this.sprite.angle)
      console.log(this.sprite.angle, newPos.angle, angleDiff)
      if (angleDiff <= 18) {
        this.updates.shift()
        this.dead = newPos.dead
        this.sprite.angle = newPos.angle
        // this.sprite.x = (this.sprite.x + newPos.x) / 2
        // this.sprite.y = (this.sprite.y + newPos.y) / 2
        this.direction = newPos.direction
      }
      // if (distance <= 30) this.speed = 0.5
      // if (distance <= 50) this.speed = 0.8
    }
    if (!this.paused && paused) {
      this.paused = true
      this.pause()
    } else if (this.paused && !paused) {
      this.paused = false
      this.unpause()
    }

    if (this.showKeyTime <= totalTime && !this.dead && !paused && this.mode.sp) {
      this.showKey()
    }

    if (!this.paused) {
      if (!this.sprite.alive) {
        this.kill()
      }

      this.game.physics.arcade.velocityFromAngle(this.sprite.angle, 300 * this.speed * scale, this.sprite.body.velocity)
      this.sprite.body.angularVelocity = this.direction * 200 * this.angularVelocity * this.speed
      this.frameCount = (this.frameCount + 1) % 1 / (this.speed * scale)

      var xx = Math.cos(this.sprite.rotation) * 18 * scale + this.sprite.x
      var yy = Math.sin(this.sprite.rotation) * 18 * scale + this.sprite.y

      if (!this.dead) {
        // Create trail
        if (this.frameCount === 0 && !this.dead) {
          window.trailPiece = {'x': this.sprite.x, 'y': this.sprite.y, 'n': 1}
          this.trailArray.push(window.trailPiece)
          bmd.draw(this.trail, this.sprite.x, this.sprite.y)
        }

        // collision detection
        if (!this.mode.noCollisions) {
          var collSize = 12 * scale
          Object.values(players).forEach((player) => {
            for (var j = 0; j < this.trailArray.length; j++) {
              var curTrail = player.trailArray[j]
              if (curTrail && curTrail.x - collSize < xx && curTrail.x + collSize > xx &&
                 curTrail.y - collSize < yy && curTrail.y + collSize > yy) {
                this.kill()
              }
            }
          })
        }
      }
      this.game.physics.arcade.overlap(this.sprite, groupPowers, this.collect, null, this)

      if (this.mode.obstacleGroup) {
        if (this.game.physics.arcade.overlap(this.sprite, this.mode.obstacleGroup, this.kill, null, this)) {
        }
      }

      Object.values(players).forEach((player) => {
        if (player.id !== this.id) {
          this.game.physics.arcade.overlap(this.sprite, player.sprite, this.kill, null, this)
        }
      })

      var trailPiece = null
      var ctx = bmd.context

      // erase trail from behind
      if (this.trailArray.length >= this.size && this.frameCount === 0 && (this.trailArray[0] || this.dead)) {
        if (this.mode.erasesTrail() || this.dead) {
          var nRemove = 1
          if (this.shrink) {
            if (this.trailArray.length <= this.size) {
              this.shrink = false
            } else {
              nRemove = 4
            }
          }
          for (var i = 0; i < nRemove && this.trailArray.length > 0; i++) {
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
  },

  keyPressed: function () {
    this.ready = true
    this.showOneKey = true
    this.showKeyTime = 2 + totalTime
    if (!this.dead) {
      if (this.direction === 1 && !gameOver && !paused) {
        this.direction = -1
        if (!mute && !paused) {
          moveSounds[0].play()
        }
      } else if (!gameOver && !paused) {
        this.direction = 1
        if (!mute) {
          moveSounds[1].play()
        }
      }
      if (this.keyText.alpha === 1) {
        this.textTween = this.game.add.tween(this.keyText).to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, true)

        if (mobile && this.mode.sp) {
          this.game.add.tween(this.touch).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.None, true)
          this.game.add.tween(this.touch).to({ y: this.touch.y + 100 }, 1000, Phaser.Easing.Circular.In, true)
        } else if (mobile && !this.mode.sp) {
          if (this.orientation === 'portrait') {
            this.game.add.tween(this.touch).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.None, true)
            if (this.touch.angle === 0) {
              this.game.add.tween(this.touch).to({ y: this.touch.y + 90 }, 1000, Phaser.Easing.Circular.In, true)
            } else {
              this.game.add.tween(this.touch).to({ y: this.touch.y - 90 }, 1000, Phaser.Easing.Circular.In, true)
            }
          }	else {
            this.game.add.tween(this.touch).to({ alpha: 0 }, 1000, Phaser.Easing.Linear.None, true)
            this.game.add.tween(this.touch).to({ x: this.touch.x - this.touch.angle }, 1000, Phaser.Easing.Circular.In, true)
          }
        }

        if (this.mode.sp && !mobile && this.mode.leaderboardID) {
          this.game.add.tween(tempLabel).to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, true)
          this.game.add.tween(tempLabelText).to({ alpha: 0 }, 2000, Phaser.Easing.Linear.None, true)
        }

        if (mobile && pauseSprite.alpha === 1) {
          window.pauseTween = this.game.add.tween(pauseSprite).to({ alpha: 0.2 }, 2000, Phaser.Easing.Linear.None, true)
        }
      }
    }
    // Update peers
    network.update({
      angle: this.sprite.angle,
      x: this.sprite.x,
      y: this.sprite.y,
      dead: this.dead,
      direction: this.direction
    })
  },

  click: function () {
    var x1 = w2 - 65
    var x2 = w2 + 65
    var y1 = h2 - 65
    var y2 = h2 + 65
    if (!(this.game.input.position.x > x1 &&
      this.game.input.position.x < x2 &&
      this.game.input.position.y > y1 &&
      this.game.input.position.y < y2)) {
      this.keyPressed()
    }

    // do not work :(
/*
    else if(this.mode.leaderboardID == null){
      var x11 = w2*0.5 - 100 - 61, x22 = w2*0.5 - 100 + 61;

       if (!(this.game.input.position.x > x11
        && this.game.input.position.x < x22
        && this.game.input.position.y > y1
        && this.game.input.position.y < y2 )){
         console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
        this.keyPressed();
       }
     }
   */
  },

  kill: function (player, other) {
    this.keyText.destroy()
    if (!this.dead) {
      if (this.mode.sp) {
        var deathScore = parseInt(localStorage.getItem('deathScore'))
        if (isNaN(deathScore)) {
          deathScore = 0
        }
        localStorage.setItem('deathScore', deathScore + 1)
      }
      if (this.mode.sp || (!player && !other)) {
        this.sprite.kill()
        this.dead = true
      }

      if (!mute) {
        killSound.play()
      }

      if (this.mode.kill) {
        this.mode.kill()
      }
    }

    if (other && !this.mode.sp) {
      var thisPlayer = Player.findById(player.name)
      var otherPlayer = Player.findById(other.name)
      if (thisPlayer.score >= otherPlayer.score) {
        otherPlayer.kill()
      }
      if (thisPlayer.score <= otherPlayer.score) {
        thisPlayer.kill()
      }
    }
  },

  collect: function (player, power) {
    if (this.collectSemaphore === 0) {
      this.collectSemaphore = 1
      if (!mute) {
        collectSound.play()
      }

      if (this.mode.collect) {
        this.mode.collect(player, power, this)
      }

      this.game.add.tween(power).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true)
      var powerTween = this.game.add.tween(power.scale).to({x: 0, y: 0}, 300, Phaser.Easing.Back.In, true)
      powerTween.onComplete.add(function () { power.destroy(); this.collectSemaphore = 0 }, this)
    }
  },

  showKey: function () {
    // Show player's key
    if (this.showOneKey) {
      var keyX = Math.round(Math.cos(this.sprite.rotation + Math.PI / 2 * this.direction) * 88 * scale) + this.sprite.x
      var keyY = Math.round(Math.sin(this.sprite.rotation + Math.PI / 2 * this.direction) * 88 * scale) + this.sprite.y
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
          if (!this.mode.sp) {
            this.keyText.visible = false
          }
        }
      }

      if (this.mode.sp && mobile) {
        if (this.orientation === 'portrait') {
          this.touch = this.game.add.sprite(w2, h2 * 1.5 + 100, 'touch')
        } else {
          this.touch = this.game.add.sprite(w2 * 0.5, h2 + 100, 'touch')
        }
        this.touch.anchor.setTo(0.5, 0.5)
        this.touch.alpha = 0
        this.game.add.tween(this.touch).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true)
        this.game.add.tween(this.touch).to({ y: this.touch.y - 100 }, 1000, Phaser.Easing.Circular.Out, true)
      } else if (!this.mode.sp && mobile) {
        if (this.orientation === 'portrait') {
          this.touch = this.game.add.sprite(w2, this.y, 'touch')
          if (this.y > w2) {
            this.touch.angle = 0
            this.touch.x += 200
          } else {
            this.touch.angle = 180
            this.touch.x -= 200
          }
          this.touch.anchor.setTo(0.5, 0.5)
          this.touch.alpha = 0
          this.game.add.tween(this.touch).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true)
          if (this.touch.angle === 0) {
            this.game.add.tween(this.touch).to({y: this.touch.y - 100}, 1000, Phaser.Easing.Circular.Out, true)
          } else {
            this.game.add.tween(this.touch).to({y: this.touch.y + 100}, 1000, Phaser.Easing.Circular.Out, true)
          }
        } else {
          this.touch = this.game.add.sprite(this.x, h2, 'touch')
          if (this.x > w2) {
            this.touch.angle = -90
            this.touch.y -= 200
          } else {
            this.touch.angle = 90
            this.touch.y += 200
          }

          this.touch.anchor.setTo(0.5, 0.5)
          this.touch.alpha = 0
          this.game.add.tween(this.touch).to({ alpha: 1 }, 1000, Phaser.Easing.Linear.None, true)
          this.game.add.tween(this.touch).to({ x: this.touch.x + this.touch.angle }, 1000, Phaser.Easing.Circular.Out, true)
        }
      }
    }
  },

  addCrown: function () {
    this.sprite.loadTexture('crown' + this.id)
  },

  removeCrown: function () {
    this.sprite.loadTexture('player' + this.id)
  },

  pause: function () {
    if (this.mode.submitScore) {
      this.mode.submitScore()
    }
    if (this.textTween) {
      this.textTween.pause()
    }
    this.sprite.body.angularVelocity = 0
    this.sprite.body.velocity.x = 0
    this.sprite.body.velocity.y = 0
  },

  unpause: function () {
    if (this.textTween) {
      this.textTween.resume()
    }
    this.sprite.body.angularVelocity = this.direction * 200 * this.angularVelocity * this.speed * scale
  },

  render: function () {
    this.game.debug.body(this.sprite)
  }

}

module.exports = Player
