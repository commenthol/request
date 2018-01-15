/* eslint no-console:0 */

const fs = require('fs')
const qs = require('querystring')
const {parse} = require('url')
const http = require('http')
const https = require('https')
const zlib = require('zlib')
const {ReadStream} = require('./streams')
const debug = require('debug')('test:server')

const httpsOptions = {
  key: fs.readFileSync(`${__dirname}/../fixtures/star.key`),
  cert: fs.readFileSync(`${__dirname}/../fixtures/star.crt`)
}
const bomb = `${__dirname}/../fixtures/bomb.gz`

module.exports = setup

function setup (opts = {}) {
  const createServer = opts.type === 'https'
    ? https.createServer.bind(undefined, httpsOptions)
    : http.createServer

  const server = createServer((req, res) => {
    let {method, url, headers} = req
    const _url = parse(url)
    url = _url.path
    const raw = new ReadStream()
    const data = []

    const end = () => {
      let m
      const body = Buffer.concat(data).toString()
      const o = {url, method, headers}
      if (body) o.body = body
      debug('%o', o)

      if ((m = /^\/mirror(?:\/(\d{3}))?/.exec(url))) {
        if (m[1]) res.statusCode = +(m[1])
        else res.statusCode = 200
        if (~[204, 304].indexOf(res.statusCode)) {
          res.end()
          return
        }
        res.setHeader('Content-Type', 'application/json')
        raw.write(JSON.stringify(o))
      } else if ((m = /^\/set-cookie(?:\/(\d{3}))?/.exec(url))) {
        if (m[1]) res.statusCode = +(m[1])
        else res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Set-Cookie', setCookieFromQuery(url))
        raw.write(JSON.stringify(o))
      } else if ((m = /^\/content-length\/(\d+)/.exec(url))) {
        const buffer = Array(+m[1]).fill('a').join('')
        res.setHeader('Content-Length', buffer.length || 0)
        res.write(buffer)
        res.end()
        return
      } else if (/^\/redirect0/.test(url)) {
        res.end()
        return
      } else if ((m = /^\/redirect(\d)\/(30\d)/.exec(url))) {
        const count = +(m[1]) - 1
        res.statusCode = +(m[2])
        res.setHeader('Location', `/redirect${count}/${res.statusCode}`)
        res.end()
        return
      } else if (/^\/err-no-location-header/.test(url)) {
        res.statusCode = 301
        res.end()
        return
      } else if (/^\/err-max-redirect/.test(url)) {
        res.statusCode = 302
        res.setHeader('Location', url)
        res.end()
        return
      } else if (/^\/err-destroy/.test(url)) {
        res.destroy()
        return
      } else if (/^\/err-timeout/.test(url)) {
        return
      } else if (/^\/err-zip-length/.test(url)) {
        fs.readFile(bomb, (_, buffer) => {
          res.setHeader('Content-Encoding', 'gzip')
          res.write(buffer.slice(0, 1000))
          res.end()
        })
        return
      } else if (/^\/err-zip-encoding/.test(url)) {
        res.setHeader('Content-Encoding', 'gzip')
        const buffer = Array(100).fill('a').join('')
        res.write(buffer)
        res.end()
        return
      } else if (/^\/err-bomb/.test(url)) {
        res.setHeader('Content-Encoding', 'gzip')
        fs.createReadStream(bomb).pipe(res)
        return
      }
      raw.write('\n')

      if (/gzip/i.test(headers['accept-encoding'])) {
        res.setHeader('Content-Encoding', 'gzip')
        raw.pipe(zlib.createGzip()).pipe(res)
      } else {
        raw.pipe(res)
      }
    }

    req.on('data', (chunk) => {
      data.push(chunk)
    })
    req.on('end', end)
  })

  return server
}

if (require.main === module) {
  const argv = process.argv.slice(2)
  const port = argv[0] || 3000
  const type = argv[1] || 'http'
  setup({type}).listen(port)
}

function setCookieFromQuery (url) {
  const opts = parse(url)
  const {name, value, path, expires, domain, httpOnly, secure} = qs.parse(opts.query)
  // console.log({name, value, path, expires, domain, httpOnly, secure})
  const cookie = [`${name || 'name'}=${value || 'value'}`]
  if (expires) cookie.push('Expires=' + new Date(+expires).toUTCString())
  if (path) cookie.push(`Path=${path}`)
  if (domain) cookie.push(`Domain=${domain}`)
  if (httpOnly) cookie.push('HttpOnly')
  if (secure) cookie.push('Secure')
  const str = cookie.join('; ')
  return str
}
