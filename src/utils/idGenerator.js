'use strict'

var crypto = require('crypto')

/**
 * 默认 ID 生成器 —— 生成 24 位随机十六进制字符串
 * 对应 Strategy Pattern 中的 DefaultStrategy，无需任何外部参数即可使用
 *
 * @return {String} 24 位随机字符串
 * @public
 */
function generateId() {
  return crypto.randomBytes(12).toString('hex')
}

/**
 * 高阶函数（Higher-Order Function），用于创建自定义 ID 生成器
 * 对应 Strategy Pattern 中的 ConcreteStrategy 工厂：
 *   调用方通过组合不同 rule 选项，即可产出不同生成策略的函数实例
 *
 * 可配置 rule 字段说明：
 *   - prefix  {String}   固定前缀，默认 ''
 *   - length  {Number}   随机部分长度（十六进制字符数），默认 24
 *   - includeTimestamp {Boolean} 是否在 ID 中嵌入毫秒级时间戳，默认 false
 *   - separator {String} 各分段之间的连接符，默认 ''
 *
 * 组合示例：
 *   createCustomGenerator({ prefix: 'sess', includeTimestamp: true, separator: '-' })
 *   将生成类似 "sess-1717593600000-a3f2b9c1" 的 ID
 *
 * @param  {Object}  rule  自定义生成规则
 * @param  {String}  [rule.prefix='']
 * @param  {Number}  [rule.length=24]
 * @param  {Boolean} [rule.includeTimestamp=false]
 * @param  {String}  [rule.separator='']
 * @return {Function}       签名与 generateId 一致的 ID 生成函数
 * @public
 */
function createCustomGenerator(rule) {
  if (!rule || typeof rule !== 'object') {
    throw new TypeError('createCustomGenerator requires a rule object')
  }

  var prefix = rule.prefix || ''
  var length = rule.length || 24
  var includeTimestamp = !!rule.includeTimestamp
  var separator = rule.separator || ''

  return function customGenerateId() {
    var parts = []

    if (prefix) {
      parts.push(prefix)
    }

    if (includeTimestamp) {
      parts.push(String(Date.now()))
    }

    parts.push(crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length))

    return parts.join(separator)
  }
}

/**
 * 模块导出 —— 暴露默认策略及策略工厂
 *
 * 设计模式：Strategy Pattern（策略模式）
 *   - generateId              默认策略（24 位随机十六进制字符串）
 *   - createCustomGenerator   策略工厂：接收 rule 配置，返回新的生成策略函数
 *
 * 与 express-session genid 的映射关系：
 *   app.use(session({
 *     genid: generateId                     // 使用默认策略
 *   }))
 *   app.use(session({
 *     genid: createCustomGenerator({ ... }) // 使用自定义策略
 *   }))
 */
exports = module.exports = generateId
exports.generateId = generateId
exports.createCustomGenerator = createCustomGenerator