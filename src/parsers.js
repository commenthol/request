const qs = require('querystring')
const {isText, isJson, isUrlEncoded} = require('./utils')

function mime (res) {
  return res.headers['content-type'] || ''
}

function text (res) {
  if (isText(mime(res))) {
    return function (cb) {
      res.text = res.data.toString('utf8')
      cb()
    }
  }
}

function json (res) {
  if (isJson(mime(res))) {
    return function (cb) {
      let err
      res.text = res.data.toString('utf8')
      try {
        if (res.text) res.body = JSON.parse(res.text)
      } catch (e) {
        err = e
      }
      cb(err)
    }
  }
}

function urlEncoded (res) {
  if (isUrlEncoded(mime(res))) {
    return function (cb) {
      let err
      res.text = res.data.toString('ascii')
      try {
        res.body = qs.parse(res.text)
      } catch (e) {
        err = e
      }
      cb(err)
    }
  }
}

function binary (res) {
  return function (cb) {
    if (res.data && res.data.length) {
      res.body = res.data
    }
    cb()
  }
}

function factory (parser, res, cb) {
  if (!res) {
    cb()
    return
  }
  const fn =
    (parser && parser(res)) ||
    json(res) ||
    urlEncoded(res) ||
    text(res) ||
    binary(res)
  fn(cb)
}

module.exports = {
  binary,
  json,
  text,
  urlEncoded,
  factory
}
