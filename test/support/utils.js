module.exports = {
  encodeCookies,
  decodeCookies
}

const VALS = 'name,value,path,expires,domain,httpOnly,secure'.split(',')

function encodeCookies (cookies = []) {
  return cookies.map((c) => VALS.map((v) => c[v]).join(';'))
}

function decodeCookies (cookies = []) {
  return cookies.map((c) => {
    const a = c.split(';')
    return VALS.reduce((o, v, i) => {
      if (a[i]) o[v] = a[i]
      return o
    }, {})
  }).map((o) => {
    const cookie = [`${o.name || 'name'}=${o.value || 'value'}`]
    if (o.expires) cookie.push('Expires=' + new Date(+o.expires).toUTCString())
    if (o.path) cookie.push(`Path=${o.path}`)
    if (o.domain) cookie.push(`Domain=${o.domain}`)
    if (o.httpOnly) cookie.push('HttpOnly')
    if (o.secure) cookie.push('Secure')
    return cookie.join('; ')
  })
}
