'use strict';

var crypto = require('crypto')

function createRandomSegment(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

function generateId() {
  return Date.now().toString(36) + '-' + createRandomSegment(24)
}

function createCustomGenerator(rules) {
  var normalizedRules = rules == null ? {} : rules

  if (!normalizedRules || typeof normalizedRules !== 'object' || Array.isArray(normalizedRules)) {
    throw new TypeError('rules must be an object')
  }

  var prefix = normalizedRules.prefix == null ? '' : normalizedRules.prefix
  var timestampProvider = normalizedRules.timestampProvider || Date.now
  var randomLength = normalizedRules.randomLength == null ? 8 : normalizedRules.randomLength
  var randomProvider = normalizedRules.randomProvider

  if (typeof prefix !== 'string') {
    throw new TypeError('prefix must be a string')
  }

  if (typeof timestampProvider !== 'function') {
    throw new TypeError('timestampProvider must be a function')
  }

  if (randomProvider != null && typeof randomProvider !== 'function') {
    throw new TypeError('randomProvider must be a function')
  }

  if (!Number.isInteger(randomLength) || randomLength <= 0) {
    throw new TypeError('randomLength must be a positive integer')
  }

  return function customGenerator(req) {
    var timestamp = timestampProvider(req)
    var randomValue = randomProvider ? randomProvider(req) : createRandomSegment(randomLength)

    if (typeof timestamp !== 'number' && typeof timestamp !== 'string') {
      throw new TypeError('timestampProvider must return a number or string')
    }

    if (typeof randomValue !== 'string') {
      throw new TypeError('randomProvider must return a string')
    }

    var normalizedTimestamp = String(timestamp).trim()

    if (!normalizedTimestamp) {
      throw new TypeError('timestamp value must not be empty')
    }

    if (!randomValue) {
      throw new TypeError('random value must not be empty')
    }

    return prefix + normalizedTimestamp + randomValue
  }
}

module.exports = {
  generateId: generateId,
  createCustomGenerator: createCustomGenerator
}
