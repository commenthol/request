const fs = require('fs')
// const qs = require('querystring')
// const {parse} = require('url')
const http = require('http')
const https = require('https')
const zlib = require('zlib')
const mime = require('mime')
const debug = require('debug')('test:server')
const app = require('express')()
const utils = require('./utils')

// ---- helpers

const files = {
  'test.png': `${__dirname}/../fixtures/test.png`
}

const httpsOptions = {
  key: fs.readFileSync(`${__dirname}/../fixtures/star.key`),
  cert: fs.readFileSync(`${__dirname}/../fixtures/star.crt`)
}

const getReq = (req) => {
  const {method, url, headers, body} = req
  const o = {url, method, headers}
  if (body) o.body = body
  return o
}

const statusCode = (url) => {
  const m = /[/](\d{3})(?:[/]|$)/.exec(url)
  if (m) return +m[1]
}

// ---- middlewares

const bodyParse = (req, res, next) => {
  const data = []
  req.on('data', (chunk) => data.push(chunk))
  req.on('end', () => {
    req.body = Buffer.concat(data).toString()
    next()
  })
}

const compress = (req, res, next) => {
  if (/gzip/i.test(req.headers['accept-encoding'])) {
    const stream = zlib.createGzip()
    // const on = res.on
    const write = res.write
    const end = res.end

    res.setHeader('Content-Encoding', 'gzip')
    res.write = stream.write.bind(stream)
    res.end = stream.end.bind(stream)
    res.on = stream.on.bind(stream)
    res.flush = stream.flush.bind(stream)
    stream.on('data', (chunk) => {
      if (!res.finished && write.call(res, chunk) === false) stream.pause()
    })
    stream.on('end', () => end.call(res))
    stream.on('drain', () => stream.resume())
    stream.on('error', () => {
      if (!res.finished) res.end()
    })
  }
  next()
}

const log = (req, res, next) => {
  debug('%o', getReq(req))
  next()
}

const echo = (req, res) => {
  res.statusCode = statusCode(req.url) || 200
  if (~[204, 304].indexOf(res.statusCode)) {
    res.end()
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify(getReq(req)))
    res.end()
  }
}

const setCookie = (req, res, next) => {
  const {cookie} = req.query
  if (cookie) {
    const _cookie = Array.isArray(cookie) ? cookie : [cookie]
    utils.decodeCookies(_cookie).forEach((c) => {
      res.setHeader('set-cookie', c)
    })
  }
  next()
}

module.exports = setup

app.use(bodyParse, setCookie, log)
app.all('/echo(/*|$)', compress, echo)
app.all(['/end', '/redirect0(/*|$)'], (req, res) => {
  res.end()
})
app.all(/^[/]redirect(\d+)(?:[/]|$)/, (req, res) => {
  const m = /^[/]redirect(\d+)(?:[/]|$)/.exec(req.url)
  const count = (+m[1] || 1) - 1
  res.statusCode = statusCode(req.url) || 302
  res.setHeader('Location', `/redirect${count}/${res.statusCode}`)
  res.end()
})
app.all('/content-length(/*|$)', (req, res) => {
  const m = /^\/content-length\/(\d+)/.exec(req.url)
  const buffer = Array(+m[1] || 0).fill('a').join('')
  res.setHeader('Content-Length', buffer.length || 0)
  res.end(buffer)
})
app.get('/static/:file', compress, (req, res) => {
  const {file} = req.params
  const f = files[file]
  if (f) {
    res.setHeader('Content-Type', mime.getType(file))
    fs.createReadStream(f).pipe(res)
  } else {
    res.statusCode = 404
    res.end()
  }
})
app.all('/errors/no-location-header', (req, res) => {
  res.statusCode = 301
  res.end()
})
app.all('/errors/max-redirects', (req, res) => {
  res.statusCode = 302
  res.setHeader('Location', req.url)
  res.end()
})
app.all('/errors/destroy', (req, res) => {
  res.destroy()
})
app.all('/errors/timeout',  (req, res) => { // eslint-disable-line
  // do nothing
})
app.all('/errors/zip-length', (req, res) => {
  const buf = Buffer.alloc(10000000, 0) // 10MB
  zlib.gzip(buf, (_, buffer) => {
    res.setHeader('Content-Encoding', 'gzip')
    res.write(buffer.slice(0, 1000))
    res.end()
  })
})
app.all('/errors/zip-encoding', (req, res) => {
  const buffer = Array(100).fill('a').join('')
  res.setHeader('Content-Encoding', 'gzip')
  res.write(buffer)
  res.end()
})
app.all('/errors/zip-bomb', compress, (req, res) => {
  const buf = Buffer.alloc(50000000, 0) // 50MB
  res.write(buf)
  res.end()
})

function setup (opts = {}) {
  const createServer = opts.type === 'https'
    ? https.createServer.bind(undefined, httpsOptions)
    : http.createServer
  return createServer(app)
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const port = argv[0] || 3000
  const type = argv[1] || 'http'
  setup({type}).listen(port)
}
