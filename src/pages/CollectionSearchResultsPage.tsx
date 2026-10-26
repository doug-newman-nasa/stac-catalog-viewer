import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { useCollectionSearch } from '../hooks/useCollectionSearch';
import { CollectionSearch } from '../components/CollectionSearch';
import { resolveHref, getSearchLink } from '../lib/stac';
import { DEFAULT_PAGE_SIZE } from '../lib/pagination';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import type { StacCatalog } from '../types/stac';
import '../styles/CatalogPage.css';

interface CollectionSearchResultsPageProps {
  url: string;
  catalogData: StacCatalog;
  onNavigateToCollection: (targetUrl: string, searchParams?: CollectionSearchParams) => void;
  onResultsChange: (hasResults: boolean) => void;
}

export function CollectionSearchResultsPage({
  url,
  catalogData,
  onNavigateToCollection,
  onResultsChange,
}: CollectionSearchResultsPageProps): JSX.Element {
  const [collectionSearchParams, setCollectionSearchParams] = useState<CollectionSearchParams>({});

  const searchState = useCollectionSearch();
  const hasSearchSupport = !!getSearchLink(catalogData);

  useEffect(() => {
    onResultsChange(searchState.results.length > 0);
  }, [searchState.results.length, onResultsChange]);

  const handleCollectionSelect = (collection: StacCatalog) => {
    const selfLink = collection.links?.find((link) => link.rel === 'self');
    const collectionUrl = selfLink ? resolveHref(url, selfLink.href) : `${url}/${collection.id}`;
    onNavigateToCollection(collectionUrl, collectionSearchParams);
  };

  const handleCollectionSearch = async (params: CollectionSearchParams) => {
    await searchState.search(url, params);
  };

  const handleCollectionSearchClear = () => {
    setCollectionSearchParams({ limit: DEFAULT_PAGE_SIZE });
    searchState.clearResults();
  };

  if (!hasSearchSupport) {
    return <></>;
  }

  const renderPagination = (className: string) => (
    <div className={className}>
      <span className="page-info">Page {searchState.page}</span>
      <div className="pagination-controls">
        <button
          onClick={() => searchState.goPrevious()}
          disabled={!searchState.hasPrevious || searchState.loading}
          className="pagination-button"
        >
          ← Previous
        </button>
        <button
          onClick={() => searchState.goNext()}
          disabled={!searchState.hasNext || searchState.loading}
          className="pagination-button"
        >
          Next →
        </button>
      </div>
    </div>
  );

  return (
    <>
      <CollectionSearch
        searchParams={collectionSearchParams}
        onSearchParamsChange={setCollectionSearchParams}
        onSearch={handleCollectionSearch}
        onClearSearch={handleCollectionSearchClear}
        loading={searchState.loading}
        error={searchState.error}
      />

      {(searchState.results.length > 0 || searchState.loading) && (
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">Search Results</h3>
          </div>

          {searchState.loading && searchState.results.length === 0 && (
            <div className="search-loading">
              <span className="spinner">⏳</span> Searching collections...
            </div>
          )}

          {searchState.results.length > 0 && (
            <>
              {(searchState.hasPrevious || searchState.hasNext) && renderPagination('pagination pagination-top')}

              <div className="child-list">
                {searchState.results.map((collection) => (
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

              {(searchState.hasPrevious || searchState.hasNext) && renderPagination('pagination')}
            </>
          )}
        </div>
      )}
    </>
  );
}
