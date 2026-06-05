'use strict';

const { generateId, createCustomGenerator } = require('../src/utils/idGenerator');

describe('idGenerator', () => {
  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const id = generateId();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      
      expect(ids.size).toBe(iterations);
    });

    it('should generate IDs with URL-safe characters only', () => {
      const id = generateId();
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate IDs of approximately correct length', () => {
      const id = generateId();
      // 24 bytes base64 encoded should be around 32 characters (24 * 4/3 = 32)
      expect(id.length).toBeGreaterThanOrEqual(30);
      expect(id.length).toBeLessThanOrEqual(34);
    });
  });

  describe('createCustomGenerator', () => {
    it('should create a generator function', () => {
      const gen = createCustomGenerator();
      expect(typeof gen).toBe('function');
    });

    it('should generate IDs with custom prefix', () => {
      const prefix = 'myapp';
      const gen = createCustomGenerator({ prefix });
      const id = gen();
      
      expect(id.startsWith(prefix)).toBe(true);
    });

    it('should generate IDs with timestamp', () => {
      const gen = createCustomGenerator({ includeTimestamp: true });
      const id = gen();
      
      const parts = id.split('_');
      // Should have at least timestamp and random parts
      expect(parts.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate IDs without timestamp when requested', () => {
      const gen = createCustomGenerator({ includeTimestamp: false, prefix: 'test', randomLength: 10 });
      const id = gen();
      
      const parts = id.split('_');
      // Should have only prefix and random parts
      expect(parts.length).toBe(2);
      expect(parts[0]).toBe('test');
      expect(parts[1].length).toBe(10);
    });

    it('should generate IDs with specified random length', () => {
      const randomLength = 8;
      const gen = createCustomGenerator({ 
        prefix: 'test', 
        includeTimestamp: false, 
        randomLength 
      });
      const id = gen();
      
      const parts = id.split('_');
      expect(parts[1].length).toBe(randomLength);
    });

    it('should generate unique IDs with custom rules', () => {
      const gen = createCustomGenerator({ prefix: 'test', includeTimestamp: true, randomLength: 16 });
      const ids = new Set();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const id = gen();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
      
      expect(ids.size).toBe(iterations);
    });

    it('should generate IDs with URL-safe characters only', () => {
      const gen = createCustomGenerator({ prefix: 'test-app', includeTimestamp: true, randomLength: 16 });
      const id = gen();
      
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('boundary conditions', () => {
    it('should handle empty prefix', () => {
      const gen = createCustomGenerator({ prefix: '' });
      const id = gen();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should handle no options', () => {
      const gen = createCustomGenerator();
      const id = gen();
      
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should handle zero randomLength', () => {
      const gen = createCustomGenerator({ prefix: 'test', includeTimestamp: true, randomLength: 0 });
      const id = gen();
      
      const parts = id.split('_');
      expect(parts.length).toBe(2); // prefix + timestamp
    });

    it('should throw error for invalid prefix type', () => {
      expect(() => {
        createCustomGenerator({ prefix: 123 });
      }).toThrow(TypeError);
    });

    it('should throw error for negative randomLength', () => {
      expect(() => {
        createCustomGenerator({ randomLength: -1 });
      }).toThrow(TypeError);
    });

    it('should throw error for invalid randomLength type', () => {
      expect(() => {
        createCustomGenerator({ randomLength: '10' });
      }).toThrow(TypeError);
    });
  });

  describe('integration with session middleware', () => {
    it('should be usable as genid in session middleware', () => {
      const customGen = createCustomGenerator({ prefix: 'session', includeTimestamp: true });
      
      // Verify it can be called like genid function
      const id = customGen();
      
      expect(typeof id).toBe('string');
      expect(id.startsWith('session')).toBe(true);
    });

    it('should generate different IDs in quick succession', () => {
      const gen = createCustomGenerator({ includeTimestamp: true, randomLength: 16 });
      
      const id1 = gen();
      const id2 = gen();
      
      expect(id1).not.toBe(id2);
    });

    it('should work with null or undefined options', () => {
      const gen1 = createCustomGenerator(null);
      const gen2 = createCustomGenerator(undefined);
      
      expect(typeof gen1).toBe('function');
      expect(typeof gen2).toBe('function');
      
      const id1 = gen1();
      const id2 = gen2();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });
});
