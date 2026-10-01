import { useState } from 'react';
import { useStacItemsSearch } from '../hooks/useStacItemsSearch';
import { ItemSearch } from '../components/ItemSearch';
import { resolveHref } from '../lib/stac';
import { applyItemSearchParams } from '../lib/itemSearch';
import { getTotalPages, PAGE_SIZE_OPTIONS, getPaginatedData } from '../lib/pagination';
import type { StacLink } from '../types/stac';
import type { ItemSearchParams } from '../lib/itemSearch';
import '../styles/CatalogPage.css';

interface CollectionItemsPageProps {
  url: string;
  itemLinks: StacLink[];
  itemsSearchLink: StacLink | undefined;
}

export function CollectionItemsPage({ url, itemLinks, itemsSearchLink }: CollectionItemsPageProps): JSX.Element {
  const [itemPageSize, setItemPageSize] = useState(25);
  const [itemCurrentPage, setItemCurrentPage] = useState(1);
  const [itemSearchParams, setItemSearchParams] = useState<ItemSearchParams>({});

  const resolvedItemsHref = itemsSearchLink && url ? resolveHref(url, itemsSearchLink.href) : null;
  const itemsSearch = useStacItemsSearch(resolvedItemsHref, itemPageSize, itemSearchParams);

  const handlePageSizeChange = (newSize: number) => {
    setItemPageSize(newSize);
    if (itemsSearchLink) {
      itemsSearch.setPageSize(newSize);
    } else {
      setItemCurrentPage(1);
    }
  };

  const handleItemSearch = (params: ItemSearchParams) => {
    setItemSearchParams(params);
  };

  const handleItemSearchClear = () => {
    setItemSearchParams({});
  };

  const handleItemSearchParamsChange = (params: ItemSearchParams) => {
    setItemSearchParams(params);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Items</h3>
        <div className="section-controls">
          {itemsSearchLink && url && (
            <a
              href={`${applyItemSearchParams(resolveHref(url, itemsSearchLink.href), itemSearchParams)}?limit=${itemPageSize}&offset=${(itemsSearch.page - 1) * itemPageSize}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-items-link"
              title="View items with current parameters"
            >
              View Items Endpoint ↗
            </a>
          )}
          <label className="page-size-label">
            Per page:
            <select
              value={itemPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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
          <ItemSearch
            searchParams={itemSearchParams}
            onSearchParamsChange={handleItemSearchParamsChange}
            onSearch={handleItemSearch}
            onClearSearch={handleItemSearchClear}
            loading={itemsSearch.loading}
            error={itemsSearch.error}
          />

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

          {!itemsSearch.loading && !itemsSearch.error && itemsSearch.items.length === 0 && (!itemsSearch.numberMatched || itemsSearch.numberMatched === 0) && (
            <div className="item-search-no-results">
              <p className="no-results-message">No items found</p>
            </div>
          )}

          {!itemsSearch.loading && !itemsSearch.error && (itemsSearch.items.length > 0 || (itemsSearch.numberMatched && itemsSearch.numberMatched > 0)) && (
            <>
              <div className="pagination pagination-top">
                <span className="page-info">
                  Page {itemsSearch.page}
                  {itemsSearch.numberMatched && itemsSearch.numberMatched > 0 && ` of ~${itemsSearch.numberMatched} items`}
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
                {itemsSearch.items.map((item) => (
                  <div key={item.id} className="item-link">
                    <span className="item-link-title">{item.id}</span>
                  </div>
                ))}
              </div>

              <div className="pagination">
                <span className="page-info">
                  Page {itemsSearch.page}
                  {itemsSearch.numberMatched && itemsSearch.numberMatched > 0 && ` of ~${itemsSearch.numberMatched} items`}
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
  );
}
