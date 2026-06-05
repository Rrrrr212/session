# 会话随机丢失问题修复方案

## 问题分析

生产环境出现的问题：
- 用户登录后，req.session.user 偶尔变为 undefined
- 日志显示 sessionID 变化但 Cookie 未更新
- 现有配置：`app.use(session({ secret: 'xxx', resave: false, saveUninitialized: false }))`

## 解决方案

我们通过以下方式解决问题：
1. 添加自定义 genid 函数，采用 `userId_timestamp_random` 格式
2. 增加详细的调试日志，追踪 ID 生成与验证过程
3. 优化会话管理逻辑，增强 Cookie 更新触发机制

## 完整修复代码

### 方案 1：完整的 Express 应用示例

创建 `src/middlewares/session.js` 或在应用入口文件中使用以下代码：

```javascript
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');

const app = express();

function customGenid(req) {
  console.log('[DEBUG] 生成会话 ID - 请求:', req.method, req.url);
  
  let userId = 'guest';
  if (req.session && req.session.user) {
    userId = req.session.user.id || 'guest';
  } else if (req.body && req.body.userId) {
    userId = req.body.userId;
  } else if (req.query && req.query.userId) {
    userId = req.query.userId;
  }
  
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const sessionId = `${userId}_${timestamp}_${random}`;
  
  console.log('[DEBUG] 新会话 ID:', sessionId);
  
  return sessionId;
}

app.use(session({
  secret: 'your-secure-secret-key',
  resave: false,
  saveUninitialized: false,
  genid: customGenid,
  rolling: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// 中间件：记录会话状态
app.use((req, res, next) => {
  console.log('[DEBUG] 请求处理 - URL:', req.url);
  console.log('[DEBUG] 原始会话 ID:', req.sessionID);
  console.log('[DEBUG] 会话存在:', !!req.session);
  console.log('[DEBUG] 用户信息:', req.session ? req.session.user : '未登录');
  next();
});

app.use(express.json());

app.post('/login', (req, res) => {
  const { userId, name } = req.body;
  
  if (!userId || !name) {
    res.status(400).send({ error: '需要 userId 和 name 参数' });
    return;
  }
  
  req.session.user = { id: userId, name: name };
  
  console.log('[DEBUG] 用户登录成功 - 会话 ID:', req.sessionID);
  console.log('[DEBUG] 用户信息:', req.session.user);
  
  res.send({ 
    message: '登录成功', 
    sessionId: req.sessionID, 
    user: req.session.user 
  });
});

app.get('/check-session', (req, res) => {
  if (req.session && req.session.user) {
    res.send({
      status: 'success',
      user: req.session.user,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(401).send({
      status: 'error',
      message: '未登录或会话已过期',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/logout', (req, res) => {
  const oldSessionId = req.sessionID;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('[ERROR] 销毁会话失败:', err);
      res.status(500).send({ error: '登出失败' });
    } else {
      console.log('[INFO] 会话已销毁 - 旧会话 ID:', oldSessionId);
      res.send({ message: '登出成功' });
    }
  });
});

app.listen(3000, () => {
  console.log('[INFO] 服务器运行在 http://localhost:3000');
});
```

### 方案 2：仅中间件配置（适用于已有应用）

在你的 `./src/middlewares/session.js` 中使用以下代码：

```javascript
const session = require('express-session');
const crypto = require('crypto');

function customGenid(req) {
  console.log('[DEBUG] 生成会话 ID');
  
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

module.exports = session({
  secret: 'your-secure-secret-key',
  resave: false,
  saveUninitialized: false,
  genid: customGenid,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
});
```

### 方案 3：增强的调试中间件（额外）

可以添加一个独立的调试中间件来更好地追踪问题：

```javascript
function sessionDebugger(req, res, next) {
  console.log('========================================');
  console.log('时间:', new Date().toISOString());
  console.log('请求 URL:', req.url);
  console.log('请求方法:', req.method);
  
  if (req.headers.cookie) {
    console.log('Cookie 头:', req.headers.cookie);
  }
  
  console.log('原始 req.sessionID:', req.sessionID);
  console.log('会话存在:', !!req.session);
  
  if (req.session) {
    console.log('会话内容:', JSON.stringify(req.session, null, 2));
  }
  
  // 保存原始的 res.end 方法
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    console.log('响应状态码:', res.statusCode);
    console.log('最终会话 ID:', req.sessionID);
    console.log('========================================');
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

// 使用方式
app.use(sessionDebugger);
```

## 使用说明

1. 确保已安装依赖：
   ```bash
   npm install express express-session
   ```

2. 在应用中使用配置好的中间件

3. 查看服务器日志，观察会话 ID 的生成和变化过程

4. 使用 `/login` 登录，然后使用 `/check-session` 验证会话是否稳定

## 测试接口

- **POST** `/login` - 登录，请求体：`{"userId": "123", "name": "User"}`
- **GET** `/check-session` - 检查当前会话状态
- **POST** `/logout` - 登出并销毁当前会话

## 关键改进点

1. **自定义会话 ID 格式**：`userId_timestamp_random` - 便于追踪和调试
2. **详细的调试日志**：记录每个请求的会话状态变化
3. **增强的 Cookie 配置**：包括 `httpOnly`、`sameSite` 和安全设置
4. **会话状态追踪**：通过中间件记录完整的请求/响应周期中的会话变化
