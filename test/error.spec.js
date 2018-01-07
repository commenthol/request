const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')

const PORT = 3000

describe('errors', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should return error for unresolved host', done => {
    new Request().get('http://edd11caaf727d6a38d4e928bdb').end((err, res) => {
      assert.equal(err.code, 'ENOTFOUND')
      assert.ok(err.message, 'getaddrinfo ENOTFOUND edd11caaf727d6a38d4e928bdb edd11caaf727d6a38d4e928bdb:80')
      assert.equal(res, undefined)
      done()
    })
  })

  it('should return error for invalid protocol', done => {
    new Request().get(`https://localhost:${PORT}/mirror`).end((err, res) => {
      assert.equal(err.code, 'ECONNRESET')
      assert.equal(err.message, 'socket hang up')
      assert.equal(res, undefined)
      done()
    })
  })

  it('should handle destroyed socket', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/err-destroy`)
      .end((err, res) => {
        assert.equal(err.code, 'ECONNRESET')
        assert.equal(err.message, 'socket hang up')
        assert.strictEqual(res, undefined)
        done()
      })
  })

  it('should handle timeout', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/err-timeout`)
      .timeout(50).end((err, res) => {
        assert.equal(err.code, 'ETIMEDOUT')
        assert.equal(err.message, 'socket timed out')
        assert.strictEqual(res, undefined)
        done()
      })
  })

  it('should destroy a request', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/err-timeout`)
      .timeout(1000)
      .end((err, res) => {
        assert.equal(err.code, 'ECONNRESET')
        assert.equal(err.message, 'socket hang up')
        assert.strictEqual(res, undefined)
        done()
      })
    setTimeout(() => {
      req.destroy()
    }, 50)
  })

  it('should bail out at maxResponseSize', function (done) {
    this.timeout(10000)
    const req = new Request({maxResponseSize: 200000})
    req.get(`http://localhost:${PORT}/err-bomb`)
      .end((err, res) => {
        assert.equal(err.code, 'ERR_MAX_RESPONSE_SIZE')
        assert.equal(err.message, 'max response size reached')
        assert.ok(res.data.length > 10000, res.data.length)
        done()
      })
  })
})
