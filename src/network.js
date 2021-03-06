const Ipfs = require('ipfs')
const ROOT_TOPIC = '/curvatron'

const generateTopic = (id) => {
  return `${ROOT_TOPIC}/${id}`
}

class Network {
  static generateId () {
    let id = ''
    const typedArray = new Uint32Array(4)
    window.crypto.getRandomValues(typedArray)
    typedArray.forEach((elem) => { id += elem.toString(36) })
    return id
  }

  constructor (handlers) {
    const node = new Ipfs({
      init: true,
      start: true,
      config: {
        Bootstrap: [],
        Addresses: {
          Swarm: [
            '/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star'
            // '/dns4/signal.local.jgantunes.com/ws/p2p-webrtc-star'
          ]
        }
      },
      EXPERIMENTAL: { // enable experimental features
        pubsub: true
      }
    })

    // Setup event listeners
    node.on('error', (err) => console.log('[IPFS] Error', err)) // Node has hit some error while initing/starting

    node.on('init', () => console.log('[IPFS] Initialized'))     // Node has successfully finished initing the repo
    node.on('start', () => {
      node.id((err, identifier) => {
        if (err) throw err
        this.peerId = identifier.id
      })
      console.log('[IPFS] Started')
    })    // Node has started
    node.on('stop', () => console.log('[IPFS] Stopped'))     // Node has stopped

    this.msgHandler = this.msgHandler.bind(this)
    this.gameId = null
    this.node = node
    this.handlers = handlers || []
  }

  setHandler (event, func, options = {}) {
    // debugger
    this.handlers[event] = {}
    this.handlers[event].func = func
    this.handlers[event].opts = options
  }

  msgHandler (msg) {
    const origin = msg.from
    // msg from self
    if (origin === this.peerId) return
    console.log(msg.data.toString('utf8'))
    const data = JSON.parse(msg.data.toString('utf8'))
    const op = data.op
    console.log('MSG', msg)
    // debugger
    // No handler set
    if (!this.handlers[op] || !this.handlers[op].func) return
    this.handlers[op].func(origin, data)
    if (this.handlers[op].opts.once) delete this.handlers[op]
  }

  join (id) {
    this.gameId = id
    const Buffer = this.node.types.Buffer
    const msg = new Buffer(JSON.stringify({op: 'join'}))
    console.log(generateTopic(id))
    this.node.pubsub.subscribe(generateTopic(id), this.msgHandler)
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }

  listUpdate (players) {
    const msg = {op: 'list'}
    msg.players = Object.keys(players).map((key) => ({
      remoteId: players[key].remoteId,
      id: players[key].id
    }))
    const Buffer = this.node.types.Buffer
    const buf = new Buffer(JSON.stringify(msg))
    this.node.pubsub.publish(generateTopic(this.gameId), buf)
  }

  create () {
    const id = Network.generateId()
    console.log(generateTopic(id))
    this.node.pubsub.subscribe(generateTopic(id), this.msgHandler)
    this.gameId = id
    return id
  }

  start () {
    // TODO generate msg
    const Buffer = this.node.types.Buffer
    const msg = new Buffer(JSON.stringify({op: 'start'}))
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }

  update (status) {
    // TODO generate msg
    const Buffer = this.node.types.Buffer
    const msg = new Buffer(JSON.stringify({
      op: 'update',
      type: status.type,
      angle: status.angle,
      x: status.x,
      y: status.y,
      dead: status.dead,
      direction: status.direction,
      timestamp: Date.now()
    }))
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }
}

window.network = new Network()
