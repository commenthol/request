const http = require('http')
const net = require('net')
const {parse} = require('url')
const debug = require('debug')('test:proxy')
const through = require('streamss-through')

module.exports = setup

function setup () {
  const server = http.createServer((req, res) => {
    const {method, url, headers} = req
    const opts = parse(url)
    opts.method = method
    opts.headers = headers
    opts.headers['host'] = opts.host
    debug('http: %o', opts)
    const pReq = http.request(opts, (pRes) => {
      res.writeHead(pRes.statusCode, pRes.headers)
      pRes.pipe(res)
    })
    req.pipe(pReq)
  })
  server.on('connect', (req, socket) => {
    const {url, httpVersion} = req
    let [host, port] = url.split(/:/)
    port = port || 80
    const opts = {host, port}
    debug('connect: %o', opts)
    socket.write(`HTTP/${httpVersion} 200 Connection established\r\n\r\n`)
    const client = net.connect(opts)
    function log (type) {
      return function (data) {
        debug('connect:%s: %s', type, data.toString())
        this.push(data)
      }
    }
    socket
      .pipe(through(log('req')))
      .pipe(client)
      .pipe(through(log('res')))
      .pipe(socket)
  })
  return server
}

if (require.main === module) {
  setup().listen(8080)
}
