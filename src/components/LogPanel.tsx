import { useState } from 'react';
import type { ReactNode } from 'react';
import { logger, type LogLevel, type LoggerConfig } from '../lib/logger';
import '../styles/LogPanel.css';

export function LogPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());
  const [config, setConfig] = useState(logger.getConfig());
  const [showSettings, setShowSettings] = useState(false);

  const handleRefresh = async () => {
    setLogs(logger.getLogs());
    setConfig(logger.getConfig());
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs in memory?')) {
      logger.clearLogs();
      setLogs([]);
    }
  };

  const handleClearDiskLogs = async () => {
    if (confirm('Are you sure you want to clear all logs on disk? This cannot be undone.')) {
      await logger.clearDiskLogs();
      handleRefresh();
    }
  };

  const handleDownload = () => {
    logger.downloadLogsWithDiskLogs();
  };

  const handleLogLevelChange = (level: LogLevel) => {
    logger.setLogLevel(level);
    setConfig(logger.getConfig());
  };

  const handleConfigChange = (newConfig: Partial<LoggerConfig>) => {
    logger.setConfig(newConfig);
    setConfig(logger.getConfig());
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="log-panel">
      <button
        className="log-panel-toggle"
        onClick={togglePanel}
        aria-label="Toggle log panel"
        title="Toggle log panel"
      >
        📋 Logs ({logs.length})
      </button>

      {isOpen && (
        <div className="log-panel-content">
          <div className="log-panel-header">
            <h3>Request & Response Logs</h3>
            <div className="log-panel-controls">
              <button onClick={handleRefresh} title="Refresh logs">
                🔄 Refresh
              </button>
              <button onClick={handleDownload} title="Download logs as text file">
                💾 Download
              </button>
              <button onClick={() => setShowSettings(!showSettings)} title="Log settings">
                ⚙️ Settings
              </button>
              <button onClick={handleClear} title="Clear all logs in memory">
                🗑️ Clear
              </button>
              <button onClick={() => setIsOpen(false)} title="Close panel">
                ✕
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="log-panel-settings">
              <div className="settings-section">
                <label>
                  <span>Minimum Log Level:</span>
                  <select
                    value={config.minLogLevel}
                    onChange={(e) => handleLogLevelChange(e.target.value as LogLevel)}
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </label>
              </div>

              <div className="settings-section">
                <label>
                  <input
                    type="checkbox"
                    checked={config.persistToDisk}
                    onChange={(e) =>
                      handleConfigChange({ persistToDisk: e.target.checked })
                    }
                  />
                  <span>Persist logs to disk</span>
                </label>
              </div>

              <div className="settings-section">
                <label>
                  <span>Max logs in memory:</span>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={config.maxLogsInMemory}
                    onChange={(e) =>
                      handleConfigChange({ maxLogsInMemory: parseInt(e.target.value) })
                    }
                  />
                </label>
              </div>

              <div className="settings-section">
                <label>
                  <span>Max logs on disk:</span>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    value={config.maxLogsOnDisk}
                    onChange={(e) =>
                      handleConfigChange({ maxLogsOnDisk: parseInt(e.target.value) })
                    }
                  />
                </label>
              </div>

              <div className="settings-actions">
                <button onClick={handleClearDiskLogs} className="danger-button" title="Clear all disk logs">
                  🗑️ Clear Disk Logs
                </button>
              </div>
            </div>
          )}

          <div className="log-panel-list">
            {logs.length === 0 ? (
              <p className="log-panel-empty">No logs yet</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`log-entry log-level-${log.level} ${
                    'type' in log ? `log-type-${log.type}` : ''
                  }`}
                >
                  <div className="log-header">
                    <span className="log-timestamp">{log.timestamp}</span>
                    <span className="log-level">{log.level.toUpperCase()}</span>
                    {'type' in log && (
                      <span className="log-type">{log.type}</span>
                    )}
                  </div>
                  <div className="log-message">{log.message}</div>
                  {'type' in log && log.type === 'request' && (
                    <div className="log-details">
                      <span className="log-method">{log.method}</span>
                      <span className="log-url">{log.url}</span>
                    </div>
                  )}
                  {'type' in log && log.type === 'response' && (
                    <div className="log-details">
                      <span
                        className={`log-status ${
                          log.status >= 400 ? 'log-status-error' : 'log-status-ok'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="log-duration">{log.duration.toFixed(2)}ms</span>
                      <span className="log-url">{log.url}</span>
                    </div>
                  )}
                  {'type' in log && log.type === 'error' && (
                    <div className="log-error-details">
                      <div className="log-error-message">{log.error}</div>
                      {log.stack && (
                        <details className="log-stack">
                          <summary>Stack Trace</summary>
                          <pre>{log.stack}</pre>
                        </details>
                      )}
                    </div>
                  )}
                  {log.data !== undefined && (
                    <details className="log-data">
                      <summary>Data</summary>
                      <pre>{JSON.stringify(log.data, null, 2) as ReactNode}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
