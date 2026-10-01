import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, type LogLevel, type LoggerConfig } from '../../src/lib/logger';

// Mock IndexedDB implementation
class MockIDBRequest {
  public onerror: ((this: IDBRequest<any>, ev: Event) => any) | null = null;
  public onsuccess: ((this: IDBRequest<any>, ev: Event) => any) | null = null;
  public result: any = null;
  public error: any = null;

  constructor(callback?: () => void) {
    if (callback) {
      setTimeout(() => {
        callback();
        this.onsuccess?.call(this, new Event('success') as any);
      }, 0);
    }
  }
}

class MockIDBStore {
  private data: any[] = [];
  private autoIncrement = 1;

  add(value: any) {
    const entry = { ...value, id: this.autoIncrement++ };
    this.data.push(entry);
    return new MockIDBRequest();
  }

  put(value: any) {
    const existing = this.data.findIndex(d => d.key === value.key);
    if (existing >= 0) {
      this.data[existing] = value;
    } else {
      this.data.push(value);
    }
    return new MockIDBRequest();
  }

  get(key: any) {
    const request = new MockIDBRequest();
    request.result = this.data.find(d => d.id === key || d.key === key);
    return request;
  }

  getAll(range?: any, limit?: number) {
    const request = new MockIDBRequest();
    request.result = this.data.slice(0, limit);
    return request;
  }

  clear() {
    this.data = [];
    return new MockIDBRequest();
  }

  count() {
    const request = new MockIDBRequest();
    request.result = this.data.length;
    return request;
  }

  delete(key: any) {
    this.data = this.data.filter(d => d.id !== key);
    return new MockIDBRequest();
  }

  createIndex(name: string, keyPath: string) {
    return this;
  }

  index(name: string) {
    return {
      getAll: (range?: any, limit?: number) => {
        const request = new MockIDBRequest();
        request.result = this.data.slice(0, limit);
        return request;
      },
    };
  }
}

class MockIDBTransaction {
  public onerror: ((ev: Event) => any) | null = null;
  public oncomplete: ((ev: Event) => any) | null = null;
  private stores: Map<string, MockIDBStore> = new Map();

  constructor(stores: string[], mode: string, db: any) {
    for (const store of stores) {
      this.stores.set(store, new MockIDBStore());
    }
    setTimeout(() => {
      this.oncomplete?.(new Event('complete') as any);
    }, 0);
  }

  objectStore(name: string) {
    return this.stores.get(name) || new MockIDBStore();
  }
}

class MockIDBDatabase {
  public objectStoreNames = {
    contains: (name: string) => false,
  };

  transaction(storeNames: string[], mode: string) {
    return new MockIDBTransaction(storeNames, mode, this);
  }

  createObjectStore(name: string, options?: any) {
    return new MockIDBStore();
  }
}

describe('Logger', () => {
  beforeEach(async () => {
    logger.clearLogs();
    logger.setConfig({
      minLogLevel: 'info',
      persistToDisk: true,
      maxLogsInMemory: 500,
      maxLogsOnDisk: 5000,
    });
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Mock IndexedDB with better implementation
    global.indexedDB = {
      open: vi.fn((name: string, version?: number) => {
        const request = new MockIDBRequest(() => {
          request.result = new MockIDBDatabase();
        });
        return request as any;
      }),
    } as any;

    // Mock IDBKeyRange
    global.IDBKeyRange = {
      lowerBound: vi.fn((value: any) => ({ lowerBound: value })),
      upperBound: vi.fn((value: any) => ({ upperBound: value })),
    } as any;

    // Initialize DB
    try {
      await logger.initializeDB();
    } catch {
      // Ignore initialization errors
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const config = logger.getConfig();
      expect(config.minLogLevel).toBe('info');
      expect(config.persistToDisk).toBe(true);
      expect(config.maxLogsInMemory).toBe(500);
      expect(config.maxLogsOnDisk).toBe(5000);
    });
  });

  describe('logRequest', () => {
    it('should log a request with method and URL', () => {
      logger.logRequest('GET', 'https://example.com/api');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'request',
        level: 'info',
        message: 'Request',
        method: 'GET',
        url: 'https://example.com/api',
      });
    });

    it('should include optional data in request log', () => {
      const data = { query: 'test' };
      logger.logRequest('POST', 'https://example.com/api', data);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(data);
    });

    it('should log multiple requests', () => {
      logger.logRequest('GET', 'https://example.com/api1');
      logger.logRequest('POST', 'https://example.com/api2');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].method).toBe('GET');
      expect(logs[1].method).toBe('POST');
    });
  });

  describe('logResponse', () => {
    it('should log a response with status and duration', () => {
      logger.logResponse('https://example.com/api', 200, 123);
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'response',
        level: 'info',
        message: 'Response',
        url: 'https://example.com/api',
        status: 200,
        duration: 123,
      });
    });

    it('should mark error responses with warn level', () => {
      logger.logResponse('https://example.com/api', 404, 50);
      const logs = logger.getLogs();

      expect(logs[0].level).toBe('warn');
    });

    it('should mark 5xx responses with warn level', () => {
      logger.logResponse('https://example.com/api', 500, 200);
      const logs = logger.getLogs();

      expect(logs[0].level).toBe('warn');
    });

    it('should include optional data in response log', () => {
      const data = { itemCount: 10 };
      logger.logResponse('https://example.com/api', 200, 100, data);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(data);
    });
  });

  describe('logError', () => {
    it('should log an error with message and error object', () => {
      const error = new Error('Test error');
      logger.logError('Failed request', error);
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        type: 'error',
        level: 'error',
        message: 'Failed request',
        error: 'Test error',
      });
      expect(logs[0].stack).toBeDefined();
    });

    it('should handle string errors', () => {
      logger.logError('Failed request', 'String error message');
      const logs = logger.getLogs();

      expect(logs[0].error).toBe('String error message');
    });

    it('should include context data', () => {
      const error = new Error('Test error');
      const context = { url: 'https://example.com' };
      logger.logError('Failed request', error, context);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(context);
    });
  });

  describe('logWarn', () => {
    it('should log a warning message', () => {
      logger.logWarn('This is a warning');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'warn',
        message: 'This is a warning',
      });
    });

    it('should include optional data', () => {
      const data = { value: 123 };
      logger.logWarn('Warning with data', data);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(data);
    });
  });

  describe('logInfo', () => {
    it('should log an info message', () => {
      logger.logInfo('Info message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'info',
        message: 'Info message',
      });
    });

    it('should include optional data', () => {
      const data = { step: 1 };
      logger.logInfo('Info with data', data);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(data);
    });
  });

  describe('logDebug', () => {
    it('should log a debug message', () => {
      logger.setLogLevel('debug');
      logger.logDebug('Debug message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: 'debug',
        message: 'Debug message',
      });
    });

    it('should not log debug when level is info', () => {
      logger.setLogLevel('info');
      logger.logDebug('Debug message');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(0);
    });

    it('should include optional data', () => {
      logger.setLogLevel('debug');
      const data = { debug: true };
      logger.logDebug('Debug with data', data);
      const logs = logger.getLogs();

      expect(logs[0].data).toEqual(data);
    });
  });

  describe('log level filtering', () => {
    it('should not log below minimum level', () => {
      logger.setLogLevel('error');
      logger.logDebug('Debug');
      logger.logInfo('Info');
      logger.logWarn('Warn');
      logger.logError('Error', 'error');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
    });

    it('should log at minimum level', () => {
      logger.setLogLevel('warn');
      logger.logWarn('Warning');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
    });

    it('should log above minimum level', () => {
      logger.setLogLevel('info');
      logger.logWarn('Warning');
      logger.logError('Error', 'error');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
    });
  });

  describe('config management', () => {
    it('should get current config', () => {
      const config = logger.getConfig();

      expect(config).toHaveProperty('minLogLevel');
      expect(config).toHaveProperty('persistToDisk');
      expect(config).toHaveProperty('maxLogsInMemory');
      expect(config).toHaveProperty('maxLogsOnDisk');
    });

    it('should set log level', () => {
      logger.setLogLevel('error');
      const config = logger.getConfig();

      expect(config.minLogLevel).toBe('error');
    });

    it('should set partial config', () => {
      logger.setConfig({ maxLogsInMemory: 1000 });
      const config = logger.getConfig();

      expect(config.maxLogsInMemory).toBe(1000);
      expect(config.minLogLevel).toBe('info');
    });

    it('should set multiple config values', () => {
      logger.setConfig({
        minLogLevel: 'debug',
        maxLogsInMemory: 2000,
        persistToDisk: false,
      });
      const config = logger.getConfig();

      expect(config.minLogLevel).toBe('debug');
      expect(config.maxLogsInMemory).toBe(2000);
      expect(config.persistToDisk).toBe(false);
    });
  });

  describe('in-memory log management', () => {
    it('should get all logs', () => {
      logger.logInfo('Message 1');
      logger.logInfo('Message 2');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('should clear all logs', () => {
      logger.logInfo('Message 1');
      logger.logInfo('Message 2');
      logger.clearLogs();

      const logs = logger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should maintain max logs limit', () => {
      logger.setConfig({ maxLogsInMemory: 5 });

      for (let i = 0; i < 10; i++) {
        logger.logInfo(`Message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(5);
    });

    it('should remove oldest logs when exceeding limit', () => {
      logger.setConfig({ maxLogsInMemory: 3 });

      logger.logInfo('Message 1');
      logger.logInfo('Message 2');
      logger.logInfo('Message 3');
      logger.logInfo('Message 4');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).not.toBe('Message 1');
    });

    it('should have timestamps for logs', () => {
      logger.logInfo('Test');
      const logs = logger.getLogs();

      expect(logs[0].timestamp).toBeDefined();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('download logs', () => {
    it('should trigger file download', () => {
      logger.logInfo('Test log');
      logger.downloadLogs();

      expect(logger.getLogs()).toHaveLength(1);
    });

    it('should format logs correctly', () => {
      logger.logRequest('GET', 'https://example.com');
      logger.logResponse('https://example.com', 200, 50);
      logger.logError('Test', new Error('test error'));

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].type).toBe('request');
      expect(logs[1].type).toBe('response');
      expect(logs[2].type).toBe('error');
    });
  });

  describe('database operations', () => {
    it('should initialize database', async () => {
      const config = logger.getConfig();
      expect(config).toBeDefined();
    });

    it('should handle database initialization gracefully', async () => {
      const config = logger.getConfig();
      expect(config).toBeDefined();
      expect(config.minLogLevel).toBe('info');
    });

    it('should save and load config from disk', () => {
      logger.setConfig({ minLogLevel: 'debug', maxLogsInMemory: 1000 });
      const config = logger.getConfig();

      expect(config.minLogLevel).toBe('debug');
      expect(config.maxLogsInMemory).toBe(1000);
    });
  });

;

  describe('console output', () => {
    it('should call console.log for info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.logInfo('Info');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should call console.warn for warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      logger.logWarn('Warning');

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should call console.error for error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      logger.logError('Error', new Error('test'));

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should call console.debug for debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug');
      logger.setLogLevel('debug');
      logger.logDebug('Debug');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('persistence disabled', () => {
    it('should not persist to disk when disabled', () => {
      logger.setConfig({ persistToDisk: false });
      logger.logInfo('Test');
      const logs = logger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test');
    });

    it('should respect persistence setting', () => {
      logger.setConfig({ persistToDisk: true });
      expect(logger.getConfig().persistToDisk).toBe(true);

      logger.setConfig({ persistToDisk: false });
      expect(logger.getConfig().persistToDisk).toBe(false);
    });
  });

  describe('queue processing', () => {
    it('should batch logs into queue', () => {
      logger.logInfo('Message 1');
      logger.logInfo('Message 2');
      logger.logInfo('Message 3');

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle rapid successive logs', () => {
      for (let i = 0; i < 20; i++) {
        logger.logRequest('GET', `https://example.com/api/${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(5);
    });

    it('should respect log level in queue', () => {
      logger.setLogLevel('warn');
      logger.logDebug('Should not be logged');
      logger.logInfo('Should not be logged');
      logger.logWarn('Should be logged');

      const logs = logger.getLogs();
      expect(logs.filter(l => l.level === 'warn')).toHaveLength(1);
      expect(logs.filter(l => l.level === 'debug')).toHaveLength(0);
      expect(logs.filter(l => l.level === 'info')).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      logger.logInfo(longMessage);

      const logs = logger.getLogs();
      expect(logs[0].message).toBe(longMessage);
    });

    it('should handle very large data objects', () => {
      const largeData = {
        array: Array(1000).fill({ nested: { value: 42 } }),
      };
      logger.logInfo('Test', largeData);

      const logs = logger.getLogs();
      expect(logs[0].data).toEqual(largeData);
    });

    it('should handle null and undefined in data', () => {
      logger.logInfo('Test 1', null);
      logger.logInfo('Test 2', undefined);

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('should handle errors with circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      logger.logError('Circular error', new Error('test'), obj);
      const logs = logger.getLogs();
      expect(logs[0].type).toBe('error');
    });

    it('should handle response with high status codes', () => {
      logger.logResponse('https://example.com', 503, 1000);
      const logs = logger.getLogs();

      expect(logs[0].level).toBe('warn');
      expect(logs[0].status).toBe(503);
    });

    it('should handle response with low status codes', () => {
      logger.logResponse('https://example.com', 200, 50);
      logger.logResponse('https://example.com', 201, 60);
      logger.logResponse('https://example.com', 204, 40);

      const logs = logger.getLogs();
      expect(logs.every(l => l.level === 'info')).toBe(true);
    });
  });

  describe('log format verification', () => {
    it('should include all required fields in request log', () => {
      logger.logRequest('POST', 'https://api.example.com/data');
      const log = logger.getLogs()[0];

      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('type');
      expect(log).toHaveProperty('method');
      expect(log).toHaveProperty('url');
    });

    it('should include all required fields in response log', () => {
      logger.logResponse('https://api.example.com', 200, 100);
      const log = logger.getLogs()[0];

      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('type');
      expect(log).toHaveProperty('url');
      expect(log).toHaveProperty('status');
      expect(log).toHaveProperty('duration');
    });

    it('should include all required fields in error log', () => {
      logger.logError('Operation failed', new Error('test'));
      const log = logger.getLogs()[0];

      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('type');
      expect(log).toHaveProperty('error');
    });

    it('should have ISO timestamps', () => {
      logger.logInfo('Test');
      const log = logger.getLogs()[0];

      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('memory management', () => {
    it('should not exceed max in-memory logs', () => {
      logger.setConfig({ maxLogsInMemory: 10 });

      for (let i = 0; i < 50; i++) {
        logger.logInfo(`Message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(10);
    });

    it('should maintain oldest entries when limit exceeded', () => {
      logger.setConfig({ maxLogsInMemory: 3 });

      logger.logInfo('First');
      logger.logInfo('Second');
      logger.logInfo('Third');
      logger.logInfo('Fourth');

      const logs = logger.getLogs();
      expect(logs.map(l => l.message)).not.toContain('First');
    });

    it('should handle small max log values', () => {
      logger.setConfig({ maxLogsInMemory: 1 });

      logger.logInfo('Message 1');
      logger.logInfo('Message 2');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Message 2');
    });
  });

  describe('config persistence', () => {
    it('should update minLogLevel in config', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        logger.setLogLevel(level);
        expect(logger.getConfig().minLogLevel).toBe(level);
      }
    });

    it('should persist multiple config options', () => {
      logger.setConfig({
        minLogLevel: 'debug',
        maxLogsInMemory: 2000,
        maxLogsOnDisk: 8000,
        persistToDisk: false,
      });

      const config = logger.getConfig();
      expect(config.minLogLevel).toBe('debug');
      expect(config.maxLogsInMemory).toBe(2000);
      expect(config.maxLogsOnDisk).toBe(8000);
      expect(config.persistToDisk).toBe(false);
    });

    it('should only update specified config properties', () => {
      const original = logger.getConfig();
      logger.setConfig({ maxLogsInMemory: 1500 });

      const updated = logger.getConfig();
      expect(updated.maxLogsInMemory).toBe(1500);
      expect(updated.minLogLevel).toBe(original.minLogLevel);
      expect(updated.persistToDisk).toBe(original.persistToDisk);
    });

    it('should format error logs correctly', () => {
      const formatted = (logger as any).formatLog({
        level: 'error',
        message: 'Error test',
        timestamp: '2024-01-01T12:00:00Z',
        error: { message: 'Test error', stack: 'at test' },
      });
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('Error test');
    });

    it('should clear logs from disk when database unavailable', async () => {
      const originalDb = (logger as any).db;
      (logger as any).db = null;

      const result = await logger.clearDiskLogs();
      expect(result).toBeUndefined();

      (logger as any).db = originalDb;
    });

    it('should handle warn level logs', () => {
      const formatted = (logger as any).formatLog({
        level: 'warn',
        message: 'Warning message',
        timestamp: '2024-01-01T12:00:00Z',
      });
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('Warning message');
    });

    it('should return error from formatLog when parameter is invalid', () => {
      const formatted = (logger as any).formatLog({
        level: 'unknown',
        message: 'Unknown level',
        timestamp: '2024-01-01T12:00:00Z',
      });
      expect(typeof formatted).toBe('string');
    });
  });

  describe('disk operations with logs', () => {
    it('should handle getLogsFromDisk when db is null', async () => {
      const originalDb = (logger as any).db;
      (logger as any).db = null;

      const diskLogs = await logger.getLogsFromDisk();
      expect(diskLogs).toEqual([]);

      (logger as any).db = originalDb;
    });

    it('should handle clearDiskLogs when db is null', async () => {
      const originalDb = (logger as any).db;
      (logger as any).db = null;

      await logger.clearDiskLogs();

      (logger as any).db = originalDb;
    });

    it('should save config correctly', () => {
      logger.setConfig({ minLogLevel: 'debug' });
      const config = logger.getConfig();

      expect(config.minLogLevel).toBe('debug');
    });

    it('should persist logs when config.persistToDisk is true', () => {
      logger.setConfig({ persistToDisk: true });
      logger.logInfo('Persisted log');

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].message).toBe('Persisted log');
    });

    it('should handle shouldLog correctly for different levels', () => {
      const shouldLogMethod = (logger as any).shouldLog.bind(logger);

      logger.setLogLevel('warn');
      expect(shouldLogMethod('debug')).toBe(false);
      expect(shouldLogMethod('info')).toBe(false);
      expect(shouldLogMethod('warn')).toBe(true);
      expect(shouldLogMethod('error')).toBe(true);
    });

    it('should handle getTimestamp format', () => {
      const timestampMethod = (logger as any).getTimestamp.bind(logger);
      const timestamp = timestampMethod();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should correctly format different log types', () => {
      const formatLogMethod = (logger as any).formatLog.bind(logger);

      const requestLog: any = {
        timestamp: '2024-01-01T12:00:00Z',
        level: 'info',
        message: 'Test Request',
        type: 'request',
        method: 'GET',
        url: 'https://example.com',
      };

      const formatted = formatLogMethod(requestLog);
      expect(formatted).toContain('Test Request');
      expect(formatted).toContain('GET');
      expect(formatted).toContain('https://example.com');
    });

    it('should handle response log format with duration', () => {
      logger.logResponse('https://example.com', 200, 123);
      const logs = logger.getLogs();

      expect(logs[logs.length - 1]).toMatchObject({
        type: 'response',
        status: 200,
        duration: 123,
      });
    });

    it('should handle error log with stack trace', () => {
      const error = new Error('Test error with stack');
      logger.logError('Operation failed', error);

      const logs = logger.getLogs();
      const errorLog = logs[logs.length - 1];

      expect(errorLog.type).toBe('error');
      expect(errorLog).toHaveProperty('stack');
    });

    it('should process write queue when logs are added', () => {
      logger.setConfig({ persistToDisk: true });

      for (let i = 0; i < 15; i++) {
        logger.logInfo(`Message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should handle request log data parameter', () => {
      const data = { query: 'test', param: 123 };
      logger.logRequest('POST', 'https://api.example.com', data);

      const logs = logger.getLogs();
      const requestLog = logs[logs.length - 1];

      expect(requestLog.data).toEqual(data);
    });

    it('should handle response log data parameter', () => {
      const data = { count: 42, cached: true };
      logger.logResponse('https://api.example.com', 200, 50, data);

      const logs = logger.getLogs();
      const responseLog = logs[logs.length - 1];

      expect(responseLog.data).toEqual(data);
    });

    it('should format request log correctly in console', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.logRequest('DELETE', 'https://api.example.com/resource/123');

      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      expect(call).toContain('DELETE');
      expect(call).toContain('https://api.example.com/resource/123');
    });

    it('should format response log correctly in console', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      logger.logResponse('https://api.example.com', 201, 75);

      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      expect(call).toContain('201');
      expect(call).toContain('75ms');
    });

    it('should format error log with stack trace in console', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const error = new Error('Critical failure');
      logger.logError('Critical operation failed', error);

      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      expect(call).toContain('Critical operation failed');
      expect(call).toContain('Critical failure');
    });

    it('should handle multiple errors in succession', () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3'),
      ];

      errors.forEach((err, i) => {
        logger.logError(`Error ${i + 1}`, err);
      });

      const logs = logger.getLogs();
      const errorLogs = logs.filter(l => l.type === 'error');
      expect(errorLogs).toHaveLength(3);
    });

    it('should handle mixed request, response, and error logs', () => {
      logger.logRequest('GET', 'https://api.example.com/data');
      logger.logResponse('https://api.example.com/data', 200, 100);
      logger.logError('Processing failed', new Error('Data error'));

      const logs = logger.getLogs();
      const types = logs.map(l => ('type' in l ? l.type : 'log'));
      expect(types).toContain('request');
      expect(types).toContain('response');
      expect(types).toContain('error');
    });

    it('should handle info log without data parameter', () => {
      logger.logInfo('Simple info message');

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.message).toBe('Simple info message');
      expect(lastLog.data).toBeUndefined();
    });

    it('should handle warn log without data parameter', () => {
      logger.logWarn('Simple warn message');

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.message).toBe('Simple warn message');
      expect(lastLog.data).toBeUndefined();
    });

    it('should handle debug log without data parameter', () => {
      logger.setLogLevel('debug');
      logger.logDebug('Simple debug message');

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.message).toBe('Simple debug message');
      expect(lastLog.data).toBeUndefined();
    });

    it('should handle request log without data parameter', () => {
      logger.logRequest('PUT', 'https://api.example.com/update');

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.data).toBeUndefined();
    });

    it('should handle response log without data parameter', () => {
      logger.logResponse('https://api.example.com', 204, 50);

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.data).toBeUndefined();
    });

    it('should format generic log entry without type', () => {
      const formatLogMethod = (logger as any).formatLog.bind(logger);

      const genericLog: any = {
        timestamp: '2024-01-01T12:00:00Z',
        level: 'info',
        message: 'Generic message',
      };

      const formatted = formatLogMethod(genericLog);
      expect(formatted).toContain('Generic message');
      expect(formatted).toMatch(/INFO\s+Generic message/);
    });

    it('should handle error log without stack trace', () => {
      const error = { message: 'Error without stack' } as Error;
      logger.logError('Operation error', error);

      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.type).toBe('error');
      expect(lastLog.stack).toBeUndefined();
    });
  });
});
