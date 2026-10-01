import { useState } from 'react';
import type { StacCatalog } from '../types/stac';
import '../styles/StorageDisplay.css';

interface StorageDisplayProps {
  catalog: StacCatalog;
}

interface StorageInfo {
  platform?: string;
  location?: string;
  requesterPays?: boolean;
  credentials?: string;
  [key: string]: unknown;
}

export function StorageDisplay({ catalog }: StorageDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const storageInfo = (catalog as any).storage as StorageInfo | undefined;

  if (!storageInfo) {
    return null;
  }

  const hasContent = Object.keys(storageInfo).length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="storage-display">
      <button
        className="storage-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="storage-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="storage-toggle-label">💾 Storage Information</span>
      </button>

      {isExpanded && (
        <div className="storage-content">
          {storageInfo.platform && (
            <div className="storage-item">
              <span className="storage-label">Platform:</span>
              <span className="storage-value">{storageInfo.platform}</span>
            </div>
          )}

          {storageInfo.location && (
            <div className="storage-item">
              <span className="storage-label">Location:</span>
              <span className="storage-value">{storageInfo.location}</span>
            </div>
          )}

          {storageInfo.requesterPays !== undefined && (
            <div className="storage-item">
              <span className="storage-label">Requester Pays:</span>
              <span className={`storage-value ${storageInfo.requesterPays ? 'requester-pays-true' : 'requester-pays-false'}`}>
                {storageInfo.requesterPays ? 'Yes' : 'No'}
              </span>
            </div>
          )}

          {storageInfo.credentials && (
            <div className="storage-item">
              <span className="storage-label">Credentials Required:</span>
              <span className="storage-value">{storageInfo.credentials}</span>
            </div>
          )}

          {Object.entries(storageInfo).map(([key, value]) => {
            if (['platform', 'location', 'requesterPays', 'credentials'].includes(key)) {
              return null;
            }

            if (value === null || value === undefined) {
              return null;
            }

            const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

            return (
              <div key={key} className="storage-item">
                <span className="storage-label">{key}:</span>
                <span className="storage-value">
                  {typeof value === 'object' ? (
                    <pre className="storage-value-object">{valueStr}</pre>
                  ) : (
                    valueStr
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
