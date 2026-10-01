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

interface StorageScheme {
  type?: string;
  platform?: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  [key: string]: unknown;
}

export function StorageDisplay({ catalog }: StorageDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const catalogData = catalog as any;
  const storageInfo = catalogData.storage as StorageInfo | undefined;
  const storageSchemes = catalogData['storage:schemes'] as Record<string, StorageScheme> | undefined;

  const hasStorageInfo = storageInfo && Object.keys(storageInfo).length > 0;
  const hasStorageSchemes = storageSchemes && Object.keys(storageSchemes).length > 0;

  if (!hasStorageInfo && !hasStorageSchemes) {
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
          {/* Legacy storage property */}
          {storageInfo && (
            <>
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
            </>
          )}

          {/* Storage schemes (storage:schemes property) */}
          {storageSchemes && (
            <div className="storage-schemes">
              {Object.entries(storageSchemes).map(([schemeName, scheme]) => (
                <div key={schemeName} className="storage-scheme">
                  <div className="storage-scheme-name">{schemeName}</div>
                  <div className="storage-scheme-details">
                    {scheme.type && (
                      <div className="storage-item">
                        <span className="storage-label">Type:</span>
                        <span className="storage-value">{scheme.type}</span>
                      </div>
                    )}

                    {scheme.platform && (
                      <div className="storage-item">
                        <span className="storage-label">Platform:</span>
                        <span className="storage-value">{scheme.platform}</span>
                      </div>
                    )}

                    {scheme.bucket && (
                      <div className="storage-item">
                        <span className="storage-label">Bucket:</span>
                        <span className="storage-value">{scheme.bucket}</span>
                      </div>
                    )}

                    {scheme.region && (
                      <div className="storage-item">
                        <span className="storage-label">Region:</span>
                        <span className="storage-value">{scheme.region}</span>
                      </div>
                    )}

                    {scheme.endpoint && (
                      <div className="storage-item">
                        <span className="storage-label">Endpoint:</span>
                        <span className="storage-value">{scheme.endpoint}</span>
                      </div>
                    )}

                    {Object.entries(scheme).map(([key, value]) => {
                      if (['type', 'platform', 'bucket', 'region', 'endpoint'].includes(key)) {
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
