import { useState, useEffect } from 'react';
import { useCollectionSearch } from '../hooks/useCollectionSearch';
import { CollectionSearch } from '../components/CollectionSearch';
import { resolveHref } from '../lib/stac';
import { getPaginatedData, getTotalPages } from '../lib/pagination';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import type { StacCatalog } from '../types/stac';
import '../styles/CatalogPage.css';

interface CollectionSearchResultsPageProps {
  url: string;
  onNavigateToCollection: (targetUrl: string, searchParams?: CollectionSearchParams) => void;
  onResultsChange: (hasResults: boolean) => void;
}

const RESULTS_PER_PAGE = 25;

export function CollectionSearchResultsPage({
  url,
  onNavigateToCollection,
  onResultsChange,
}: CollectionSearchResultsPageProps): JSX.Element {
  const [collectionSearchParams, setCollectionSearchParams] = useState<CollectionSearchParams>({});
  const [collectionSearchPage, setCollectionSearchPage] = useState(1);

  const searchState = useCollectionSearch();

  useEffect(() => {
    onResultsChange(searchState.results.length > 0);
  }, [searchState.results.length, onResultsChange]);

  const handleCollectionSelect = (collection: StacCatalog) => {
    const selfLink = collection.links?.find((link) => link.rel === 'self');
    const collectionUrl = selfLink ? resolveHref(url, selfLink.href) : `${url}/${collection.id}`;
    onNavigateToCollection(collectionUrl, collectionSearchParams);
  };

  const handleCollectionSearch = async (params: CollectionSearchParams) => {
    setCollectionSearchPage(1);
    await searchState.search(url, params);
  };

  const handleCollectionSearchClear = () => {
    setCollectionSearchParams({ limit: 25 });
    searchState.clearResults();
    setCollectionSearchPage(1);
  };

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

          {searchState.loading && (
            <div className="search-loading">
              <span className="spinner">⏳</span> Searching collections...
            </div>
          )}

          {!searchState.loading && searchState.results.length > 0 && (
            <>
              {getTotalPages(searchState.results.length, RESULTS_PER_PAGE) > 1 && (
                <div className="pagination pagination-top">
                  <span className="page-info">
                    Page {collectionSearchPage} of {getTotalPages(searchState.results.length, RESULTS_PER_PAGE)}
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
                          Math.min(getTotalPages(searchState.results.length, RESULTS_PER_PAGE), collectionSearchPage + 1)
                        )
                      }
                      disabled={collectionSearchPage === getTotalPages(searchState.results.length, RESULTS_PER_PAGE)}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              <div className="child-list">
                {getPaginatedData(
                  searchState.results,
                  collectionSearchPage,
                  RESULTS_PER_PAGE
                ).map((collection) => (
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

              {getTotalPages(searchState.results.length, RESULTS_PER_PAGE) > 1 && (
                <div className="pagination">
                  <span className="page-info">
                    Page {collectionSearchPage} of {getTotalPages(searchState.results.length, RESULTS_PER_PAGE)}
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
                          Math.min(getTotalPages(searchState.results.length, RESULTS_PER_PAGE), collectionSearchPage + 1)
                        )
                      }
                      disabled={collectionSearchPage === getTotalPages(searchState.results.length, RESULTS_PER_PAGE)}
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
    </>
  );
}
