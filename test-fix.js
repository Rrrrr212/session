const express = require('express');
const request = require('supertest');
const session = require('./index');
const assert = require('assert');

console.log('[TEST] 开始测试修复方案');

describe('session 会话稳定测试', function() {
  let cookie;
  let server;

  function customGenid(req) {
    console.log('[DEBUG] customGenid 被调用');
    
    let userId = 'guest';
    if (req.session && req.session.user) {
      userId = req.session.user.id || 'guest';
    }
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${userId}_${timestamp}_${random}`;
  }

  this.timeout(10000);

  before(function(done) {
    console.log('[TEST] 创建测试服务器');

    const app = express();
    app.use(express.json());

    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      genid: customGenid,
      cookie: {
        maxAge: 3600000
      }
    }));

    app.use((req, res, next) => {
      console.log(`[DEBUG] 请求 ${req.url}, 原始会话 ID: ${req.sessionID}`);
      next();
    });

    app.post('/login', (req, res) => {
      req.session.user = { id: req.body.userId, name: req.body.name };
      console.log(`[DEBUG] 登录成功，新会话 ID: ${req.sessionID}`);
      res.send({ sessionId: req.sessionID, user: req.session.user });
    });

    app.get('/check', (req, res) => {
      console.log(`[DEBUG] 检查会话，当前会话 ID: ${req.sessionID}`);
      res.send({
        sessionId: req.sessionID,
        user: req.session ? req.session.user : null
      });
    });

    app.post('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          res.status(500).send({ error: err.message });
        } else {
          res.send({ success: true });
        }
      });
    });

    server = app.listen(0, done);
  });

  it('should login successfully and maintain session ID consistently', function(done) {
    request(server)
      .post('/login')
      .send({ userId: '123', name: 'Test User' })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        
        assert(res.body.sessionId);
        assert.strictEqual(res.body.user.id, '123');
        assert.strictEqual(res.body.user.name, 'Test User');
        
        cookie = res.headers['set-cookie'];
        console.log('[TEST] 第一次登录会话 ID:', res.body.sessionId);
        console.log('[TEST] Cookie:', cookie);
        
        done();
      });
  });

  it('should retain the same session ID across multiple requests', function(done) {
    let firstSessionId;

    request(server)
      .get('/check')
      .set('Cookie', cookie)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        
        assert(res.body.sessionId);
        assert.strictEqual(res.body.user.id, '123');
        firstSessionId = res.body.sessionId;
        console.log('[TEST] 第一次检查会话 ID:', firstSessionId);

        request(server)
          .get('/check')
          .set('Cookie', cookie)
          .expect(200)
          .end((err, res) => {
            if (err) return done(err);
            
            console.log('[TEST] 第二次检查会话 ID:', res.body.sessionId);
            assert.strictEqual(res.body.sessionId, firstSessionId);
            console.log('[TEST] ✅ 会话 ID 保持一致');
            
            done();
          });
      });
  });

  after(function(done) {
    server.close(done);
  });
});

console.log('[TEST] 测试脚本创建完成');
