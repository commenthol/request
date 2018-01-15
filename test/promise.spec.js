const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')

const PORT = 3000

describe('promise', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should request', function () {
    const req = new Request()
    return req.method('GET', `http://localhost:${PORT}/mirror`)
      .then((res) => {
        assert.equal(res.headers['content-encoding'], 'gzip')
        assert.deepEqual(res.body, {
          url: '/mirror',
          method: 'GET',
          headers: {
            'accept-encoding': 'gzip, deflate',
            host: 'localhost:3000',
            connection: 'close'
          }
        })
      })
      .catch((err) => {
        assert.ok(!err) // should never reach here
      })
  })

  it('should post', function () {
    const req = new Request()
    return req.post(`http://localhost:${PORT}/mirror`)
      .send({test: 2, foo: ['bar', 'baz']})
      .then((res) => {
        assert.deepEqual(res.body, {
          url: '/mirror',
          method: 'POST',
          headers: {
            'accept-encoding': 'gzip, deflate',
            'content-type': 'application/json',
            host: 'localhost:3000',
            connection: 'close',
            'transfer-encoding': 'chunked'
          },
          body: '{"test":2,"foo":["bar","baz"]}'
        })
      })
  })

  it('should catch', function () {
    const req = new Request()
    return req.method('GET', `http://localhost:${PORT}/err-destroy`)
      .catch((err) => {
        assert.ok(err)
        assert.equal(err.message, 'socket hang up')
      })
  })
})
