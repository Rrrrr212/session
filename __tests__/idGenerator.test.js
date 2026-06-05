const { generateId, createCustomGenerator } = require('../src/utils/idGenerator');

describe('idGenerator 工具模块', () => {
  describe('generateId() - 默认生成器', () => {
    it('应该生成唯一的 ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('应该符合标准 UUID 格式', () => {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('createCustomGenerator() - 自定义规则生成器', () => {
    it('应该支持自定义规则（前缀+时间戳+随机串）', () => {
      const genid = createCustomGenerator({
        prefix: 'user',
        timestamp: true,
        randomLength: 12
      });
      const id = genid();
      
      const parts = id.split('-');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('user');
      expect(Number.isNaN(Number(parts[1]))).toBe(false); // 验证时间戳是数字形式
      expect(parts[2].length).toBe(12); // 验证随机串长度
    });

    it('边界条件测试：空规则应回退至仅生成默认长度（16位）的随机串', () => {
      const genid = createCustomGenerator({});
      const id = genid();
      
      expect(id.includes('-')).toBe(false);
      expect(id.length).toBe(16);
    });

    it('边界条件测试：配置规则不是对象时应抛出错误', () => {
      expect(() => createCustomGenerator(null)).toThrow('无效的规则配置：必须是一个对象');
      expect(() => createCustomGenerator('string')).toThrow('无效的规则配置：必须是一个对象');
      expect(() => createCustomGenerator([])).toThrow('无效的规则配置：必须是一个对象');
    });

    it('无效输入测试：前缀非字符串类型应在调用时抛出错误', () => {
      const genid = createCustomGenerator({ prefix: 12345 });
      expect(() => genid()).toThrow('无效的输入：前缀必须是字符串');
    });

    it('无效输入测试：随机串长度不合法应在调用时抛出错误', () => {
      const genidNegative = createCustomGenerator({ randomLength: -4 });
      expect(() => genidNegative()).toThrow('无效的输入：随机串长度必须为正偶数');
      
      const genidOdd = createCustomGenerator({ randomLength: 5 });
      expect(() => genidOdd()).toThrow('无效的输入：随机串长度必须为正偶数');
    });
  });

  describe('express-session genid 集成场景模拟', () => {
    it('在 session 中间件中能正常接收 req 对象并生成带请求特征的 ID', () => {
      // 模拟 express-session 传入的 req 对象
      const mockReq = {
        ip: '192.168.1.1',
        sessionID: undefined
      };
      
      // 模拟配置了 genid 的 session 中间件场景
      const sessionMiddlewareGenid = createCustomGenerator({
        prefix: 'sess',
        timestamp: true,
        randomLength: 16
      });
      
      // 调用 genid 时传入 req
      const newSessionId = sessionMiddlewareGenid(mockReq);
      
      expect(typeof newSessionId).toBe('string');
      expect(newSessionId.startsWith('sess-')).toBe(true);
      
      // 验证生成的不同 sessionID 是否唯一
      const anotherSessionId = sessionMiddlewareGenid(mockReq);
      expect(newSessionId).not.toBe(anotherSessionId);
    });
  });
});
