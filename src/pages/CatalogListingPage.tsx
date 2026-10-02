import { useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { resolveHref } from '../lib/stac';
import { getPaginatedData, getTotalPages, PAGE_SIZE_OPTIONS } from '../lib/pagination';
import type { StacLink } from '../types/stac';
import '../styles/CatalogPage.css';

interface CatalogListingPageProps {
  url: string;
  childLinks: StacLink[];
}

export function CatalogListingPage({ url, childLinks }: CatalogListingPageProps): JSX.Element {
  const [childPageSize, setChildPageSize] = useState(25);
  const [childCurrentPage, setChildCurrentPage] = useState(1);

  return (
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
  );
}
