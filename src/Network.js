const ROOT_TOPIC = '/curvatron'

const generateTopic = (id) => {
  return `${ROOT_TOPIC}/${id}`
}

class Network {

  const node
  const gameId
  const peerId
  const handlers = []

  static generateId() {
    const id = '';
    const typedArray = new Uint32Array(4);
    window.crypto.getRandomValues(typedArray);
    typedArray.forEach((elem) => id += elem.toString(36))
    return id
  }

  constructor(handlers) {
    const node = new Ipfs({
      init: true,
      start: true,
      EXPERIMENTAL: { // enable experimental features
        pubsub: true,
        dht: true // enable KadDHT, currently not interopable with go-ipfs
      }
    })

    node.id((err, id) => {
      if (err) throw err
      this.peerId = id
    })

    // Setup event listeners
    node.on('error', (err) => console.log('[IPFS] Error', err)) // Node has hit some error while initing/starting

    node.on('init', () => console.log('[IPFS] Initialized'))     // Node has successfully finished initing the repo
    node.on('start', () => console.log('[IPFS] Started'))    // Node has started
    node.on('stop', () => console.log('[IPFS] Stopped'))     // Node has stopped

    this.node = node
    this.handlers = handlers
  }

  msgHandler(msg) {
    const origin = msg.from
    const data = JSON.parse(msg.data.toString('utf8'))
    const op = data.op
    this.handlers[op](origin, data)
  }

  join(gameId) {
    this.node.pubsub.subscribe(generateTopic(gameId))
    this.gameId = gameId
    const Buffer = this.node.types.Buffer
    const msg =  new Buffer(JSON.toString({op: 'join'})
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }

  create() {
    const id = generateId()
    this.node.pubsub.subscribe(generateTopic(id))
    this.gameId = id
    return id;
  }

  start() {
    // TODO generate msg
    const Buffer = this.node.types.Buffer
    const msg =  new Buffer(JSON.toString({op: 'start'})
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }

  update(status) {
    // TODO generate msg
    const Buffer = this.node.types.Buffer
    const msg = new Buffer(JSON.toString({
      op: 'update',
      x: status.x,
      y: status.y,
      direction: status.direction
    })
    this.node.pubsub.publish(generateTopic(this.gameId), msg)
  }
}
