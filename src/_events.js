const debug = require('debug')('test:event')

module.exports = events

function events (name, _this) {
  function on (ev, arg) {
    debug('%s\t%s\t%s', name, ev, arg)
  }
  _this.on('response', on.bind(_this, 'response'))
  _this.on('close', on.bind(_this, 'close'))
  _this.on('drain', on.bind(_this, 'drain'))
  _this.on('data', on.bind(_this, 'data'))
  _this.on('error', on.bind(_this, 'error'))
  _this.on('finish', on.bind(_this, 'finish'))
  _this.on('socket', on.bind(_this, 'socket')) // no-one emits this event
  _this.on('pipe', on.bind(_this, 'pipe'))
  _this.on('unpipe', on.bind(_this, 'unpipe'))
  _this.on('end', on.bind(_this, 'end'))
}
