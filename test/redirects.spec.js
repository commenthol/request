const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')

const PORT = 3000

describe('redirects', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should handle 301 redirects', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/redirect4/301`).end((err, res) => {
      assert.ok(!err, err && err.message)
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/redirect3/301',
        'http://localhost:3000/redirect2/301',
        'http://localhost:3000/redirect1/301',
        'http://localhost:3000/redirect0/301'
      ])
      done()
    })
  })

  it('should handle 302 redirects', function (done) {
    const req = new Request()
    req.method('POST', `http://localhost:${PORT}/redirect4/302`).send('test').end((err, res) => {
      assert.ok(!err, err && err.message)
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/redirect3/302',
        'http://localhost:3000/redirect2/302',
        'http://localhost:3000/redirect1/302',
        'http://localhost:3000/redirect0/302'
      ])
      done()
    })
  })

  it('should handle 303 redirects', function (done) {
    const req = new Request()
    req.method('POST', `http://localhost:${PORT}/redirect1/303`).send('test').end((err, res) => {
      assert.ok(!err, err && err.message)
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/redirect0/303'
      ])
      done()
    })
  })

  it('should handle max redirects error', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/err-max-redirect`).end((err, res) => {
      assert.equal(err.code, 'ERR_MAX_REDIRECTS')
      assert.equal(err.message, 'max redirects reached')
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/err-max-redirect',
        'http://localhost:3000/err-max-redirect',
        'http://localhost:3000/err-max-redirect',
        'http://localhost:3000/err-max-redirect',
        'http://localhost:3000/err-max-redirect'
      ])
      done()
    })
  })

  it('should handle max redirects error for HEAD', function (done) {
    const req = new Request()
    req.method('HEAD', `http://localhost:${PORT}/err-max-redirect`).end((err, res) => {
      assert.equal(err.code, 'ERR_MAX_REDIRECTS')
      assert.equal(err.message, 'max redirects reached')
      assert.deepEqual(res._redirectList, [])
      done()
    })
  })

  it('should handle no location error', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/err-no-location-header`).end((err, res) => {
      assert.equal(err.code, 'ERR_NO_LOCATION')
      assert.equal(err.message, 'no location header for redirect')
      assert.deepEqual(res._redirectList, [])
      done()
    })
  })
})
