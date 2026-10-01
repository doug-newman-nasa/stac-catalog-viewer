import { useState } from 'react';
import type { StacAsset } from '../types/stac';
import '../styles/AssetLinks.css';

interface AssetLinksProps {
  assets: Record<string, StacAsset>;
}

export function AssetLinks({ assets }: AssetLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!assets || Object.keys(assets).length === 0) {
    return null;
  }

  const assetEntries = Object.entries(assets);

  return (
    <div className="asset-links">
      <button
        className="asset-links-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="asset-links-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="asset-links-toggle-label">Assets ({assetEntries.length})</span>
      </button>

      {isExpanded && (
        <div className="asset-links-content">
          <div className="asset-links-list">
            {assetEntries.map(([key, asset]) => (
              <div key={key} className="asset-item">
                <div className="asset-item-header">
                  <span className="asset-key">{key}</span>
                  {asset.type && <span className="asset-type">{asset.type}</span>}
                </div>
                {asset.title && <p className="asset-title">{asset.title}</p>}
                {asset.description && <p className="asset-description">{asset.description}</p>}
                <a
                  href={asset.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="asset-link"
                  title="Open asset"
                >
                  {asset.href}
                  <span className="asset-link-icon">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
