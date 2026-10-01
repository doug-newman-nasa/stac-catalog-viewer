import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useStacNode } from '../hooks/useStacNode';
import { useStacItemsSearch } from '../hooks/useStacItemsSearch';
import { getChildLinks, getItemLinks, getItemsLink, getBrowseLinks, getBrowseAssets, getKeywords, resolveHref } from '../lib/stac';
import { ExtentDisplay } from '../components/ExtentDisplay';
import { BrowseImagesDisplay } from '../components/BrowseImagesDisplay';
import { KeywordsDisplay } from '../components/KeywordsDisplay';
import { CollectionSearch } from '../components/CollectionSearch';
import { searchCollections } from '../lib/collectionSearch';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import type { StacCatalog } from '../types/stac';
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

  // Collection search state
  const [collectionSearchParams, setCollectionSearchParams] = useState<CollectionSearchParams>({ limit: 25 });
  const [collectionSearchResults, setCollectionSearchResults] = useState<StacCatalog[]>([]);
  const [collectionSearchLoading, setCollectionSearchLoading] = useState(false);
  const [collectionSearchError, setCollectionSearchError] = useState<Error | null>(null);
  const [collectionSearchPage, setCollectionSearchPage] = useState(1);

  const url = searchParams.get('url');

  const { data, loading, error, retry } = useStacNode(url || '');

  const itemsSearchLink = data ? getItemsLink(data) : undefined;
  const resolvedItemsHref = itemsSearchLink && url ? resolveHref(url, itemsSearchLink.href) : null;
  const itemsSearch = useStacItemsSearch(resolvedItemsHref, itemPageSize);

  const copyUrlToClipboard = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const handleCollectionSelect = (collection: any) => {
    if (url) {
      const selfLink = collection.links?.find((link: any) => link.rel === 'self');
      const collectionUrl = selfLink ? resolveHref(url, selfLink.href) : `${url}/${collection.id}`;
      navigate(`/catalog?url=${encodeURIComponent(collectionUrl)}`);
    }
  };

  const handleCollectionSearch = async (params: CollectionSearchParams) => {
    if (!url) return;

    setCollectionSearchLoading(true);
    setCollectionSearchError(null);
    setCollectionSearchPage(1);

    try {
      const result = await searchCollections(url, params);
      setCollectionSearchResults(result.collections);
    } catch (err) {
      setCollectionSearchError(err instanceof Error ? err : new Error(String(err)));
      setCollectionSearchResults([]);
    } finally {
      setCollectionSearchLoading(false);
    }
  };

  const handleCollectionSearchClear = () => {
    setCollectionSearchParams({ limit: 25 });
    setCollectionSearchResults([]);
    setCollectionSearchError(null);
    setCollectionSearchPage(1);
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
  const browseLinks = getBrowseLinks(data);
  const browseAssets = getBrowseAssets(data);
  const keywords = getKeywords(data);
  const browseImages = [
    ...browseLinks,
    ...browseAssets.map((asset) => ({
      rel: 'browse',
      href: asset.href,
      title: asset.title,
      type: asset.type,
    })),
  ];

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
        {data.extent && <ExtentDisplay extent={data.extent} />}
        {browseImages.length > 0 && <BrowseImagesDisplay images={browseImages} baseUrl={url} />}
        {keywords.length > 0 && <KeywordsDisplay keywords={keywords} />}
      </div>

      <CollectionSearch
        searchParams={collectionSearchParams}
        onSearchParamsChange={setCollectionSearchParams}
        onSearch={handleCollectionSearch}
        onClearSearch={handleCollectionSearchClear}
        loading={collectionSearchLoading}
        error={collectionSearchError}
      />

      {(collectionSearchResults.length > 0 || collectionSearchLoading) && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Search Results</h3>
            <div className="section-controls">
              <label className="page-size-label">
                Per page:
                <select
                  value={childPageSize}
                  onChange={(e) => {
                    setChildPageSize(Number(e.target.value));
                    setCollectionSearchPage(1);
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

          {collectionSearchLoading && (
            <div className="search-loading">
              <span className="spinner">⏳</span> Searching collections...
            </div>
          )}

          {!collectionSearchLoading && collectionSearchResults.length > 0 && (
            <>
              {getTotalPages(collectionSearchResults.length, childPageSize) > 1 && (
                <div className="pagination pagination-top">
                  <span className="page-info">
                    Page {collectionSearchPage} of {getTotalPages(collectionSearchResults.length, childPageSize)}
                  </span>
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCollectionSearchPage(Math.max(1, collectionSearchPage - 1))}
                      disabled={collectionSearchPage === 1}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() =>
                        setCollectionSearchPage(
                          Math.min(getTotalPages(collectionSearchResults.length, childPageSize), collectionSearchPage + 1)
                        )
                      }
                      disabled={collectionSearchPage === getTotalPages(collectionSearchResults.length, childPageSize)}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              <div className="child-list">
                {getPaginatedData(collectionSearchResults, collectionSearchPage, childPageSize).map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection)}
                    className="child-link"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="child-link-content">
                      <span className="child-link-title">{collection.title || collection.id}</span>
                    </div>
                    <span className="child-link-arrow">→</span>
                  </div>
                ))}
              </div>

              {getTotalPages(collectionSearchResults.length, childPageSize) > 1 && (
                <div className="pagination">
                  <span className="page-info">
                    Page {collectionSearchPage} of {getTotalPages(collectionSearchResults.length, childPageSize)}
                  </span>
                  <div className="pagination-controls">
                    <button
                      onClick={() => setCollectionSearchPage(Math.max(1, collectionSearchPage - 1))}
                      disabled={collectionSearchPage === 1}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() =>
                        setCollectionSearchPage(
                          Math.min(getTotalPages(collectionSearchResults.length, childPageSize), collectionSearchPage + 1)
                        )
                      }
                      disabled={collectionSearchPage === getTotalPages(collectionSearchResults.length, childPageSize)}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {collectionSearchResults.length === 0 && childLinks.length > 0 && (
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

      {(itemLinks.length > 0 || itemsSearchLink) && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Items</h3>
            <div className="section-controls">
              <label className="page-size-label">
                Per page:
                <select
                  value={itemPageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setItemPageSize(newSize);
                    if (itemsSearchLink) {
                      itemsSearch.setPageSize(newSize);
                    } else {
                      setItemCurrentPage(1);
                    }
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

          {itemsSearchLink ? (
            <>
              {itemsSearch.loading && (
                <div className="item-search-loading">
                  <span className="spinner">⏳</span> Loading items...
                </div>
              )}

              {itemsSearch.error && (
                <div className="item-search-error">
                  <p className="error-message">{itemsSearch.error.message}</p>
                  <button onClick={itemsSearch.retry} className="retry-button">
                    Retry
                  </button>
                </div>
              )}

              {!itemsSearch.loading && !itemsSearch.error && (
                <>
                  <div className="pagination pagination-top">
                    <span className="page-info">
                      Page {itemsSearch.page}
                      {itemsSearch.numberMatched && ` of ~${itemsSearch.numberMatched} items`}
                    </span>
                    <div className="pagination-controls">
                      <button
                        onClick={() => itemsSearch.goPrevious()}
                        disabled={!itemsSearch.hasPrevious}
                        className="pagination-button"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => itemsSearch.goNext()}
                        disabled={!itemsSearch.hasNext}
                        className="pagination-button"
                      >
                        Next →
                      </button>
                    </div>
                  </div>

                  <div className="item-list">
                    {itemsSearch.items.map((item) => {
                      const itemSelfLink = item.links?.find((link) => link.rel === 'self');
                      const itemUrl = itemSelfLink ? resolveHref(url, itemSelfLink.href) : undefined;
                      return (
                        <a
                          key={item.id}
                          href={itemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="item-link"
                        >
                          <span className="item-link-title">{item.id}</span>
                          <span className="item-link-icon">↗</span>
                        </a>
                      );
                    })}
                  </div>

                  <div className="pagination">
                    <span className="page-info">
                      Page {itemsSearch.page}
                      {itemsSearch.numberMatched && ` of ~${itemsSearch.numberMatched} items`}
                    </span>
                    <div className="pagination-controls">
                      <button
                        onClick={() => itemsSearch.goPrevious()}
                        disabled={!itemsSearch.hasPrevious}
                        className="pagination-button"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => itemsSearch.goNext()}
                        disabled={!itemsSearch.hasNext}
                        className="pagination-button"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
