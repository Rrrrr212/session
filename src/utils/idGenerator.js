const crypto = require('crypto');

/**
 * 默认 ID 生成器
 * @returns {string} 唯一 ID
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * 创建适用于 express-session 的自定义 genid 生成器
 * @param {Object} options - 自定义规则选项
 * @param {string} [options.prefix] - ID 前缀
 * @param {boolean} [options.timestamp] - 是否包含时间戳
 * @param {number} [options.randomLength] - 随机字符串长度
 * @returns {Function} 接收 req 对象的 genid 函数
 */
function createCustomGenerator(options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('无效的规则配置：必须是一个对象');
  }

  return function genid(req) {
    const idParts = [];
    
    // 1. 处理前缀
    if (options.prefix !== undefined) {
      if (typeof options.prefix !== 'string') {
        throw new Error('无效的输入：前缀必须是字符串');
      }
      if (options.prefix.length > 0) {
        idParts.push(options.prefix);
      }
    }
    
    // 2. 处理时间戳
    if (options.timestamp) {
      idParts.push(Date.now().toString());
    }
    
    // 3. 处理随机串
    const randomLength = options.randomLength !== undefined ? options.randomLength : 16;
    if (typeof randomLength !== 'number' || randomLength <= 0 || randomLength % 2 !== 0) {
      throw new Error('无效的输入：随机串长度必须为正偶数');
    }
    
    idParts.push(crypto.randomBytes(randomLength / 2).toString('hex'));
    
    return idParts.join('-');
  };
}

module.exports = {
  generateId,
  createCustomGenerator
};
