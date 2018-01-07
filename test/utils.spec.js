const assert = require('assert')
const utils = require('../src/utils')

describe('utils', function () {
  describe('headerCase', function () {
    it('should convert to accept', function () {
      assert.equal(utils.headerCase('accept'), 'Accept')
    })
    it('should convert to x-custom-version', function () {
      assert.equal(utils.headerCase('x-custom-version'), 'X-Custom-Version')
    })
  })
})
