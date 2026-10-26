import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { fetchStacResource, getNextPageUrl, isCatalog, resolveHref, withLimit } from '../lib/stac';
import { DEFAULT_PAGE_SIZE, getPaginatedData, getTotalPages, PAGE_SIZE_OPTIONS } from '../lib/pagination';
import type { StacLink } from '../types/stac';
import '../styles/CatalogPage.css';

interface CatalogListingPageProps {
  url: string;
  childLinks: StacLink[];
  nextPageUrl?: string;
}

/**
 * Fetch one server page of child links. The server decides how many children each page holds.
 */
async function fetchChildLinksPage(url: string): Promise<{ links: StacLink[]; nextPageUrl?: string }> {
  const node = await fetchStacResource(url);
  if (!isCatalog(node)) {
    throw new Error('Expected a STAC catalog when loading more child catalogs');
  }
  return {
    links: node.links.filter((link) => link.rel === 'child'),
    nextPageUrl: getNextPageUrl(node.links, url),
  };
}

export function CatalogListingPage({ url, childLinks: firstPageChildLinks, nextPageUrl: firstPageNextUrl }: CatalogListingPageProps): JSX.Element {
  // Children are fetched from the server only when the user pages past what is already loaded
  const [loadedChildLinks, setLoadedChildLinks] = useState<StacLink[]>(firstPageChildLinks);
  const [nextPageUrl, setNextPageUrl] = useState<string | undefined>(firstPageNextUrl);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [childPageSize, setChildPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [childCurrentPage, setChildCurrentPage] = useState(1);
  // Identifies the most recent first-page request so that a superseded response is ignored
  const requestIdRef = useRef(0);

  const hasNext = childCurrentPage * childPageSize < loadedChildLinks.length || !!nextPageUrl;
  const hasPrevious = childCurrentPage > 1;

  const loadChildrenUpTo = async (requiredCount: number) => {
    let pageUrl = nextPageUrl;
    let links = loadedChildLinks;
    try {
      while (pageUrl && links.length < requiredCount) {
        const page = await fetchChildLinksPage(withLimit(pageUrl, childPageSize));
        const knownHrefs = new Set(links.map((link) => link.href));
        links = [...links, ...page.links.filter((link) => !knownHrefs.has(link.href))];
        pageUrl = page.nextPageUrl;
      }
      setLoadedChildLinks(links);
      setNextPageUrl(pageUrl);
      return true;
    } catch (err) {
      setLoadError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  // Re-request the first page so the server applies the new limit, then start again from page 1
  const reloadWithPageSize = async (pageSize: number) => {
    const requestId = ++requestIdRef.current;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const page = await fetchChildLinksPage(withLimit(url, pageSize));
      if (requestId === requestIdRef.current) {
        setLoadedChildLinks(page.links);
        setNextPageUrl(page.nextPageUrl);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setLoadError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  };

  const changePageSize = (pageSize: number) => {
    setChildPageSize(pageSize);
    setChildCurrentPage(1);
    reloadWithPageSize(pageSize);
  };

  const goToNextPage = async () => {
    if (loadingMore || !hasNext) return;

    const nextPage = childCurrentPage + 1;
    const requiredCount = nextPage * childPageSize;
    if (requiredCount > loadedChildLinks.length && nextPageUrl) {
      setLoadingMore(true);
      setLoadError(null);
      const loaded = await loadChildrenUpTo(requiredCount);
      setLoadingMore(false);
      if (!loaded) return;
    }
    setChildCurrentPage(nextPage);
  };

  const pageCount = getTotalPages(loadedChildLinks.length, childPageSize);

  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Child Catalogs</h3>
        <div className="section-controls">
          <label className="page-size-label">
            Per page:
            <select
              value={childPageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
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

      {(hasPrevious || hasNext) && (
        <div className="pagination pagination-top">
          <span className="page-info">
            {nextPageUrl ? `Page ${childCurrentPage}` : `Page ${childCurrentPage} of ${pageCount}`}
          </span>
          <div className="pagination-controls">
            <button
              onClick={() => setChildCurrentPage(Math.max(1, childCurrentPage - 1))}
              disabled={!hasPrevious || loadingMore}
              className="pagination-button"
            >
              ← Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={!hasNext || loadingMore}
              className="pagination-button"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {loadError && (
        <p className="error-message" role="alert">
          Could not load more child catalogs: {loadError.message}
        </p>
      )}

      <div className="child-list">
        {getPaginatedData(loadedChildLinks, childCurrentPage, childPageSize).map((link) => {
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

      {(hasPrevious || hasNext) && (
        <div className="pagination">
          <span className="page-info">
            {nextPageUrl ? `Page ${childCurrentPage}` : `Page ${childCurrentPage} of ${pageCount}`}
          </span>
          <div className="pagination-controls">
            <button
              onClick={() => setChildCurrentPage(Math.max(1, childCurrentPage - 1))}
              disabled={!hasPrevious || loadingMore}
              className="pagination-button"
            >
              ← Previous
            </button>
            <button
              onClick={goToNextPage}
              disabled={!hasNext || loadingMore}
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
