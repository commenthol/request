const {Writable} = require('stream')
const {factory} = require('./parsers')

module.exports = Sink

function Sink (parser, callback) {
  Writable.call(this)

  // require('./_events')('Sink', this) // DEBUG
  Object.assign(this, {
    callback,
    parser,
    data: [],
    _ended: 0
  })
  this.on('response', (res) => {
    this.res = res
  })
  this.on('error', (err) => {
    this.end(err)
  })
}
Sink.prototype = Object.create(Writable.prototype)
Object.assign(Sink.prototype, {
  _write (chunk, enc, cb) {
    this.data.push(chunk)
    cb()
  },

  end (err) {
    if (this._ended++) return // call end only once
    const res = this.res
    if (res) res.data = Buffer.concat(this.data)
    factory(this.parser, res, (_err) => {
      err = err || _err || null
      if (res && err) {
        err.status = res.statusCode
        err.response = res
      }
      this.callback(err, res)
    })
  }
})
