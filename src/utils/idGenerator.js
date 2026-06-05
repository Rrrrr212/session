'use strict';

const crypto = require('crypto');

const DEFAULT_LENGTH = 24;

function generateId() {
  return crypto.randomBytes(DEFAULT_LENGTH).toString('base64').replace(/[+/=]/g, '').slice(0, DEFAULT_LENGTH);
}

function createCustomGenerator(options) {
  if (options && typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }

  const opts = options || {};
  const prefix = opts.prefix || '';
  const separator = opts.separator || '-';
  const randomLength = opts.randomLength || 8;

  if (randomLength < 1) {
    throw new RangeError('randomLength must be at least 1');
  }

  return function customIdGenerator(req) {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(randomLength).toString('base64').replace(/[+/=]/g, '').slice(0, randomLength);

    if (!prefix) {
      return timestamp + separator + randomPart;
    }

    return prefix + separator + timestamp + separator + randomPart;
  };
}

module.exports = {
  generateId,
  createCustomGenerator
};
