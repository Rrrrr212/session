'use strict';

var idGenerator = require('../src/utils/idGenerator');

describe('idGenerator', function () {
  describe('generateId()', function () {
    it('should return a string', function () {
      var id = idGenerator.generateId();
      expect(typeof id).toBe('string');
    });

    it('should return a 48-character hex string (24 random bytes)', function () {
      var id = idGenerator.generateId();
      expect(id).toMatch(/^[0-9a-f]{48}$/);
    });

    it('should generate unique IDs across 10000 calls', function () {
      var ids = {};
      var count = 10000;
      var collision = false;

      for (var i = 0; i < count; i++) {
        var id = idGenerator.generateId();
        if (ids[id]) {
          collision = true;
          break;
        }
        ids[id] = true;
      }

      expect(collision).toBe(false);
    });

    it('should not return empty string', function () {
      var id = idGenerator.generateId();
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate IDs with sufficient character distribution', function () {
      var id = idGenerator.generateId();
      var chars = {};
      for (var i = 0; i < id.length; i++) {
        chars[id.charAt(i)] = true;
      }
      var uniqueCount = Object.keys(chars).length;
      expect(uniqueCount).toBeGreaterThan(8);
    });
  });

  describe('createCustomGenerator()', function () {
    describe('basic functionality', function () {
      it('should return a function', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'sess' });
        expect(typeof gen).toBe('function');
      });

      it('should include prefix in generated ID', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'sess' });
        var id = gen();
        expect(id.indexOf('sess-')).toBe(0);
      });

      it('should include timestamp by default', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'test' });
        var id = gen();
        var parts = id.split('-');
        expect(parts.length).toBe(3);
        expect(parts[0]).toBe('test');
        expect(parts[1]).toMatch(/^[0-9a-z]+$/);
        expect(parts[2]).toMatch(/^[0-9a-f]+$/);
      });

      it('should exclude timestamp when includeTimestamp is false', function () {
        var gen = idGenerator.createCustomGenerator({
          prefix: 'test',
          includeTimestamp: false
        });
        var id = gen();
        var parts = id.split('-');
        expect(parts.length).toBe(2);
        expect(parts[0]).toBe('test');
        expect(parts[1]).toMatch(/^[0-9a-f]+$/);
      });

      it('should generate unique IDs', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'sess' });
        var ids = {};
        var collision = false;

        for (var i = 0; i < 1000; i++) {
          var id = gen();
          if (ids[id]) {
            collision = true;
            break;
          }
          ids[id] = true;
        }

        expect(collision).toBe(false);
      });

      it('should work without options (empty object)', function () {
        var gen = idGenerator.createCustomGenerator({});
        var id = gen();
        var parts = id.split('-');
        expect(parts.length).toBe(2);
        expect(parts[0]).toMatch(/^[0-9a-z]+$/);
        expect(parts[1]).toMatch(/^[0-9a-f]+$/);
      });

      it('should accept req as first argument', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'sess' });
        var mockReq = { url: '/foo', headers: { host: 'example.com' } };
        var id = gen(mockReq);
        expect(typeof id).toBe('string');
        expect(id.indexOf('sess-')).toBe(0);
      });

      it('should accept req as undefined without error', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'sess' });
        var id = gen(undefined);
        expect(typeof id).toBe('string');
      });
    });

    describe('custom length', function () {
      it('should use default 16 bytes (32 hex chars) for random part', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 't' });
        var id = gen();
        var parts = id.split('-');
        expect(parts[2].length).toBe(32);
      });

      it('should use specified length for random part', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 't', length: 4 });
        var id = gen();
        var parts = id.split('-');
        expect(parts[2].length).toBe(8);
      });
    });

    describe('edge cases - invalid inputs', function () {
      it('should throw TypeError for null options', function () {
        expect(function () {
          idGenerator.createCustomGenerator(null);
        }).toThrow(TypeError);
      });

      it('should throw TypeError for undefined options', function () {
        expect(function () {
          idGenerator.createCustomGenerator(undefined);
        }).toThrow(TypeError);
      });

      it('should throw TypeError for string options', function () {
        expect(function () {
          idGenerator.createCustomGenerator('invalid');
        }).toThrow(TypeError);
      });

      it('should throw TypeError for number options', function () {
        expect(function () {
          idGenerator.createCustomGenerator(42);
        }).toThrow(TypeError);
      });

      it('should throw TypeError for non-string prefix', function () {
        expect(function () {
          idGenerator.createCustomGenerator({ prefix: 12345 });
        }).toThrow(TypeError);
      });

      it('should throw TypeError for zero length', function () {
        expect(function () {
          idGenerator.createCustomGenerator({ length: 0 });
        }).toThrow(TypeError);
      });

      it('should throw TypeError for negative length', function () {
        expect(function () {
          idGenerator.createCustomGenerator({ length: -5 });
        }).toThrow(TypeError);
      });

      it('should throw TypeError for float length', function () {
        expect(function () {
          idGenerator.createCustomGenerator({ length: 2.5 });
        }).toThrow(TypeError);
      });

      it('should throw TypeError for NaN length', function () {
        expect(function () {
          idGenerator.createCustomGenerator({ length: NaN });
        }).toThrow(TypeError);
      });
    });

    describe('edge cases - boundary values', function () {
      it('should handle empty string prefix', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: '' });
        var id = gen();
        expect(id.charAt(0)).toBe('-');
      });

      it('should handle very long prefix', function () {
        var longPrefix = '';
        for (var i = 0; i < 1000; i++) {
          longPrefix += 'a';
        }
        var gen = idGenerator.createCustomGenerator({ prefix: longPrefix });
        var id = gen();
        expect(id.indexOf(longPrefix + '-')).toBe(0);
      });

      it('should handle prefix with special characters', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'session_v2' });
        var id = gen();
        expect(id.indexOf('session_v2-')).toBe(0);
      });

      it('should handle length of 1', function () {
        var gen = idGenerator.createCustomGenerator({ length: 1 });
        var id = gen();
        var parts = id.split('-');
        expect(parts[parts.length - 1].length).toBe(2);
      });

      it('should generate monotonically increasing timestamps (base36)', function () {
        var gen = idGenerator.createCustomGenerator({ prefix: 'ts' });
        var id1 = gen();
        var id2 = gen();
        var ts1 = parseInt(id1.split('-')[1], 36);
        var ts2 = parseInt(id2.split('-')[1], 36);
        expect(ts2).toBeGreaterThanOrEqual(ts1);
      });
    });
  });

  describe('integration with express-session genid option', function () {
    var session;
    var express;
    var request;

    beforeAll(function () {
      session = require('../index');
      express = require('express');
      request = require('supertest');
    });

    it('should use default generateId as genid', function (done) {
      var app = express();
      app.use(session({
        secret: 'keyboard cat',
        genid: idGenerator.generateId,
        resave: false,
        saveUninitialized: true
      }));

      app.get('/', function (req, res) {
        res.end(req.sessionID);
      });

      request(app)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.text).toMatch(/^[0-9a-f]{48}$/);
          done();
        });
    });

    it('should use custom generator from createCustomGenerator as genid', function (done) {
      var gen = idGenerator.createCustomGenerator({ prefix: 'mysess' });
      var app = express();
      app.use(session({
        secret: 'keyboard cat',
        genid: gen,
        resave: false,
        saveUninitialized: true
      }));

      app.get('/', function (req, res) {
        res.end(req.sessionID);
      });

      request(app)
        .get('/')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.text.indexOf('mysess-')).toBe(0);
          done();
        });
    });

    it('should pass req to custom genid function', function (done) {
      var capturedReq = null;
      function customGenid(req) {
        capturedReq = req;
        return 'captured-' + Date.now();
      }

      var app = express();
      app.use(session({
        secret: 'keyboard cat',
        genid: customGenid,
        resave: false,
        saveUninitialized: true
      }));

      app.get('/custom-url', function (req, res) {
        res.end(req.sessionID);
      });

      request(app)
        .get('/custom-url')
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          expect(capturedReq).not.toBeNull();
          expect(capturedReq.url).toBe('/custom-url');
          expect(res.text.indexOf('captured-')).toBe(0);
          done();
        });
    });

    it('should persist session across requests with custom genid', function (done) {
      var gen = idGenerator.createCustomGenerator({ prefix: 'persist' });
      var app = express();
      app.use(session({
        secret: 'keyboard cat',
        genid: gen,
        resave: false,
        saveUninitialized: true,
        cookie: {}
      }));

      app.get('/', function (req, res) {
        req.session.visits = (req.session.visits || 0) + 1;
        res.end('visit#' + req.session.visits);
      });

      request(app)
        .get('/')
        .expect(200)
        .end(function (err, res1) {
          if (err) return done(err);
          expect(res1.text).toBe('visit#1');
          var cookies = res1.headers['set-cookie'];
          request(app)
            .get('/')
            .set('Cookie', cookies)
            .expect(200)
            .end(function (err, res2) {
              if (err) return done(err);
              expect(res2.text).toBe('visit#2');
              done();
            });
        });
    });

    it('should throw for non-function genid', function () {
      expect(function () {
        session({
          genid: 'not-a-function',
          secret: 'test',
          resave: false,
          saveUninitialized: true
        });
      }).toThrow(TypeError);
    });
  });
});