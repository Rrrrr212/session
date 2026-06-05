'use strict';

var crypto = require('crypto');

var DEFAULT_RANDOM_BYTES = 24;

function generateId() {
  return crypto.randomBytes(DEFAULT_RANDOM_BYTES).toString('hex');
}

function createCustomGenerator(options) {
  if (options == null || typeof options !== 'object') {
    throw new TypeError('genid options must be an object');
  }

  var prefix = options.prefix;
  var length = options.length;
  var includeTimestamp = options.includeTimestamp !== false;

  if (prefix !== undefined && typeof prefix !== 'string') {
    throw new TypeError('prefix must be a string');
  }

  if (length !== undefined) {
    if (typeof length !== 'number' || length % 1 !== 0 || length <= 0) {
      throw new TypeError('length must be a positive integer');
    }
  }

  var randomBytes = length || 16;

  return function customGenId(req) {
    var parts = [];

    if (prefix) {
      parts.push(prefix);
    }

    if (includeTimestamp) {
      parts.push(Date.now().toString(36));
    }

    parts.push(crypto.randomBytes(randomBytes).toString('hex'));

    return parts.join('-');
  };
}

module.exports = {
  generateId: generateId,
  createCustomGenerator: createCustomGenerator
};