'use strict';

var crypto = require('crypto');

/**
 * Generate a random session ID
 * @returns {string} Random session ID
 */
function generateId() {
  return crypto.randomBytes(24).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Create a custom ID generator function
 * @param {Object} options - Options for the custom generator
 * @param {string} [options.prefix] - Prefix for the ID
 * @param {boolean} [options.includeTimestamp] - Whether to include timestamp in the ID
 * @param {number} [options.randomLength] - Length of the random part of the ID
 * @returns {Function} Custom ID generator function
 */
function createCustomGenerator(options) {
  var opts = options || {};
  var prefix = opts.prefix || '';
  var includeTimestamp = opts.includeTimestamp !== false;
  var randomLength = opts.randomLength || 16;

  if (typeof prefix !== 'string') {
    throw new TypeError('prefix must be a string');
  }

  if (typeof randomLength !== 'number' || randomLength < 0) {
    throw new TypeError('randomLength must be a positive number');
  }

  return function customGenId() {
    var parts = [];

    if (prefix) {
      parts.push(prefix);
    }

    if (includeTimestamp) {
      parts.push(Date.now().toString(36));
    }

    if (randomLength > 0) {
      parts.push(crypto.randomBytes(Math.ceil(randomLength * 3 / 4)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '').slice(0, randomLength));
    }

    return parts.join('_');
  };
}

module.exports = {
  generateId: generateId,
  createCustomGenerator: createCustomGenerator
};
