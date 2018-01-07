const HTTP = 'http:'
const HTTPS = 'https:'

function headerCase (header) {
  let minus = false
  const str = header.split('').map((c, idx) => {
    if (idx === 0 || minus) {
      minus = false
      return c.toUpperCase()
    } else if (c === '-') {
      minus = true
    }
    return c.toLowerCase()
  }).join('')
  return str
}

function isBinary (mime = '') {
  const type = mime.split('/')[0]
  return /^(image|video)$/.test(type)
}

function isText (mime = '') {
  const type = mime.split('/')[0]
  return type === 'text'
}

function isUrlEncoded (mime = '') {
  const subType = mime.split('/')[1]
  return subType === 'x-www-form-urlencoded'
}

function isJson (mime) {
  return /[/+]json($|[^-\w])/.test(mime)
}

module.exports = {
  HTTP,
  HTTPS,
  isJson,
  isBinary,
  isText,
  isUrlEncoded,
  headerCase
}
