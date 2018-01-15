const assert = require('assert')
const fs = require('fs')
const Request = require('../src/request')
const setup = require('./support/server')
const {ReadStream, WriteStream} = require('./support/streams')
const {PORT, URI} = require('./config')

describe('stream', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should stream response', function (done) {
    const req = new Request()
    req.get(`http://${URI}/echo`)
    let data = ''
    req.on('data', (chunk) => {
      data += chunk.toString()
    })
    req.on('end', () => {
      assert.equal(data, '{"url":"/echo","method":"GET","headers":{"accept-encoding":"gzip, deflate","host":"localhost:3000","connection":"close"}}')
      done()
    })
    req.end()
  })

  it('should stream data', function (done) {
    const req = new Request()
    req.post(`http://${URI}/echo/201`)
    const reader = new ReadStream()

    let status
    const final = (buffer) => {
      assert.equal(status, 201)
      assert.equal(buffer.toString(), '{"url":"/echo/201","method":"POST","headers":{"accept-encoding":"gzip, deflate","host":"localhost:3000","connection":"close","transfer-encoding":"chunked"},"body":"123456789"}')
      done()
    }

    const writer = new WriteStream(final)
    writer.on('response', (res) => {
      status = res.status
    })

    reader.pipe(req)
      .on('error', (err) => writer.emit('error', err))
      .on('response', (res) => writer.emit('response', res))
      .pipe(writer)
    reader.write('123456789')
  })

  it('should stream data to file', function (done) {
    const req = new Request()
    req.post(`http://${URI}/echo/201`)
    const reader = new ReadStream()
    const writer = fs.createWriteStream(`${__dirname}/fixtures/out.txt`)

    const final = () => {
      assert.equal(status, 201)
      done()
    }

    let status
    writer.on('response', (res) => {
      status = res.status
    })

    reader.write('123456789')
    reader.pipe(req) // NOTE: errors are not handled!
      .on('response', (res) => writer.emit('response', res))
      .pipe(writer)
      .on('close', final)
  })
})
