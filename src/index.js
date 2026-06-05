'use strict';

var express = require('express');
var session = require('../');
var RedisStore = require('connect-redis').default;
var Redis = require('ioredis');

var app = express();

var redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  retryStrategy: function (times) {
    return Math.min(times * 50, 2000);
  }
});

redisClient.on('error', function (err) {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', function () {
  console.log('Redis connected successfully');
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  name: 'connect.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.get('/', function (req, res) {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  res.json({
    sessionId: req.sessionID,
    views: req.session.views
  });
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Server listening on port ' + port);
});

module.exports = app;