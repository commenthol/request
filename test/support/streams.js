const {Readable, Writable} = require('stream')

class ReadStream extends Readable {
  constructor (opts) {
    super(opts)
    this.buffer = Buffer.from('')
  }

  write (buf) {
    this.buffer = Buffer.concat([this.buffer, Buffer.from(buf)])
  }

  _read (size) {
    const buffer = this.buffer.slice(0, size)
    this.buffer = this.buffer.slice(size)
    this.push(buffer)
    if (!this.buffer.length) {
      this.push(null)
    }
  }
}

class WriteStream extends Writable {
  constructor (cb, opts) {
    super(opts)
    this.cb = cb
    this.buffer = Buffer.from('')
  }

  _write (chunk, encoding) {
    this.encoding = encoding
    this.buffer = Buffer.concat([this.buffer, chunk])
  }

  end () {
    this.cb(this.buffer)
  }
}

module.exports = {ReadStream, WriteStream}
