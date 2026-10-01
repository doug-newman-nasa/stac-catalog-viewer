type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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

class Logger {
  private logs: AnyLog[] = [];
  private maxLogs = 500;

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
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }
}

export const logger = new Logger();
