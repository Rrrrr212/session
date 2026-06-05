/**
 * src/config/session.js - express-session 配置文件
 * 
 * 改动说明：
 * 1. 添加了自定义 genid 函数，用于生成具有业务可读性的会话 ID
 * 2. 会话 ID 格式：SESSION-{timestamp}-{clientIP前8位哈希}-{随机字符}
 * 3. 使用 crypto 模块确保随机性和唯一性
 * 4. 通过 req 参数获取客户端 IP 地址
 */

const crypto = require('crypto');
const session = require('../../index');

/**
 * 自定义会话 ID 生成器
 * @param {Object} req Express 请求对象
 * @returns {string} 生成的会话 ID
 */
function customGenId(req) {
  // 获取当前时间戳（毫秒）
  const timestamp = Date.now();
  
  // 从请求对象获取客户端 IP 地址
  const clientIP = req.ip || 
    req.connection?.remoteAddress || 
    req.socket?.remoteAddress || 
    (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
    'unknown';
  
  // 对 IP 进行 MD5 哈希，取前 8 位
  const ipHash = crypto
    .createHash('md5')
    .update(clientIP)
    .digest('hex')
    .slice(0, 8);
  
  // 使用 crypto.randomBytes 生成 12 字节的随机字符串，确保唯一性
  const randomBytes = crypto.randomBytes(12).toString('hex');
  
  // 组合成最终的会话 ID
  return `SESSION-${timestamp}-${ipHash}-${randomBytes}`;
}

// express-session 配置
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-strong-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  },
  // 配置自定义会话 ID 生成器
  genid: customGenId
};

module.exports = session(sessionConfig);
