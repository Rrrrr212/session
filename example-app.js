const express = require('express');
const session = require('./index');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

function customGenid(req) {
  console.log('[DEBUG] 生成会话 ID - 请求:', req.method, req.url);
  
  let userId = 'guest';
  if (req.session && req.session.user) {
    userId = req.session.user.id || 'guest';
  } else if (req.body && req.body.userId) {
    userId = req.body.userId;
  }
  
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const sessionId = `${userId}_${timestamp}_${random}`;
  
  console.log('[DEBUG] 新会话 ID:', sessionId);
  
  return sessionId;
}

console.log('[INFO] 初始化 express-session 中间件');

app.use(session({
  secret: 'your-secret-key-keep-it-safe',
  resave: false,
  saveUninitialized: false,
  genid: customGenid,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  console.log('[DEBUG] 收到请求 - URL:', req.url, '原始会话 ID:', req.sessionID);
  
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  console.log('[DEBUG] 主页 - 会话状态:', req.session ? '存在' : '不存在');
  
  if (req.session && req.session.user) {
    res.send(`欢迎回来, ${req.session.user.name}! 会话 ID: ${req.sessionID}`);
  } else {
    res.send('请先登录');
  }
});

app.post('/login', (req, res) => {
  console.log('[DEBUG] 登录请求 - 原始会话 ID:', req.sessionID);
  
  const { userId, name } = req.body;
  
  if (!userId || !name) {
    res.status(400).send('需要 userId 和 name');
    return;
  }
  
  if (!req.session) {
    console.log('[DEBUG] 会话不存在，重新初始化');
  }
  
  req.session.user = { id: userId, name: name };
  console.log('[DEBUG] 用户已登录，新会话 ID:', req.sessionID);
  
  res.send(`登录成功！会话 ID: ${req.sessionID}`);
});

app.get('/check-session', (req, res) => {
  console.log('[DEBUG] 检查会话 - 当前会话 ID:', req.sessionID);
  
  if (req.session && req.session.user) {
    res.json({
      status: 'success',
      user: req.session.user,
      sessionId: req.sessionID,
      timestamp: Date.now()
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: '未登录或会话丢失',
      sessionId: req.sessionID,
      timestamp: Date.now()
    });
  }
});

app.post('/logout', (req, res) => {
  console.log('[DEBUG] 登出请求 - 会话 ID:', req.sessionID);
  
  req.session.destroy(err => {
    if (err) {
      console.error('[ERROR] 销毁会话失败:', err);
      res.status(500).send('登出失败');
    } else {
      console.log('[INFO] 会话已成功销毁');
      res.send('已登出');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[INFO] 服务器运行在 http://localhost:${PORT}`);
  console.log('[INFO] 可用接口:');
  console.log('  - GET    /              (主页)');
  console.log('  - POST   /login         (登录，JSON: {userId: "1", name: "Test"} )');
  console.log('  - GET    /check-session (检查会话状态)');
  console.log('  - POST   /logout        (登出)');
});

module.exports = app;
