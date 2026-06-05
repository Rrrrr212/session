'use strict';

var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redis = require('redis');

var app = express();

var redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
  socket: {
    reconnectStrategy: function (retries) {
      if (retries > 10) {
        return new Error('Redis connection retries exhausted');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', function (err) {
  console.error('Redis client error:', err);
});

redisClient.connect().catch(console.error);

app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: process.env.SESSION_PREFIX || 'sess:',
    ttl: parseInt(process.env.SESSION_TTL, 10) || 86400
  }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: parseInt(process.env.COOKIE_MAX_AGE, 10) || 86400000,
    sameSite: 'lax'
  }
}));

app.get('/', function (req, res) {
  if (req.session.views) {
    req.session.views++;
    res.json({ views: req.session.views, id: req.session.id });
  } else {
    req.session.views = 1;
    res.json({ views: 1, id: req.session.id, message: 'New session created' });
  }
});

app.get('/health', function (req, res) {
  var isRedisReady = redisClient.isReady;
  res.status(isRedisReady ? 200 : 503).json({
    status: isRedisReady ? 'ok' : 'degraded',
    redis: isRedisReady ? 'connected' : 'disconnected'
  });
});

var port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port, function () {
  console.log('Server listening on port ' + port);
});

module.exports = app;
