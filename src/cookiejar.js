const {CookieJar: Jar, CookieAccessInfo} = require('cookiejar')

module.exports = CookieJar

function CookieJar () {
  this.jar = new Jar()
}

CookieJar.prototype = {
  get (opts) {
    const hostname = opts && opts.headers && opts.headers.Host // support VHosts
    const access = !opts
      ? CookieAccessInfo.All
      : CookieAccessInfo(
        hostname || opts.hostname,
        opts.pathname,
        opts.protocol === 'https:'
      )
    const cookies = this.jar.getCookies(access).toValueString()
    return cookies
  },

  save (setCookie, opts) { // setCookie = res.headers['set-cookie']
    let hostname
    if (opts) {
      hostname = opts.hostname
    }
    if (setCookie) {
      const res = this.jar.setCookies(setCookie, hostname)
      return res
    }
  }
}
