'use strict';

var express = require('express');
var session = require('../index');
var idGenerator = require('../src/utils/idGenerator');

var app = express();

// 示例 1: 使用默认的 generateId 函数
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  genid: idGenerator.generateId
}));

// 示例 2: 使用自定义的 id 生成器
var customGen = idGenerator.createCustomGenerator({
  prefix: 'myapp-sess',
  includeTimestamp: true,
  randomLength: 16
});

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  genid: customGen
}));

app.get('/', function(req, res) {
  if (req.session.views) {
    req.session.views++;
    res.setHeader('Content-Type', 'text/html');
    res.write('<p>Session ID: ' + req.sessionID + '</p>');
    res.write('<p>views: ' + req.session.views + '</p>');
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>');
    res.end();
  } else {
    req.session.views = 1;
    res.end('Welcome to the session demo! Refresh! Session ID: ' + req.sessionID);
  }
});

var server = app.listen(3000, function() {
  console.log('Example app listening on port ' + server.address().port);
  console.log('Test using default generateId: visit http://localhost:' + server.address().port);
  console.log('Test using custom generator: visit http://localhost:' + server.address().port);
});
