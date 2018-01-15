const fs = require('fs')
const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')

const ca = fs.readFileSync(`${__dirname}/fixtures/root_ca.crt`)

const PORT = 3000

describe('https', function () {
  let server

  before((done) => {
    server = setup({type: 'https'}).listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should fail with self-signed-cert', function (done) {
    const req = new Request()
    req.get(`https://localhost:${PORT}/mirror`)
      .end((err, res) => {
        assert.equal(err.code, 'UNABLE_TO_VERIFY_LEAF_SIGNATURE')
        assert.equal(err.message, 'unable to verify the first certificate')
        assert.equal(res, undefined)
        done()
      })
  })

  it('should not reject self-signed-cert', function (done) {
    const req = new Request()
    req.get(`https://localhost:${PORT}/mirror`)
      .rejectUnauthorized(false)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.headers['content-encoding'], 'gzip')
        assert.equal(res.data.toString(), '{"url":"/mirror","method":"GET","headers":{"accept-encoding":"gzip, deflate","host":"localhost:3000","connection":"close"}}\n')
        done()
      })
  })

  it('should request data with ca cert', function (done) {
    const req = new Request()
    req.get(`https://localhost:${PORT}/mirror`)
      .ca(ca)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.headers['content-encoding'], 'gzip')
        assert.equal(res.data.toString(), '{"url":"/mirror","method":"GET","headers":{"accept-encoding":"gzip, deflate","host":"localhost:3000","connection":"close"}}\n')
        done()
      })
  })
})
