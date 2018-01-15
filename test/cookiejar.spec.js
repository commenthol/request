const assert = require('assert')
const CookieJar = require('../src/cookiejar')

describe('CookieJar', function () {
  it('should save cookie "test"', function () {
    const jar = new CookieJar()
    jar.save(['test=1'])
    const res = jar.get()
    assert.equal(res, 'test=1')
  })

  it('should overwrite cookie "test"', function () {
    const jar = new CookieJar()
    jar.save(['test=1'])
    jar.save(['test=2'])
    const res = jar.get()
    assert.equal(res, 'test=2')
  })

  it('should save cookie "test" for domain ".example.com"', function () {
    const jar = new CookieJar()
    jar.save(['test=1; Domain=.example.com'], {hostname: 'anydomain.com'}) // 3rd Party Cookie
    const res = jar.get({hostname: 'www.example.com'})
    assert.equal(res, 'test=1')
  })

  it('should save cookie "test" for domain ".example.com" and path "/path"', function () {
    const jar = new CookieJar()
    jar.save(['test=1; Domain=.example.com; Path=/path'], {hostname: 'auth.example.com', pathname: '/auth'})
    const res = jar.get({hostname: 'www.example.com'})
    assert.equal(res, '')
    const res1 = jar.get({hostname: 'www.example.com', pathname: '/path/test'})
    assert.equal(res1, 'test=1')
  })
})
