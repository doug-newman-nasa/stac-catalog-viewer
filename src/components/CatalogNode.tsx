import { useState } from 'react';
import { useStacNode } from '../hooks/useStacNode';
import { getChildLinks, getItemLinks, resolveHref } from '../lib/stac';
import '../styles/CatalogNode.css';

interface CatalogNodeProps {
  url: string;
  baseUrl?: string;
  depth?: number;
  isRoot?: boolean;
}

export function CatalogNode({
  url,
  baseUrl = url,
  depth = 0,
  isRoot = false,
}: CatalogNodeProps) {
  const { data, loading, error, retry } = useStacNode(url);
  const [expanded, setExpanded] = useState(isRoot);

  if (loading) {
    return (
      <div className="catalog-node loading" style={{ paddingLeft: `${depth * 20}px` }}>
        <span className="spinner">⏳</span> Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-node error" style={{ paddingLeft: `${depth * 20}px` }}>
        <div className="error-content">
          <p className="error-message">{error.message}</p>
          <button onClick={retry} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const childLinks = getChildLinks(data);
  const itemLinks = getItemLinks(data);
  const hasChildren = childLinks.length > 0;

  return (
    <div className="catalog-node" style={{ paddingLeft: `${depth * 20}px` }}>
      <div className="catalog-header">
        {hasChildren && (
          <button
            className="expand-button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="expand-button-placeholder" />}

        <div className="catalog-info">
          <h3 className="catalog-title">
            {data.title || data.id}
            {data.id && data.id !== data.title && (
              <code className="catalog-id">{data.id}</code>
            )}
          </h3>
          {data.description && (
            <p className="catalog-description">{data.description}</p>
          )}
          {(childLinks.length > 0 || itemLinks.length > 0) && (
            <div className="catalog-stats">
              {childLinks.length > 0 && (
                <span className="stat">
                  📁 {childLinks.length} child{childLinks.length !== 1 ? 'ren' : ''}
                </span>
              )}
              {itemLinks.length > 0 && (
                <span className="stat">
                  📄 {itemLinks.length} item{itemLinks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="catalog-children">
          {childLinks.map((link) => (
            <CatalogNode
              key={link.href}
              url={resolveHref(baseUrl, link.href)}
              baseUrl={url}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
