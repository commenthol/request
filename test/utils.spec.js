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

  describe('.isBinary', function () {
    it('should not detect binary for ""', function () {
      assert.equal(utils.isBinary(), false)
    })

    it('should not detect binary for "text/html"', function () {
      assert.equal(utils.isBinary('text/html'), false)
    })

    it('should detect binary for "image/gif"', function () {
      assert.equal(utils.isBinary('image/gif'), true)
    })

    it('should detect binary for "video/mp4"', function () {
      assert.equal(utils.isBinary('video/mp4'), true)
    })
  })

  describe('.isText', function () {
    it('should not detect text for ""', function () {
      assert.equal(utils.isText(), false)
    })

    it('should detect text for "text/html"', function () {
      assert.equal(utils.isText('text/html'), true)
    })

    it('should detect text for "text/html; charset=utf-8"', function () {
      assert.equal(utils.isText('text/html; charset=utf-8'), true)
    })

    it('should not detect text for "image/gif"', function () {
      assert.equal(utils.isText('image/gif'), false)
    })
  })

  describe('.isUrlEncoded', function () {
    it('should not detect for ""', function () {
      assert.equal(utils.isUrlEncoded(), false)
    })

    it('should detect for "text/x-www-form-urlencoded"', function () {
      assert.equal(utils.isUrlEncoded('text/x-www-form-urlencoded'), true)
    })

    it('should detect for "application/x-www-form-urlencoded"', function () {
      assert.equal(utils.isUrlEncoded('application/x-www-form-urlencoded'), true)
    })

    it('should detect for "application/x-www-form-urlencoded; charset=utf-8"', function () {
      assert.equal(utils.isUrlEncoded('application/x-www-form-urlencoded; charset=utf-8'), true)
    })

    it('should not detect for "image/gif"', function () {
      assert.equal(utils.isUrlEncoded('image/gif'), false)
    })
  })
})
