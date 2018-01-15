const assert = require('assert')
const {series} = require('asyncc')
const Request = require('../src/request')
const setup = require('./support/server')
const qs = require('querystring')

const PORT = 3000

describe('cookie', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should set path cookie', function (done) {
    const req = new Request()
    series([
      (done) => {
        const query = { name: 'test', value: 'string' }
        req.method('GET', `http://localhost:${PORT}/set-cookie?${qs.stringify(query)}`)
          .end((err, res) => {
            assert.ok(!err, err && err.message)
            assert.ok(res.headers['set-cookie'])
            assert.deepEqual(res.headers['set-cookie'], ['test=string'])
            assert.equal(req._cookieJar.get(), 'test=string')
            done()
          })
      },
      (done) => {
        req.method('GET', `http://localhost:${PORT}/mirror}`)
          .end((err, res) => {
            assert.ok(!err, err && err.message)
            assert.ok(res.body.headers.cookie, 'test=string')
            done()
          })
      },
      (done) => {
        const query = { name: 'test', value: 'newString' }
        req.method('GET', `http://localhost:${PORT}/set-cookie?${qs.stringify(query)}`)
          .end((err, res) => {
            assert.ok(!err, err && err.message)
            assert.ok(res.headers['set-cookie'])
            assert.deepEqual(res.headers['set-cookie'], ['test=newString'])
            assert.equal(req._cookieJar.get(), 'test=newString')
            done()
          })
      },
      (done) => {
        req.method('GET', `http://localhost:${PORT}/mirror}`)
          .end((err, res) => {
            assert.ok(!err, err && err.message)
            assert.ok(res.body.headers.cookie, 'test=newString')
            done()
          })
      }
    ], done)
  })
})
