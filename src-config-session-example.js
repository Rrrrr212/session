/**
 * 示例：express-session 自定义会话 ID 生成器配置
 * 
 * 格式：SESSION-{timestamp}-{clientIP前8位哈希}-{随机字符}
 * 使用 crypto 确保唯一性和安全性
 */

const express = require('express');
const session = require('./index');
const crypto = require('crypto');

const app = express();

// 自定义会话 ID 生成器
function customGenId(req) {
  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();
  
  // 获取客户端 IP 地址
  let clientIP = req.ip || 
    req.connection?.remoteAddress || 
    req.socket?.remoteAddress || 
    (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';
  
  // 对 IP 进行哈希处理，取前 8 位
  const ipHash = crypto
    .createHash('md5')
    .update(clientIP)
    .digest('hex')
    .slice(0, 8);
  
  // 使用 crypto.randomBytes 生成随机字符串，确保唯一性
  const randomBytes = crypto.randomBytes(12).toString('hex');
  
  // 组合成最终的会话 ID
  return `SESSION-${timestamp}-${ipHash}-${randomBytes}`;
}

// 配置 express-session 中间件
app.use(session({
  secret: 'your-secret-key-here', // 请替换为实际的密钥
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // 在生产环境中建议设置为 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  },
  // 配置自定义会话 ID 生成器
  genid: customGenId
}));

// 测试路由
app.get('/', (req, res) => {
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

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Session ID format: SESSION-{timestamp}-{ipHash}-{random}');
});
