'use strict';

var assert = require('assert')
var express = require('express')
var request = require('supertest')
var session = require('../')
var idGenerator = require('../src/utils/idGenerator')

describe('idGenerator', function () {
  describe('generateId', function () {
    it('should generate unique ids with the expected format', function () {
      var ids = Array.from({ length: 100 }, function () {
        return idGenerator.generateId()
      })

      expect(new Set(ids).size).toBe(ids.length)
      ids.forEach(function (value) {
        expect(value).toMatch(/^[a-z0-9]+-[a-f0-9]{24}$/)
      })
    })
  })

  describe('createCustomGenerator', function () {
    it('should support prefix + timestamp + random string rules', function () {
      var generator = idGenerator.createCustomGenerator({
        prefix: 'sess_',
        timestampProvider: function () {
          return '1710000000000'
        },
        randomProvider: function () {
          return 'abc123xy'
        }
      })

      expect(generator()).toBe('sess_1710000000000abc123xy')
    })

    it('should create a usable generator for empty rules', function () {
      var generator = idGenerator.createCustomGenerator({})
      var value = generator()

      expect(value).toMatch(/^\d{13}[a-f0-9]{8}$/)
    })

    it('should reject invalid rule containers and field types', function () {
      expect(function () {
        idGenerator.createCustomGenerator('invalid')
      }).toThrow(/rules must be an object/)

      expect(function () {
        idGenerator.createCustomGenerator({ prefix: 123 })
      }).toThrow(/prefix must be a string/)

      expect(function () {
        idGenerator.createCustomGenerator({ randomLength: 0 })
      }).toThrow(/randomLength must be a positive integer/)

      expect(function () {
        idGenerator.createCustomGenerator({ timestampProvider: 'now' })
      }).toThrow(/timestampProvider must be a function/)

      expect(function () {
        idGenerator.createCustomGenerator({ randomProvider: 'rand' })
      }).toThrow(/randomProvider must be a function/)
    })

    it('should reject empty runtime values from providers', function () {
      var emptyTimestampGenerator = idGenerator.createCustomGenerator({
        timestampProvider: function () {
          return ''
        },
        randomProvider: function () {
          return 'abcd1234'
        }
      })

      var emptyRandomGenerator = idGenerator.createCustomGenerator({
        timestampProvider: function () {
          return '1710000000000'
        },
        randomProvider: function () {
          return ''
        }
      })

      expect(function () {
        emptyTimestampGenerator()
      }).toThrow(/timestamp value must not be empty/)

      expect(function () {
        emptyRandomGenerator()
      }).toThrow(/random value must not be empty/)
    })
  })

  describe('express-session genid integration', function () {
    it('should use the custom generator inside the session middleware', function (done) {
      var app = express()
      var generator = idGenerator.createCustomGenerator({
        prefix: 'sess_',
        timestampProvider: function (req) {
          return req.get('x-session-ts')
        },
        randomProvider: function (req) {
          return req.get('x-session-rand')
        }
      })

      app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        genid: generator
      }))

      app.use(function (req, res) {
        res.json({ id: req.sessionID })
      })

      request(app)
        .get('/')
        .set('X-Session-Ts', '1710000000000')
        .set('X-Session-Rand', 'abc123xy')
        .expect(200)
        .expect(function (res) {
          expect(res.body.id).toBe('sess_1710000000000abc123xy')
          expect(res.headers['set-cookie']).toBeDefined()
          assert.ok(/connect\.sid=s%3Asess_1710000000000abc123xy\./.test(res.headers['set-cookie'][0]))
        })
        .end(done)
    })
  })
})
