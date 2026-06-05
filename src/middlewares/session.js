const session = require('express-session')
const crypto = require('crypto')

const SESSION_SECRET = process.env.SESSION_SECRET || 'xxx'
const SESSION_DEBUG = process.env.SESSION_DEBUG === 'true'

function generateSessionId() {
  const userId = 'anon'
  const timestamp = Date.now()
  const random = crypto.randomBytes(16).toString('hex')
  const sessionId = `${userId}_${timestamp}_${random}`

  if (SESSION_DEBUG) {
    console.log('[Session:GenID] 生成新会话ID => %s', sessionId)
  }

  return sessionId
}

function validateSessionId(sid) {
  if (!sid || typeof sid !== 'string') {
    if (SESSION_DEBUG) {
      console.log('[Session:Validate] 会话ID无效: %s', sid)
    }
    return false
  }

  const parts = sid.split('_')
  const isValid = parts.length === 3
    && !isNaN(Number(parts[1]))
    && parts[2].length > 0

  if (SESSION_DEBUG) {
    console.log('[Session:Validate] 会话ID=%s 验证结果=%s', sid, isValid)
  }

  return isValid
}

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  genid: function (req) {
    const existingSid = req.sessionID

    if (existingSid && validateSessionId(existingSid)) {
      if (SESSION_DEBUG) {
        console.log('[Session:GenID] 复用已有会话ID => %s', existingSid)
      }
      return existingSid
    }

    return generateSessionId()
  },
  name: 'sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  },
  rolling: true
})

function sessionDebugWrapper(req, res, next) {
  sessionMiddleware(req, res, function (err) {
    if (err) {
      if (SESSION_DEBUG) {
        console.log('[Session:Error] 请求路径=%s 错误=%s', req.path, err.message)
      }
      return next(err)
    }

    if (SESSION_DEBUG) {
      const cookieSid = req.cookies && req.cookies.sid
      console.log(
        '[Session:Debug] path=%s sessionID=%s cookie.sid=%s session.user=%s',
        req.path,
        req.sessionID,
        cookieSid || 'undefined',
        req.session && req.session.user ? 'exists' : 'undefined'
      )

      if (req.sessionID && cookieSid && req.sessionID !== cookieSid) {
        console.log(
          '[Session:Warning] sessionID与Cookie不匹配! sessionID=%s cookie.sid=%s',
          req.sessionID,
          cookieSid
        )
      }
    }

    next()
  })
}

module.exports = sessionDebugWrapper
