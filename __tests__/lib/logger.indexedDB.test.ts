import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Logger = typeof import('../../src/lib/logger').logger;
type Handler = ((ev: Event) => void) | null;
type RecordValue = Record<string, any>;

// In-memory IndexedDB fake. Unlike a per-transaction mock, stores persist across
// transactions, transactions complete only after their requests settle, and
// individual requests/transactions can be made to fail.

class FakeRequest {
  onsuccess: Handler = null;
  onerror: Handler = null;
  onupgradeneeded: ((ev: any) => void) | null = null;
  result: any = undefined;
  error: Error | null = null;
}

class FakeStore {
  records: RecordValue[] = [];
  indexes: string[] = [];
  private nextId = 1;

  constructor(public keyPath: string, public autoIncrement = false) {}

  createIndex(name: string) {
    this.indexes.push(name);
    return {};
  }

  insert(value: RecordValue): unknown {
    const record = { ...value };
    if (this.autoIncrement && record[this.keyPath] == null) {
      record[this.keyPath] = this.nextId++;
    }
    this.records.push(record);
    return record[this.keyPath];
  }

  upsert(value: RecordValue): unknown {
    const existing = this.records.findIndex(r => r[this.keyPath] === value[this.keyPath]);
    if (existing >= 0) {
      this.records[existing] = { ...value };
    } else {
      this.records.push({ ...value });
    }
    return value[this.keyPath];
  }
}

class FakeTransaction {
  oncomplete: Handler = null;
  onerror: Handler = null;
  error: Error | null = null;
  private pending = 0;
  private finished = false;

  constructor(private db: FakeDatabase, private fail: boolean) {
    this.scheduleFinish();
  }

  objectStore(name: string) {
    const store = this.db.stores.get(name);
    if (!store) throw new Error(`No object store named ${name}`);
    return {
      add: (value: RecordValue) => this.request('add', () => store.insert(value)),
      put: (value: RecordValue) => this.request('put', () => store.upsert(value)),
      get: (key: unknown) => this.request('get', () => store.records.find(r => r[store.keyPath] === key)),
      getAll: (_range?: unknown, count?: number) => this.request('getAll', () => store.records.slice(0, count)),
      count: () => this.request('count', () => store.records.length),
      delete: (key: unknown) =>
        this.request('delete', () => {
          store.records = store.records.filter(r => r[store.keyPath] !== key);
        }),
      clear: () =>
        this.request('clear', () => {
          store.records = [];
        }),
      index: (indexName: string) => ({
        getAll: (_range?: unknown, count?: number) =>
          this.request('indexGetAll', () => [...store.records].sort((a, b) => (a[indexName] < b[indexName] ? 1 : -1)).slice(0, count)),
      }),
    };
  }

  private request(op: string, compute: () => unknown) {
    const req = new FakeRequest();
    this.pending++;
    setTimeout(() => {
      if (this.db.failRequests.has(op)) {
        req.error = new Error(`${op} failed`);
        req.onerror?.(new Event('error'));
      } else {
        req.result = compute();
        req.onsuccess?.(new Event('success'));
      }
      this.pending--;
      this.scheduleFinish();
    }, 0);
    return req;
  }

  private scheduleFinish() {
    setTimeout(() => {
      if (this.pending > 0 || this.finished) return;
      this.finished = true;
      if (this.fail) {
        this.error = new Error('transaction failed');
        this.onerror?.(new Event('error'));
      } else {
        this.oncomplete?.(new Event('complete'));
      }
    }, 0);
  }
}

class FakeDatabase {
  stores = new Map<string, FakeStore>();
  failRequests = new Set<string>();
  // Indexes (0-based) of transactions on the logs store that should throw or fail
  throwLogsTransactionAt = new Set<number>();
  failLogsTransactionAt = new Set<number>();
  private logsTransactionCount = 0;

  objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };

  createObjectStore(name: string, options: { keyPath: string; autoIncrement?: boolean }) {
    const store = new FakeStore(options.keyPath, options.autoIncrement);
    this.stores.set(name, store);
    return store;
  }

  transaction(storeNames: string[]) {
    let fail = false;
    if (storeNames.includes('logs')) {
      const index = this.logsTransactionCount++;
      if (this.throwLogsTransactionAt.has(index)) throw new Error('cannot open transaction');
      fail = this.failLogsTransactionAt.has(index);
    }
    return new FakeTransaction(this, fail);
  }

  logsStore() {
    return this.stores.get('logs')!;
  }

  configStore() {
    return this.stores.get('config')!;
  }
}

interface FakeIndexedDB {
  db: FakeDatabase;
  openError: boolean;
  opened: boolean;
}

function installFakeIndexedDB(): FakeIndexedDB {
  const fake: FakeIndexedDB = { db: new FakeDatabase(), openError: false, opened: false };

  vi.stubGlobal('indexedDB', {
    open: vi.fn(() => {
      const req = new FakeRequest();
      setTimeout(() => {
        if (fake.openError) {
          req.error = new Error('open failed');
          req.onerror?.(new Event('error'));
          return;
        }
        req.result = fake.db;
        req.onupgradeneeded?.({ target: req });
        req.onsuccess?.(new Event('success'));
        fake.opened = true;
      }, 0);
      return req;
    }),
  });

  vi.stubGlobal('IDBKeyRange', {
    lowerBound: vi.fn((value: unknown) => ({ lower: value })),
  });

  return fake;
}

function createStores(db: FakeDatabase) {
  db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
  db.createObjectStore('config', { keyPath: 'key' });
}

async function loadLogger(fake: FakeIndexedDB): Promise<Logger> {
  const { logger } = await import('../../src/lib/logger');
  await vi.waitFor(() => expect(fake.opened).toBe(true));
  return logger;
}

describe('Logger IndexedDB persistence', () => {
  let fake: FakeIndexedDB;

  beforeEach(() => {
    vi.resetModules();
    fake = installFakeIndexedDB();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('initializeDB', () => {
    it('should create the logs and config object stores on upgrade', async () => {
      await loadLogger(fake);

      expect(fake.db.objectStoreNames.contains('logs')).toBe(true);
      expect(fake.db.objectStoreNames.contains('config')).toBe(true);
      expect(fake.db.logsStore().indexes).toEqual(['timestamp', 'level']);
      expect(indexedDB.open).toHaveBeenCalledWith('STACCatalogViewerLogs', 1);
    });

    it('should not recreate object stores that already exist', async () => {
      createStores(fake.db);
      const existingLogs = fake.db.logsStore();
      const existingConfig = fake.db.configStore();

      await loadLogger(fake);

      expect(fake.db.logsStore()).toBe(existingLogs);
      expect(fake.db.configStore()).toBe(existingConfig);
      expect(existingLogs.indexes).toEqual([]);
    });

    it('should warn when the database fails to open', async () => {
      fake.openError = true;

      await import('../../src/lib/logger');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith('Failed to initialize log database:', expect.any(Error))
      );
    });

    it('should reject initializeDB when opening fails', async () => {
      const logger = await loadLogger(fake);
      fake.openError = true;

      await expect(logger.initializeDB()).rejects.toThrow('open failed');
    });
  });

  describe('config persistence', () => {
    it('should load saved config from disk on initialization', async () => {
      createStores(fake.db);
      fake.db.configStore().upsert({ key: 'config', value: { minLogLevel: 'debug', maxLogsInMemory: 42 } });

      const logger = await loadLogger(fake);

      await vi.waitFor(() => expect(logger.getConfig().minLogLevel).toBe('debug'));
      expect(logger.getConfig().maxLogsInMemory).toBe(42);
      expect(logger.getConfig().persistToDisk).toBe(true);
    });

    it('should keep default config when nothing is saved on disk', async () => {
      const logger = await loadLogger(fake);
      // Let the config read settle
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(logger.getConfig()).toEqual({
        minLogLevel: 'info',
        persistToDisk: true,
        maxLogsInMemory: 500,
        maxLogsOnDisk: 5000,
      });
    });

    it('should save config to disk when it changes', async () => {
      const logger = await loadLogger(fake);

      logger.setLogLevel('warn');

      await vi.waitFor(() =>
        expect(fake.db.configStore().records).toEqual([
          { key: 'config', value: expect.objectContaining({ minLogLevel: 'warn' }) },
        ])
      );
    });
  });

  describe('writing logs to disk', () => {
    it('should persist log entries to the logs store', async () => {
      const logger = await loadLogger(fake);

      logger.logInfo('first');
      logger.logWarn('second', { detail: true });

      await vi.waitFor(() => expect(fake.db.logsStore().records).toHaveLength(2));
      const [first, second] = fake.db.logsStore().records;
      expect(first).toMatchObject({ id: 1, level: 'info', message: 'first' });
      expect(second).toMatchObject({ id: 2, level: 'warn', message: 'second', data: { detail: true } });
    });

    it('should write logs in batches of at most ten', async () => {
      const logger = await loadLogger(fake);

      for (let i = 0; i < 25; i++) {
        logger.logInfo(`message ${i}`);
      }

      await vi.waitFor(() => expect(fake.db.logsStore().records).toHaveLength(25));
      expect(fake.db.logsStore().records.map(r => r.message)).toEqual(
        Array.from({ length: 25 }, (_, i) => `message ${i}`)
      );
    });

    it('should not write to disk when persistence is disabled', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ persistToDisk: false });

      logger.logInfo('memory only');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fake.db.logsStore().records).toHaveLength(0);
      expect(logger.getLogs()).toHaveLength(1);
    });

    it('should warn and recover when a write transaction fails', async () => {
      const logger = await loadLogger(fake);
      fake.db.failLogsTransactionAt.add(0);

      logger.logInfo('lost');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith('Failed to persist logs to disk:', expect.any(Error))
      );

      logger.logInfo('saved');
      await vi.waitFor(() =>
        expect(fake.db.logsStore().records.map(r => r.message)).toContain('saved')
      );
    });

    it('should warn when a write transaction cannot be opened', async () => {
      const logger = await loadLogger(fake);
      fake.db.throwLogsTransactionAt.add(0);

      logger.logInfo('lost');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to persist logs to disk:',
          expect.objectContaining({ message: 'cannot open transaction' })
        )
      );
    });
  });

  describe('enforcing max logs on disk', () => {
    it('should delete the oldest logs when over the limit', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ maxLogsOnDisk: 2 });

      for (let i = 1; i <= 5; i++) {
        logger.logInfo(`message ${i}`);
      }

      await vi.waitFor(() => expect(fake.db.logsStore().records.map(r => r.id)).toEqual([4, 5]));
    });

    it('should leave logs alone when under the limit', async () => {
      const logger = await loadLogger(fake);

      logger.logInfo('one');
      logger.logInfo('two');

      await vi.waitFor(() => expect(fake.db.logsStore().records).toHaveLength(2));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fake.db.logsStore().records).toHaveLength(2);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should only enforce the limit once per interval', async () => {
      const logger = await loadLogger(fake);

      logger.logInfo('one');
      await vi.waitFor(() => expect(fake.db.logsStore().records).toHaveLength(1));
      await new Promise(resolve => setTimeout(resolve, 10));

      // The second write lands within the enforcement interval, so no new count is issued
      logger.setConfig({ maxLogsOnDisk: 0 });
      logger.logInfo('two');
      await vi.waitFor(() => expect(fake.db.logsStore().records).toHaveLength(2));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fake.db.logsStore().records).toHaveLength(2);
    });

    it('should warn when counting logs fails', async () => {
      const logger = await loadLogger(fake);
      fake.db.failRequests.add('count');

      logger.logInfo('one');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to enforce max logs on disk:',
          expect.objectContaining({ message: 'count failed' })
        )
      );
    });

    it('should warn when reading logs to delete fails', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ maxLogsOnDisk: 0 });
      fake.db.failRequests.add('getAll');

      logger.logInfo('one');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to enforce max logs on disk:',
          expect.objectContaining({ message: 'getAll failed' })
        )
      );
    });

    it('should warn when the delete transaction fails', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ maxLogsOnDisk: 0 });
      fake.db.failLogsTransactionAt.add(1);

      logger.logInfo('one');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to enforce max logs on disk:',
          expect.objectContaining({ message: 'transaction failed' })
        )
      );
    });

    it('should warn when building the key range throws', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ maxLogsOnDisk: 0 });
      vi.mocked(IDBKeyRange.lowerBound).mockImplementation(() => {
        throw new Error('bad range');
      });

      logger.logInfo('one');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to enforce max logs on disk:',
          expect.objectContaining({ message: 'bad range' })
        )
      );
    });

    it('should warn when the enforcement transaction cannot be opened', async () => {
      const logger = await loadLogger(fake);
      fake.db.throwLogsTransactionAt.add(1);

      logger.logInfo('one');

      await vi.waitFor(() =>
        expect(console.warn).toHaveBeenCalledWith(
          'Failed to enforce max logs on disk:',
          expect.objectContaining({ message: 'cannot open transaction' })
        )
      );
    });
  });

  describe('reading logs from disk', () => {
    function seedLogs() {
      createStores(fake.db);
      fake.db.logsStore().insert({ timestamp: '2024-01-01T00:00:02.000Z', level: 'info', message: 'second' });
      fake.db.logsStore().insert({ timestamp: '2024-01-01T00:00:01.000Z', level: 'info', message: 'first' });
      fake.db.logsStore().insert({ timestamp: '2024-01-01T00:00:03.000Z', level: 'warn', message: 'third' });
    }

    it('should return disk logs sorted by timestamp', async () => {
      seedLogs();
      const logger = await loadLogger(fake);

      const logs = await logger.getLogsFromDisk();

      expect(logs.map(l => l.message)).toEqual(['first', 'second', 'third']);
    });

    it('should honor the limit argument', async () => {
      seedLogs();
      const logger = await loadLogger(fake);

      const logs = await logger.getLogsFromDisk(2);

      expect(logs).toHaveLength(2);
    });

    it('should reject when reading disk logs fails', async () => {
      const logger = await loadLogger(fake);
      fake.db.failRequests.add('indexGetAll');

      await expect(logger.getLogsFromDisk()).rejects.toThrow('indexGetAll failed');
    });

    it('should clear disk logs', async () => {
      seedLogs();
      const logger = await loadLogger(fake);

      await logger.clearDiskLogs();

      expect(fake.db.logsStore().records).toHaveLength(0);
    });

    it('should reject when clearing disk logs fails', async () => {
      seedLogs();
      const logger = await loadLogger(fake);
      fake.db.failRequests.add('clear');

      await expect(logger.clearDiskLogs()).rejects.toThrow('clear failed');
      expect(fake.db.logsStore().records).toHaveLength(3);
    });

    it('should export disk logs formatted for every log type', async () => {
      createStores(fake.db);
      const store = fake.db.logsStore();
      store.insert({ timestamp: '2024-01-01T00:00:01.000Z', level: 'info', message: 'Request', type: 'request', method: 'GET', url: 'https://example.com/a' });
      store.insert({ timestamp: '2024-01-01T00:00:02.000Z', level: 'warn', message: 'Response', type: 'response', url: 'https://example.com/a', status: 404, duration: 12 });
      store.insert({ timestamp: '2024-01-01T00:00:03.000Z', level: 'error', message: 'Boom', type: 'error', error: 'bad', stack: 'at line 1' });
      store.insert({ timestamp: '2024-01-01T00:00:04.000Z', level: 'error', message: 'No stack', type: 'error', error: 'worse' });
      store.insert({ timestamp: '2024-01-01T00:00:05.000Z', level: 'info', message: 'Custom', type: 'custom' });
      store.insert({ timestamp: '2024-01-01T00:00:06.000Z', level: 'debug', message: 'Plain' });
      const logger = await loadLogger(fake);

      const exported = await logger.exportLogsFromDisk();

      expect(exported).toBe(
        [
          '[2024-01-01T00:00:01.000Z] INFO  Request GET https://example.com/a',
          '[2024-01-01T00:00:02.000Z] WARN  Response 404 (12ms)',
          '[2024-01-01T00:00:03.000Z] ERROR Boom\n  bad\nat line 1',
          '[2024-01-01T00:00:04.000Z] ERROR No stack\n  worse',
          '[2024-01-01T00:00:05.000Z] INFO  Custom',
          '[2024-01-01T00:00:06.000Z] DEBUG Plain',
        ].join('\n')
      );
    });
  });

  describe('downloading logs', () => {
    let createObjectURL: ReturnType<typeof vi.fn>;
    let revokeObjectURL: ReturnType<typeof vi.fn>;
    let clickSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      createObjectURL = vi.fn(() => 'blob:logs');
      revokeObjectURL = vi.fn();
      Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true });
      Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true, writable: true });
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    async function downloadedText(): Promise<string> {
      const blob = createObjectURL.mock.calls[0][0] as Blob;
      return blob.text();
    }

    it('should download in-memory logs as a text file', async () => {
      const logger = await loadLogger(fake);
      logger.logInfo('hello');

      logger.downloadLogs();

      expect(clickSpy).toHaveBeenCalledTimes(1);
      const link = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
      expect(link.download).toMatch(/^stac-catalog-viewer-logs-.*\.txt$/);
      expect(link.isConnected).toBe(false);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:logs');
      expect(await downloadedText()).toMatch(/INFO {2}hello$/);
    });

    it('should prepend disk logs to memory logs when downloading both', async () => {
      createStores(fake.db);
      fake.db.logsStore().insert({ timestamp: '2024-01-01T00:00:00.000Z', level: 'info', message: 'from disk' });
      const logger = await loadLogger(fake);
      logger.setConfig({ persistToDisk: false });
      logger.logInfo('from memory');

      logger.downloadLogsWithDiskLogs();

      await vi.waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
      const text = await downloadedText();
      expect(text.split('\n')).toEqual([
        '[2024-01-01T00:00:00.000Z] INFO  from disk',
        expect.stringMatching(/INFO {2}from memory$/),
      ]);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:logs');
    });

    it('should download only memory logs when the disk is empty', async () => {
      const logger = await loadLogger(fake);
      logger.setConfig({ persistToDisk: false });
      logger.logInfo('from memory');

      logger.downloadLogsWithDiskLogs();

      await vi.waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
      expect(await downloadedText()).toMatch(/^\[[^\]]+\] INFO {2}from memory$/);
    });
  });
});
