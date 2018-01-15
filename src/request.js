const Stream = require('stream')
const http = require('http')
const https = require('https')
// const http2 = require('https2')
const qs = require('querystring')
const zlib = require('zlib')
const mime = require('mime')
const {parse, format, resolve} = require('url')
const Sink = require('./sink')
const {HTTPS, headerCase} = require('./utils')
const CookieJar = require('./cookiejar')

mime.define({ 'application/x-www-form-urlencoded': ['form'] })

module.exports = Request

/**
* @param {Object} options
* @param {Number=5} [options.maxRedirects] -
* @param {Number=200000000} [options.maxResponseSize] -
* @param {CookieJar} [options.cookieJar]
* @see https://nodejs.org/api/http.html#http_http_request_options_callback
* @see https://nodejs.org/api/https.html#https_https_request_options_callback
*/
function Request (options) {
  if (!(this instanceof Request)) {
    return new Request(options)
  }
  Stream.call(this)

  // require('./_events')('Request', this) // DEBUG

  this.opts = Object.assign({}, options)
  this._cookieJar = this.opts.cookieJar || new CookieJar()
  delete this.opts.cookieJar

  this.opts.redirects = this.opts.redirects || 5 // number of max redirects
  this._maxResponseSize = this.opts.maxResponseSize || 200000000 // max. allowed buffer size
  // this.req {http.ClientRequest} the request
  // this.res {http.IncomingMessage} the response
  // this._method {String} the method to use
  // this._contentType {String} content type of request
  // this._redirectList {Array<String>} list of redirects
  // this._bufferSize {Number} internal counter to check `this._maxResponseSize`
  // this._parser {Function} desired parser

  this._normHeaders()
}

Request.prototype = Object.create(Stream.prototype)

Object.assign(Request.prototype, {
  request () {
    return this.req
  },

  response () {
    return this.res
  },

  _request () {
    if (!this.req ||  this.req.finished) {
      const opts = this.opts
      this.redirects(opts.method === 'HEAD' ? 0 : opts.redirects)
      const transport = opts.protocol === HTTPS ? https : http
      this._getCookies()
      this.req = transport.request(opts)
      delete opts.headers.Cookie // reset for next req
      this.req.setNoDelay(true)
      this.req.once('response', this._response.bind(this))
      this.req.once('timeout', () => {
        this.destroy(newError('socket timed out', 'ETIMEDOUT'))
      })
      this.req.once('drain', this.emit.bind(this, 'drain'))
      this.req.on('error', this.emit.bind(this, 'error'))
      this.emit('request', this.req)
      this._bufferSize = 0
    }
    return this.req
  },

  _normHeaders () {
    const headers = this.opts.headers
    this.opts.headers = {}
    this.set(headers)
  },

  _getCookies () {
    const opts = this.opts
    const cookies = opts.headers.Cookie // {Array|String}
    if (cookies) {
      this._setCookies(cookies, opts) // inital set of cookies in jar
    }
    const _cookies = this._cookieJar.get(opts)
    if (_cookies) this.set('Cookie', _cookies)
  },

  _setCookies (setCookieHeader, opts) {
    this._cookieJar.save(setCookieHeader, opts)
  },

  method (method, url) {
    delete this.req // make sure we get a new request
    const opts = this.opts
    this._method = method = method.toUpperCase()
    const parsed = url ? parse(url) : {}
    parsed.method = method
    Object.assign(opts, parsed, {method})
    if (this._method !== 'HEAD') {
      this.set('Accept-Encoding', 'gzip, deflate')
    }
    return this
  },

  type (type) {
    this._contentType = mime.getType(type) || type
    return this.set('Content-Type', this._contentType)
  },

  accept (type) {
    // Append Accept header
    const _type = [this.opts.headers['Accept'], mime.getType(type) || type]
      .filter(i => i).join(',')
    return this.set('Accept', _type)
  },

  set (header = {}, value) {
    if (typeof header !== 'object') {
      header = {[String(header)]: value}
    }
    Object.keys(header).forEach((k) => {
      this.opts.headers[headerCase(k)] = String(header[k])
    })
    return this
  },

  send (body) {
    let _body
    if (typeof body === 'object') { // auto set content-type
      if (!this._contentType || /json/.test(this._contentType)) {
        _body = JSON.stringify(body)
        if (!this._contentType) this.type('json')
      } else {
        _body = qs.stringify(body)
      }
    } else {
      _body = String(body)
      if (!this._contentType) this.type('form')
    }
    if (!~['GET', 'HEAD', undefined].indexOf(this.opts.method)) {
      this._request().write(_body)
    }
    return this
  },

  query (query, value) {
    const opts = this.opts
    const _query = qs.parse(opts.query)
    if (typeof query === 'string') {
      query = {[String(query)]: value}
    }
    Object.keys(query).forEach((key) => {
      const value = query[key]
      if (!_query[key]) {
        _query[key] = value
      } else if (!Array.isArray(_query[key])) {
        _query[key] = [_query[key], value]
      } else {
        _query[key].push(value)
      }
    })
    opts.query = qs.stringify(_query)
    opts.search = '?' + opts.query
    opts.path = opts.pathname + opts.search
    opts.href = format(opts)
    return this
  },

  _redirect (res) {
    let err
    let {location} = res.headers
    const url = format(this.opts)

    if (!location) {
      err = newError('no location header for redirect', 'ERR_NO_LOCATION')
    } else if (this._redirectList.length === this.opts.redirects) {
      err = newError('max redirects reached', 'ERR_MAX_REDIRECTS')
    }
    if (err) {
      this.emit('response', res)
      this.destroy(err)
      return
    }

    location = resolve(url, location)
    this._redirectList.push(location)

    switch (res.statusCode) {
      case 301:
      case 302:
        this._method = this._method === 'HEAD' ? 'HEAD' : 'GET'
        break
      case 303:
        this._method = 'GET'
        break
    }

    this.method(this._method, location)
    this._request().end()
  },

  _response (res) {
    this.res = res
    res.status = res.statusCode
    res._redirectList = this._redirectList

    // require('./_events')('Response', this) // DEBUG

    this._setCookies(res.headers['set-cookie'], this.opts)

    if (isRedirect(res)) {
      this._redirect(res)
      return
    }

    // emit to both ourself and the resulting stream
    this.emit('response', res)

    const emitEvents = (_this, stream, onError) => {
      onError = onError || _this.emit.bind(_this, 'error')
      stream.on('close', _this.emit.bind(_this, 'close'))
      stream.on('end', _this.emit.bind(_this, 'end'))
      stream.on('error', onError)
      stream.on('data', (chunk, encoding) => {
        this._bufferSize += chunk.length
        // protect agains zip-bombs, etc...
        if (this._bufferSize < this._maxResponseSize) {
          this.emit('data', chunk, encoding)
        } else {
          this.destroy(newError('max response size reached', 'ERR_MAX_RESPONSE_SIZE'))
          stream.socket.destroy() // the only option to kill the data in the pipe - data is already received to req.abort() wont serve at all
        }
      })
    }

    if (isCompressed(res)) {
      const unzip = zlib.createUnzip()
      const onError = (err) => {
        if (err && err.code === 'Z_BUF_ERROR') {
          this.destroy() // end request
          this.emit('end')
          return
        }
        this.emit('error', err)
      }
      emitEvents(this, unzip, onError)
      res.pipe(unzip)
    } else {
      emitEvents(this, res)
    }
  },

  destroy (err) {
    this.req.abort()
    if (err) {
      this.emit('error', err)
    }
  },

  write (data, encoding) {
    this._request().write(data, encoding)
  },

  parser (fn) {
    this._parser = fn // parsers are handled by Sink
    return this
  },

  end (cb) {
    if (cb) {
      const sink = new Sink(this._parser, cb)
      this
        .on('error', (err) => sink.emit('error', err))
        .on('response', (res) => sink.emit('response', res))
        .pipe(sink)
    }
    this._redirectList = []
    this._request().end()
  },

  then (resolve, reject) {
    return new Promise((_resolve, _reject) => { // eslint-disable-line promise/param-names
      this.end((err, res) => {
        if (err) {
          _reject(err)
        } else {
          _resolve(res)
        }
      })
    }).then(resolve, reject)
  },

  catch (reject) {
    return this.then(undefined, reject)
  }
})

// set option helpers
;[
  'agent', // {http.Agent|https.Agent}
  'timeout', // {Number} timeout in ms
  'redirects', // {Number} max redirects (default=5)
  // https only - @see https://nodejs.org/api/https.html#https_https_request_options_callback
  'ca', 'cert', 'key', 'passphrase', 'pfx', // {String} TLS options
  'rejectUnauthorized', // {Boolean} (default=false)
  'secureProtocol', 'servername'
].forEach((m) => {
  _hasPrototype(m)
  Request.prototype[m] = function (opt) {
    this.opts[m] = opt
    return this
  }
})

// set http methods
http.METHODS.forEach((method) => {
  const m = method.toLowerCase()
  _hasPrototype(m)
  Request.prototype[m] = function (url) {
    return this.method(method, url)
  }
})

function _hasPrototype (m) {
  if (Request.prototype[m]) throw new Error(`Request.prototype[${m}] exists`) // safety belt
}

function isCompressed (res) {
  if (res.statusCode === 204 ||
    res.statusCode === 304 ||
    res.headers['content-length'] == 0 // eslint-disable-line eqeqeq
  ) {
    return false
  }
  const m = /^\s*(deflate|gzip)\s*$/.exec(res.headers['content-encoding'])
  if (m) return m[1]
}

function isRedirect (res) {
  return [301, 302, 303, 305, 307, 308].includes(res.statusCode)
}

function newError (message, code) {
  const err = new Error(message)
  err.code = code
  return err
}
