/* eslint no-console:0 */

const http = require('http')
const {times, series} = require('asyncc')
const superagent = require('superagent')
const Request = require('..')

const PORT = 3000
const url = `http://localhost:${PORT}`

const server = http.createServer((req, res) => {
  res.end()
})

class Time {
  constructor (name) {
    Object.assign(this, {
      name,
      count: 0,
      sum: 0,
      last: Date.now()
    })
  }

  start () {
    this.last = Date.now()
  }

  lap () {
    const now = Date.now()
    const diff = now - this.last
    this.count++
    this.sum += diff
    console.log('%s\tΔ %s\t⟨ %s ⟩', this.name, diff, this.mean)
  }

  get mean () {
    return +((this.sum / this.count).toFixed(2))
  }
}

const time1 = new Time('superag')

const test1 = (num, cb) => {
  const agent = superagent.agent()
  time1.start()
  times(num, (cb) => {
    agent.get(url).end(cb)
  }, (err) => {
    time1.lap()
    cb(err)
  })
}

const time2 = new Time('request')

const test2 = (num, cb) => {
  time2.start()
  const agent = new http.Agent({keepAlive: true})
  times(num, (cb) => {
    Request({agent}).get(url).end(cb)
  }, (err) => {
    time2.lap()
    cb(err)
  })
}

const NUM = 2000
let run
series([
  (cb) => { run = server.listen(PORT, cb) },
  test1.bind(test1, NUM),
  test2.bind(test2, NUM),
  test2.bind(test2, NUM),
  test1.bind(test1, NUM),
  test1.bind(test1, NUM),
  test2.bind(test2, NUM),
  test2.bind(test2, NUM),
  test1.bind(test1, NUM),
  test1.bind(test1, NUM),
  test2.bind(test2, NUM),
  (cb) => { run.close(cb) }
], (err) => {
  console.log('done %s', err)
})
