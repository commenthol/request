const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')
const proxySetup = require('./support/proxy')
const ProxyAgent = require('https-proxy-agent')

const fs = require('fs')

const PORT = 3000
const PROXY_PORT = 8080

describe('proxy', function () {
  let server
  let proxy

  describe('http', function () {
    before((done) => {
      server = setup().listen(PORT, () => {
        // done()
        proxy = proxySetup().listen(PROXY_PORT, done)
      })
    })

    after((done) => {
      server.close(() => {
        // done()
        proxy.close(done)
      })
    })

    it('should proxy http request', function (done) {
      const agent = new ProxyAgent({host: 'localhost', port: PROXY_PORT})
      const req = new Request({agent})
      req
        .method('GET', `http://localhost:${PORT}/mirror`)
        .set({'useR-Agent': 'Cased/2'})
        .accept('*/*')
        // .set('Accept-Encoding', 'nada')
        .end((err, res) => {
          assert.ok(!err, err && err.message)
          assert.equal(res.data.toString(), '{"url":"/mirror","method":"GET","headers":{"accept-encoding":"gzip, deflate","user-agent":"Cased/2","accept":"*/*","host":"localhost:3000","connection":"close"}}\n')
          done()
        })
    })
  })

  describe('https', function () {
    const ca = fs.readFileSync(`${__dirname}/fixtures/root_ca.crt`)

    before((done) => {
      server = setup({type: 'https'}).listen(PORT, () => {
        // done()
        proxy = proxySetup().listen(PROXY_PORT, done)
      })
    })

    after((done) => {
      server.close(() => {
        // done()
        proxy.close(done)
      })
    })

    it('should proxy https request', function (done) {
      const agent = new ProxyAgent({host: 'localhost', port: PROXY_PORT, ca})
      const req = new Request({agent})
      req
        .method('GET', `https://localhost:${PORT}/mirror`)
        .set({'useR-Agent': 'Cased/2'})
        .accept('*/*')
        .end((err, res) => {
          assert.ok(!err, err && err.message)
          assert.equal(res.data.toString(), '{"url":"/mirror","method":"GET","headers":{"accept-encoding":"gzip, deflate","user-agent":"Cased/2","accept":"*/*","host":"localhost:3000","connection":"close"}}\n')
          done()
        })
    })
  })
})
