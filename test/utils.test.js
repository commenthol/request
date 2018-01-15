const assert = require('assert')
const {encodeCookies, decodeCookies} = require('./support/utils')

describe('test utils', function () {
  let q

  it('should encode cookies', () => {
    const cookies = [
      {name: 'test', value: 'string', expires: 1000},
      {name: 'test', value: 'next', path:'/test', secure: 1},
      {domain: '.example.com'},
    ]
    q = encodeCookies(cookies)
    assert.deepEqual(q, [
      'test;string;;1000;;;',
      'test;next;/test;;;;1',
      ';;;;.example.com;;'
    ])
  })

  it('should decode cookies', () => {
    const res = decodeCookies(q)
    assert.deepEqual(res, [
      'test=string; Expires=Thu, 01 Jan 1970 00:00:01 GMT',
      'test=next; Path=/test; Secure',
      'name=value; Domain=.example.com'
    ])
  })
})
