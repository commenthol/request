const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')
const {PORT, URI} = require('./config')

describe('redirects', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should limit redirects', function (done) {
    const req = new Request()
    req.method('GET', `http://${URI}/redirect4/301`)
      .redirects(0)
      .end((err, res) => {
        assert.ok(err)
        assert.deepEqual(res._redirectList, [])
        assert.strictEqual(res.statusCode, 301)
        assert.equal(res.headers.location, '/redirect3/301')
        done()
      })
  })


  it('should handle 301 redirects', function (done) {
    const req = new Request()
    req.method('GET', `http://${URI}/redirect4/301`)
      .end((err, res) => {
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
    req.method('POST', `http://${URI}/redirect4/302`)
      .send('test')
      .end((err, res) => {
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
    req.method('POST', `http://${URI}/redirect1/303`).send('test').end((err, res) => {
      assert.ok(!err, err && err.message)
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/redirect0/303'
      ])
      done()
    })
  })

  it('should handle max redirects error', function (done) {
    const req = new Request()
    req.method('GET', `http://${URI}/errors/max-redirects`).end((err, res) => {
      assert.equal(err.code, 'ERR_MAX_REDIRECTS')
      assert.equal(err.message, 'max redirects reached')
      assert.deepEqual(res._redirectList, [
        'http://localhost:3000/errors/max-redirects',
        'http://localhost:3000/errors/max-redirects',
        'http://localhost:3000/errors/max-redirects',
        'http://localhost:3000/errors/max-redirects',
        'http://localhost:3000/errors/max-redirects'
      ])
      done()
    })
  })

  it('should handle max redirects error for HEAD', function (done) {
    const req = new Request()
    req.method('HEAD', `http://${URI}/errors/max-redirects`).end((err, res) => {
      assert.equal(err.code, 'ERR_MAX_REDIRECTS')
      assert.equal(err.message, 'max redirects reached')
      assert.deepEqual(res._redirectList, [])
      done()
    })
  })

  it('should handle no location error', function (done) {
    const req = new Request()
    req.method('GET', `http://${URI}/errors/no-location-header`).end((err, res) => {
      assert.equal(err.code, 'ERR_NO_LOCATION')
      assert.equal(err.message, 'no location header for redirect')
      assert.deepEqual(res._redirectList, [])
      done()
    })
  })
})
