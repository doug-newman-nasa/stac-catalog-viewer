export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

interface RequestLog extends LogEntry {
  type: 'request';
  method: string;
  url: string;
}

interface ResponseLog extends LogEntry {
  type: 'response';
  url: string;
  status: number;
  duration: number;
}

interface ErrorLog extends LogEntry {
  type: 'error';
  error: string;
  stack?: string;
}

type AnyLog = LogEntry | RequestLog | ResponseLog | ErrorLog;

export interface LoggerConfig {
  minLogLevel: LogLevel;
  persistToDisk: boolean;
  maxLogsInMemory: number;
  maxLogsOnDisk: number;
}

class Logger {
  private logs: AnyLog[] = [];
  private config: LoggerConfig = {
    minLogLevel: 'info',
    persistToDisk: true,
    maxLogsInMemory: 500,
    maxLogsOnDisk: 5000,
  };
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'STACCatalogViewerLogs';
  private readonly STORE_NAME = 'logs';
  private readonly CONFIG_STORE_NAME = 'config';
  private logWriteQueue: AnyLog[] = [];
  private isProcessingQueue = false;
  private lastEnforcementTime = 0;
  private readonly ENFORCEMENT_INTERVAL = 5000;

  private formatLog(entry: AnyLog): string {
    const { timestamp, level, message } = entry;
    const levelUpper = level.toUpperCase().padEnd(5);

    if ('type' in entry) {
      switch (entry.type) {
        case 'request':
          return `[${timestamp}] ${levelUpper} ${message} ${entry.method} ${entry.url}`;
        case 'response':
          return `[${timestamp}] ${levelUpper} ${message} ${entry.status} (${entry.duration}ms)`;
        case 'error':
          return `[${timestamp}] ${levelUpper} ${message}\n  ${entry.error}${entry.stack ? '\n' + entry.stack : ''}`;
        default:
          return `[${timestamp}] ${levelUpper} ${message}`;
      }
    }

    return `[${timestamp}] ${levelUpper} ${message}`;
  }

  logRequest(method: string, url: string, data?: unknown): void {
    const entry: RequestLog = {
      timestamp: this.getTimestamp(),
      level: 'info',
      message: 'Request',
      type: 'request',
      method,
      url,
    };
    if (data) entry.data = data;

    this.addLog(entry);
    console.log(this.formatLog(entry));
  }

  logResponse(url: string, status: number, duration: number, data?: unknown): void {
    const entry: ResponseLog = {
      timestamp: this.getTimestamp(),
      level: status >= 400 ? 'warn' : 'info',
      message: 'Response',
      type: 'response',
      url,
      status,
      duration,
    };
    if (data) entry.data = data;

    this.addLog(entry);
    console.log(this.formatLog(entry));
  }

  logError(message: string, error: Error | string, context?: unknown): void {
    const errorStr = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const entry: ErrorLog = {
      timestamp: this.getTimestamp(),
      level: 'error',
      message,
      type: 'error',
      error: errorStr,
      stack,
    };
    if (context) entry.data = context;

    this.addLog(entry);
    console.error(this.formatLog(entry));
  }

  logWarn(message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'warn',
      message,
    };
    if (data) entry.data = data;

    this.addLog(entry);
    console.warn(this.formatLog(entry));
  }

  logInfo(message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'info',
      message,
    };
    if (data) entry.data = data;

    this.addLog(entry);
    console.log(this.formatLog(entry));
  }

  logDebug(message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: 'debug',
      message,
    };
    if (data) entry.data = data;

    this.addLog(entry);
    console.debug(this.formatLog(entry));
  }

  getLogs(): AnyLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  downloadLogs(): void {
    const logsText = this.logs.map(log => this.formatLog(log)).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stac-catalog-viewer-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private addLog(entry: AnyLog): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogsInMemory) {
      this.logs.shift();
    }

    if (this.config.persistToDisk && this.db) {
      this.logWriteQueue.push(entry);
      this.processWriteQueue();
    }
  }

  private processWriteQueue(): void {
    if (this.isProcessingQueue || this.logWriteQueue.length === 0 || !this.db) {
      return;
    }

    this.isProcessingQueue = true;

    const logsToWrite = this.logWriteQueue.splice(0, 10);

    this.persistLogsToDisk(logsToWrite)
      .then(() => {
        this.isProcessingQueue = false;
        if (this.logWriteQueue.length > 0) {
          this.processWriteQueue();
        }

        const now = Date.now();
        if (now - this.lastEnforcementTime > this.ENFORCEMENT_INTERVAL) {
          this.lastEnforcementTime = now;
          this.enforceMaxLogsOnDisk().catch(err => {
            console.warn('Failed to enforce max logs on disk:', err);
          });
        }
      })
      .catch(err => {
        console.warn('Failed to persist logs to disk:', err);
        this.isProcessingQueue = false;
      });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[this.config.minLogLevel];
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadConfig();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('level', 'level', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.CONFIG_STORE_NAME)) {
          db.createObjectStore(this.CONFIG_STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  private persistLogsToDisk(entries: AnyLog[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        for (const entry of entries) {
          store.add({
            ...entry,
            id: undefined,
          });
        }

        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private enforceMaxLogsOnDisk(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const countRequest = store.count();

        countRequest.onerror = () => reject(countRequest.error);
        countRequest.onsuccess = () => {
          try {
            if (countRequest.result > this.config.maxLogsOnDisk) {
              const toDelete = countRequest.result - this.config.maxLogsOnDisk;
              const range = IDBKeyRange.lowerBound(0);
              const getAllRequest = store.getAll(range, toDelete);

              getAllRequest.onerror = () => reject(getAllRequest.error);
              getAllRequest.onsuccess = () => {
                const idsToDelete = (getAllRequest.result as AnyLog[])
                  .map((_, index) => index + 1);

                for (const id of idsToDelete) {
                  store.delete(id);
                }

                transaction.onerror = () => reject(transaction.error);
                transaction.oncomplete = () => resolve();
              };
            } else {
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private loadConfig(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.CONFIG_STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.CONFIG_STORE_NAME);
    const request = store.get('config');

    request.onsuccess = () => {
      if (request.result) {
        this.config = { ...this.config, ...request.result.value };
      }
    };
  }

  private saveConfig(): void {
    if (!this.db) return;

    const transaction = this.db.transaction([this.CONFIG_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.CONFIG_STORE_NAME);
    store.put({ key: 'config', value: this.config });
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  setLogLevel(level: LogLevel): void {
    this.setConfig({ minLogLevel: level });
  }

  async getLogsFromDisk(limit?: number): Promise<AnyLog[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.lowerBound(0);
      const request = index.getAll(range, limit);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const logs = request.result as AnyLog[];
        resolve(logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
      };
    });
  }

  async clearDiskLogs(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async exportLogsFromDisk(): Promise<string> {
    const diskLogs = await this.getLogsFromDisk();
    return diskLogs.map(log => this.formatLog(log)).join('\n');
  }

  downloadLogsWithDiskLogs(): void {
    this.exportLogsFromDisk().then((diskContent) => {
      const memoryContent = this.logs.map(log => this.formatLog(log)).join('\n');
      const allContent = diskContent ? `${diskContent}\n${memoryContent}` : memoryContent;
      const blob = new Blob([allContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stac-catalog-viewer-logs-${new Date().toISOString()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }
}

export const logger = new Logger();

// Initialize the database when the module loads
logger.initializeDB().catch(err => {
  console.warn('Failed to initialize log database:', err);
});
