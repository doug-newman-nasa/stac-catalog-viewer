import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useStacNode } from '../hooks/useStacNode';
import { getChildLinks, getItemLinks, resolveHref } from '../lib/stac';
import '../styles/CatalogPage.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showUrl, setShowUrl] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [childPageSize, setChildPageSize] = useState(25);
  const [childCurrentPage, setChildCurrentPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(25);
  const [itemCurrentPage, setItemCurrentPage] = useState(1);
  const url = searchParams.get('url');

  const { data, loading, error, retry } = useStacNode(url || '');

  const copyUrlToClipboard = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const getPaginatedData = <T,>(items: T[], page: number, pageSize: number) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  };

  const getTotalPages = (itemCount: number, pageSize: number) => {
    return Math.ceil(itemCount / pageSize);
  };

  if (!url) {
    return (
      <div className="catalog-page-error">
        <p>No catalog URL provided</p>
        <button onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="catalog-page loading">
        <span className="spinner">⏳</span> Loading catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page error">
        <div className="error-content">
          <p className="error-message">{error.message}</p>
          <div className="error-actions">
            <button onClick={retry} className="retry-button">
              Retry
            </button>
            <button onClick={() => navigate(-1)} className="back-button">
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const childLinks = getChildLinks(data);
  const itemLinks = getItemLinks(data);

  return (
    <div className="catalog-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button-header">
          ← Back
        </button>
        <button
          onClick={() => setShowUrl(!showUrl)}
          className="url-toggle-button"
          title={showUrl ? 'Hide URL' : 'Show URL'}
        >
          {showUrl ? '🔗 Hide URL' : '🔗 Show URL'}
        </button>
      </div>

      {showUrl && (
        <div className="url-display">
          <div className="url-content">
            <span className="url-label">Catalog URL:</span>
            <code className="url-value">{url}</code>
            <button
              onClick={copyUrlToClipboard}
              className="copy-button"
              title="Copy URL to clipboard"
            >
              {urlCopied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="catalog-card">
        <div className="catalog-header">
          <div className="catalog-info">
            <h2 className="catalog-title">
              {data.title || data.id}
              {data.id && data.id !== data.title && (
                <code className="catalog-id">{data.id}</code>
              )}
            </h2>
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
      </div>

      {childLinks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Child Catalogs</h3>
            <div className="section-controls">
              <label className="page-size-label">
                Per page:
                <select
                  value={childPageSize}
                  onChange={(e) => {
                    setChildPageSize(Number(e.target.value));
                    setChildCurrentPage(1);
                  }}
                  className="page-size-select"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {getTotalPages(childLinks.length, childPageSize) > 1 && (
            <div className="pagination pagination-top">
              <span className="page-info">
                Page {childCurrentPage} of {getTotalPages(childLinks.length, childPageSize)}
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => setChildCurrentPage(Math.max(1, childCurrentPage - 1))}
                  disabled={childCurrentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setChildCurrentPage(Math.min(getTotalPages(childLinks.length, childPageSize), childCurrentPage + 1))
                  }
                  disabled={childCurrentPage === getTotalPages(childLinks.length, childPageSize)}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          <div className="child-list">
            {getPaginatedData(childLinks, childCurrentPage, childPageSize).map((link) => {
              const childUrl = resolveHref(url, link.href);
              return (
                <Link
                  key={link.href}
                  to={`/catalog?url=${encodeURIComponent(childUrl)}`}
                  className="child-link"
                >
                  <div className="child-link-content">
                    <span className="child-link-title">{link.title || 'Untitled'}</span>
                    {link.type && <span className="child-link-type">{link.type}</span>}
                  </div>
                  <span className="child-link-arrow">→</span>
                </Link>
              );
            })}
          </div>

          {getTotalPages(childLinks.length, childPageSize) > 1 && (
            <div className="pagination">
              <span className="page-info">
                Page {childCurrentPage} of {getTotalPages(childLinks.length, childPageSize)}
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => setChildCurrentPage(Math.max(1, childCurrentPage - 1))}
                  disabled={childCurrentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setChildCurrentPage(Math.min(getTotalPages(childLinks.length, childPageSize), childCurrentPage + 1))
                  }
                  disabled={childCurrentPage === getTotalPages(childLinks.length, childPageSize)}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {itemLinks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Items</h3>
            <div className="section-controls">
              <label className="page-size-label">
                Per page:
                <select
                  value={itemPageSize}
                  onChange={(e) => {
                    setItemPageSize(Number(e.target.value));
                    setItemCurrentPage(1);
                  }}
                  className="page-size-select"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {getTotalPages(itemLinks.length, itemPageSize) > 1 && (
            <div className="pagination pagination-top">
              <span className="page-info">
                Page {itemCurrentPage} of {getTotalPages(itemLinks.length, itemPageSize)}
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => setItemCurrentPage(Math.max(1, itemCurrentPage - 1))}
                  disabled={itemCurrentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setItemCurrentPage(Math.min(getTotalPages(itemLinks.length, itemPageSize), itemCurrentPage + 1))
                  }
                  disabled={itemCurrentPage === getTotalPages(itemLinks.length, itemPageSize)}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          <div className="item-list">
            {getPaginatedData(itemLinks, itemCurrentPage, itemPageSize).map((link) => {
              const itemUrl = resolveHref(url, link.href);
              return (
                <a
                  key={link.href}
                  href={itemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="item-link"
                >
                  <span className="item-link-title">{link.title || 'Untitled Item'}</span>
                  <span className="item-link-icon">↗</span>
                </a>
              );
            })}
          </div>

          {getTotalPages(itemLinks.length, itemPageSize) > 1 && (
            <div className="pagination">
              <span className="page-info">
                Page {itemCurrentPage} of {getTotalPages(itemLinks.length, itemPageSize)}
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => setItemCurrentPage(Math.max(1, itemCurrentPage - 1))}
                  disabled={itemCurrentPage === 1}
                  className="pagination-button"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setItemCurrentPage(Math.min(getTotalPages(itemLinks.length, itemPageSize), itemCurrentPage + 1))
                  }
                  disabled={itemCurrentPage === getTotalPages(itemLinks.length, itemPageSize)}
                  className="pagination-button"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
