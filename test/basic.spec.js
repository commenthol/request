const assert = require('assert')
const Request = require('../src/request')
const setup = require('./support/server')

const PORT = 3000

describe('basic', function () {
  let server

  before((done) => {
    server = setup().listen(PORT, done)
  })

  after((done) => {
    server.close(done)
  })

  it('should request uncompressed data', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/mirror`)
      .set('Accept-Encoding', '')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.text, '{"url":"/mirror","method":"GET","headers":{"accept-encoding":"","host":"localhost:3000","connection":"close"}}\n')
        assert.deepEqual(res.body, {
          url: '/mirror',
          method: 'GET',
          headers: {
            'accept-encoding': '',
            host: 'localhost:3000',
            connection: 'close'
          }
        })
        done()
      })
  })

  it('should request compressed data per default', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/mirror`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
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
        done()
      })
  })

  it('should add query string to url', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/mirror?test=1`)
      .query('test', 2)
      .query('test', 3)
      .query({foo: 'bar', '42': 'ŀ¡ƒē'})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          url: '/mirror?42=%C5%80%C2%A1%C6%92%C4%93&test=1&test=2&test=3&foo=bar',
          method: 'GET',
          headers: {
            'accept-encoding': 'gzip, deflate',
            host: 'localhost:3000',
            connection: 'close'
          }
        })
        done()
      })
  })

  it('should set headers', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/mirror`)
      .set({'user-agent': 'test/1.0.0', 'accept': '*/*'})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'GET',
          'headers': {
            'accept-encoding': 'gzip, deflate',
            'user-agent': 'test/1.0.0',
            'accept': '*/*',
            'host': 'localhost:3000',
            'connection': 'close'
          }
        })
        done()
      })
  })

  it('should prevent sending doubled headers', function (done) {
    const req = new Request({headers: {'user-AgenT': 'lowercase/1'}})
    req
      .method('GET', `http://localhost:${PORT}/mirror`)
      .set({'useR-Agent': 'Cased/2', 'accept': '*/*'})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'GET',
          'headers': {
            'user-agent': 'Cased/2',
            'accept-encoding': 'gzip, deflate',
            'accept': '*/*',
            'host': 'localhost:3000',
            'connection': 'close'
          }
        })
        done()
      })
  })

  it('should set multiple accept headers', function (done) {
    const req = new Request()
    req.method('GET', `http://localhost:${PORT}/mirror`)
      .accept('html')
      .accept('xhtml')
      .accept('xml')
      .accept('*/*;q=0.8')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'GET',
          'headers': {
            'accept-encoding': 'gzip, deflate',
            'accept': 'text/html,application/xhtml+xml,application/xml,*/*;q=0.8',
            'host': 'localhost:3000',
            'connection': 'close'
          }
        })
        done()
      })
  })

  it('should not send data with HEAD', function (done) {
    const req = new Request()
    req.head(`http://localhost:${PORT}/mirror`)
      .send('do not send')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body, undefined)
        done()
      })
  })

  it('should post json with auto type', function (done) {
    const req = new Request()
    req.post(`http://localhost:${PORT}/mirror`)
      .send({test: 2, foo: ['bar', 'baz']})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
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
        done()
      })
  })

  it('should put json', function (done) {
    const req = new Request()
    req.put(`http://localhost:${PORT}/mirror`)
      .type('json')
      .send({test: 2, foo: ['bar', 'baz']})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'PUT',
          'headers': {
            'accept-encoding': 'gzip, deflate',
            'content-type': 'application/json',
            'host': 'localhost:3000',
            'connection': 'close',
            'transfer-encoding': 'chunked'
          },
          body: '{"test":2,"foo":["bar","baz"]}'
        })
        done()
      })
  })

  it('should post form data serialized', function (done) {
    const req = new Request()
    req.post(`http://localhost:${PORT}/mirror`)
      .type('form')
      .send({test: 2, foo: ['bar', 'bäz']})
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'POST',
          'headers': {
            'accept-encoding': 'gzip, deflate',
            'content-type': 'application/x-www-form-urlencoded',
            'host': 'localhost:3000',
            'connection': 'close',
            'transfer-encoding': 'chunked'
          },
          'body': 'test=2&foo=bar&foo=b%C3%A4z'
        })
        done()
      })
  })

  it('should post form data', function (done) {
    const req = new Request()
    req.post(`http://localhost:${PORT}/mirror`)
      .send('test=2&foo=bar&foo=bäz')
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.deepEqual(res.body, {
          'url': '/mirror',
          'method': 'POST',
          'headers': {
            'accept-encoding': 'gzip, deflate',
            'content-type': 'application/x-www-form-urlencoded',
            'host': 'localhost:3000',
            'connection': 'close',
            'transfer-encoding': 'chunked'
          },
          'body': 'test=2&foo=bar&foo=bäz'
        })
        done()
      })
  })

  it('should not decompress on 204', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/mirror/204`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body, undefined)
        done()
      })
  })

  it('should not decompress on 304', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/mirror/304`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.body, undefined)
        done()
      })
  })

  it('should not decompress on content-length 0', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/content-length/0`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.data.toString(), '')
        assert.equal(res.headers['content-length'], '0')
        done()
      })
  })

  it('should continue on zip buffer error', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/err-zip-length`)
      .end((err, res) => {
        assert.ok(!err, err && err.message)
        assert.equal(res.data.length, 1007492)
        done()
      })
  })

  it('should end on zip error', function (done) {
    const req = new Request()
    req.get(`http://localhost:${PORT}/err-zip-encoding`)
      .end((err, res) => {
        assert.equal(err.message, 'incorrect header check')
        assert.equal(err.code, 'Z_DATA_ERROR')
        assert.equal(res.data.toString(), '')
        done()
      })
  })
})
