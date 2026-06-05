/**
 * Session ID Generator Module
 * 
 * Design Pattern: Strategy + Factory
 * Inspired by express-session's `genid` option design
 * - Default strategy: cryptographically secure random string
 * - Custom strategy: factory function that creates generators based on rules
 */

const crypto = require('crypto');

/**
 * Default ID generator - generates cryptographically secure random strings
 * Similar to express-session's default behavior using uid-safe
 * 
 * @param {number} [length=24] - Length of random string
 * @returns {string} Random session ID
 */
function generateId(length = 24) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .replace(/[+/]/g, '')
    .slice(0, length);
}

/**
 * Factory function to create custom ID generators
 * Supports rule-based composition: prefix + timestamp + random
 * 
 * @param {Object} rule - Custom generation rules
 * @param {string} [rule.prefix=''] - Fixed prefix string
 * @param {boolean} [rule.useTimestamp=false] - Whether to include timestamp
 * @param {number} [rule.randomLength=16] - Length of random suffix
 * @param {string} [rule.separator='-'] - Separator between parts
 * @returns {Function} Custom ID generator function
 * 
 * @example
 * const gen = createCustomGenerator({ prefix: 'sess', useTimestamp: true, randomLength: 12 });
 * const id = gen(req); // => "sess-1704067200000-aB3dEf7gHi9j"
 */
function createCustomGenerator(rule = {}) {
  const {
    prefix = '',
    useTimestamp = false,
    randomLength = 16,
    separator = '-'
  } = rule;

  return function customIdGenerator(req) {
    const parts = [];

    if (prefix) {
      parts.push(prefix);
    }

    if (useTimestamp) {
      parts.push(Date.now().toString());
    }

    parts.push(generateId(randomLength));

    return parts.join(separator);
  };
}

module.exports = {
  generateId,
  createCustomGenerator
};
