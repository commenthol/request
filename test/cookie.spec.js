const assert = require('assert')
const {eachSeries} = require('asyncc')
const Request = require('../src/request')
const setup = require('./support/server')
const {encodeCookies} = require('./support/utils')
const {PORT, URI} = require('./config')

describe('cookie', function () {
  let server
  const req = new Request()

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should set cookies', function (done) {
    eachSeries([
      {name: 'test', value: 1},
      {name: 'testPath', value: 3, path: '/echo/path'},
      {name: 'testDomain', value: 5, path: '/echo', domain: '.test.test'},
      {name: 'foo', value: 'bar', expires: 10000}
    ], (cookie, done) => {
      const enc = encodeCookies([cookie])[0]
      req.get(`http://${URI}/end`)
        .query('cookie', enc)
        .end((err, res) => {
          assert.ok(!err, err && err.message)
          assert.ok(res.headers['set-cookie'])
          done()
        })
    }, done)
  })

  it('should send cookie', function (done) {
    req.get(`http://${URI}/echo`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body.headers.cookie, 'test=1')
        done()
      })
  })

  it('should send path cookie', function (done) {
    req.get(`http://${URI}/echo/path`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body.headers.cookie, 'test=1;testPath=3')
        done()
      })
  })

  it('should send domain cookie', function (done) {
    req.get(`http://${URI}/echo`)
      .set('host', 'www.test.test')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body.headers.cookie, 'testDomain=5')
        done()
      })
  })

  it('should not share cookie with other Request', function (done) {
    const req = new Request()
    req.get(`http://${URI}/echo`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body.headers.cookie, undefined)
        done()
      })
  })

  it('should set cookie via header', function (done) {
    const req = new Request()
    req.get(`http://${URI}/echo`)
      .set('cookie', 'set=cookie')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body.headers.cookie, 'set=cookie')
        done()
      })
  })
})
