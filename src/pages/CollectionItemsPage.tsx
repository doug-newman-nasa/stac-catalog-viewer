import { useState } from 'react';
import type { JSX } from 'react';
import { useStacItemsSearch } from '../hooks/useStacItemsSearch';
import { ItemSearch } from '../components/ItemSearch';
import { ExtentDisplay } from '../components/ExtentDisplay';
import { BrowseImagesDisplay } from '../components/BrowseImagesDisplay';
import { AssetLinks } from '../components/AssetLinks';
import { GeometryDisplay } from '../components/GeometryDisplay';
import { DatetimeDisplay } from '../components/DatetimeDisplay';
import { StorageDisplay } from '../components/StorageDisplay';
import { LinksDisplay } from '../components/LinksDisplay';
import { resolveHref, getItemBrowseLinks, getItemBrowseAssets, getItemOtherLinks } from '../lib/stac';
import { collectionSearchParamsToItemSearchParams } from '../lib/itemSearch';
import { extractItemExtent } from '../lib/itemExtent';
import { getTotalPages, getPaginatedData } from '../lib/pagination';
import type { StacLink } from '../types/stac';
import type { ItemSearchParams } from '../lib/itemSearch';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import '../styles/CatalogPage.css';

interface CollectionItemsPageProps {
  url: string;
  itemLinks: StacLink[];
  itemsSearchLink: StacLink | undefined;
  collectionSearchParams?: CollectionSearchParams;
}

export function CollectionItemsPage({ url, itemLinks, itemsSearchLink, collectionSearchParams }: CollectionItemsPageProps): JSX.Element {
  const itemPageSize = 25;
  const [itemCurrentPage, setItemCurrentPage] = useState(1);

  // Use rel=items link when available for item search/filter operations
  // The rel=items URL may already contain query parameters (bbox, datetime, etc.) which are preserved
  const resolvedItemsHref = itemsSearchLink && url ? resolveHref(url, itemsSearchLink.href) : null;

  // Initialize search params from collection search params AND any parameters already in the rel=items URL
  const [itemSearchParams, setItemSearchParams] = useState<ItemSearchParams>(() => {
    // Start with search params from collection search
    const params = collectionSearchParams ? collectionSearchParamsToItemSearchParams(collectionSearchParams) : {};

    // Extract any parameters that are already in the rel=items URL and preserve them if not in search params
    if (resolvedItemsHref) {
      try {
        const relItemsUrl = new URL(resolvedItemsHref);

        // Extract bbox if not already in search params
        if (!params.bbox) {
          const bboxStr = relItemsUrl.searchParams.get('bbox');
          if (bboxStr) {
            const bboxParts = bboxStr.split(',').map(Number);
            if (bboxParts.length === 4 && bboxParts.every(n => !isNaN(n))) {
              params.bbox = [bboxParts[0], bboxParts[1], bboxParts[2], bboxParts[3]] as [number, number, number, number];
            }
          }
        }

        // Extract datetime if not already in search params
        if (!params.datetime) {
          const datetimeStr = relItemsUrl.searchParams.get('datetime');
          if (datetimeStr) {
            params.datetime = datetimeStr;
          }
        }

        // Extract ids if not already in search params
        if (!params.ids || params.ids.length === 0) {
          const idsStr = relItemsUrl.searchParams.get('ids');
          if (idsStr) {
            params.ids = idsStr.split(',');
          }
        }
      } catch (e) {
        // If URL parsing fails, ignore and continue with existing params
      }
    }

    return params;
  });

  const itemsSearch = useStacItemsSearch(resolvedItemsHref, itemPageSize, itemSearchParams);

  const handleItemSearch = (params: ItemSearchParams) => {
    // Update search params, which triggers useStacItemsSearch hook to refetch
    // with the parameters applied to the rel=items URL
    setItemCurrentPage(1);
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
      </div>

      {itemsSearchLink ? (
        <>
          {itemsSearch.supportsSearch && (
            <ItemSearch
              searchParams={itemSearchParams}
              onSearchParamsChange={handleItemSearchParamsChange}
              onSearch={handleItemSearch}
              onClearSearch={handleItemSearchClear}
              loading={itemsSearch.loading}
              error={itemsSearch.error}
            />
          )}

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
                {itemsSearch.items.map((item) => {
                  const itemExtent = extractItemExtent(item);
                  const browseLinks = getItemBrowseLinks(item);
                  const browseAssets = getItemBrowseAssets(item);
                  const browseImages = [
                    ...browseLinks,
                    ...browseAssets.map((asset) => ({
                      rel: 'browse',
                      href: asset.href,
                      title: asset.title,
                      type: asset.type,
                    })),
                  ];
                  const datetime = item.properties?.datetime as string | null | undefined;
                  const startDatetime = item.properties?.start_datetime as string | null | undefined;
                  const endDatetime = item.properties?.end_datetime as string | null | undefined;

                  return (
                    <div key={item.id} className="item-card">
                      <div className="item-card-header">
                        <span className="item-link-title">{item.id}</span>
                      </div>
                      {(datetime || startDatetime || endDatetime) && (
                        <DatetimeDisplay
                          datetime={datetime}
                          startDatetime={startDatetime}
                          endDatetime={endDatetime}
                        />
                      )}
                      {(item.geometry || item.bbox) && <GeometryDisplay geometry={item.geometry} bbox={item.bbox} />}
                      {browseImages.length > 0 && <BrowseImagesDisplay images={browseImages} />}
                      {itemExtent && <ExtentDisplay extent={itemExtent} />}
                      {item.assets && <AssetLinks assets={item.assets as Record<string, any>} />}
                      <StorageDisplay data={item} />
                      <LinksDisplay links={getItemOtherLinks(item)} />
                    </div>
                  );
                })}
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
