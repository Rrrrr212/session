'use strict';

var crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function createCustomGenerator(rule) {
  if (typeof rule !== 'function') {
    throw new TypeError('rule must be a function');
  }

  return function generateCustomId(context) {
    var customId = rule({
      timestamp: Date.now(),
      random: generateId(),
      context: context
    });

    if (typeof customId !== 'string' || customId.length === 0) {
      throw new TypeError('custom generator must return a non-empty string');
    }

    return customId;
  };
}

// 使用策略模式封装默认生成策略，并通过高阶函数注入自定义生成规则。
module.exports = {
  generateId: generateId,
  createCustomGenerator: createCustomGenerator
};
