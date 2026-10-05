import { useEffect, useState } from 'react';
import type { StacItem, StacItemCollection } from '../types/stac';
import type { ItemSearchParams } from '../lib/itemSearch';
import { fetchItemCollection, withLimit } from '../lib/stac';
import { applyItemSearchParams, itemSearchParamsToString } from '../lib/itemSearch';
import { logger } from '../lib/logger';

interface UseStacItemsSearchState {
  items: StacItem[];
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  numberMatched?: number;
  supportsSearch: boolean;
  goNext: () => void;
  goPrevious: () => void;
  retry: () => void;
}

export function useStacItemsSearch(
  itemsHref: string | null,
  initialPageSize: number = 25,
  searchParams: ItemSearchParams = {}
): UseStacItemsSearchState {
  const [pageCache, setPageCache] = useState<StacItemCollection[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const currentPage = pageCache[currentPageIndex];
  const items = currentPage?.features || [];
  const numberMatched = currentPage?.numberMatched;
  const supportsSearch = numberMatched !== undefined;

  const fetchPage = async (href: string) => {
    setLoading(true);
    setError(null);
    // Apply user-entered search parameters (bbox, datetime, ids) on top of the items URL
    // The href may already contain query parameters from rel=items link - these are preserved
    const hrefWithSearchParams = applyItemSearchParams(href, searchParams);
    const url = withLimit(hrefWithSearchParams, pageSize);
    logger.logInfo('Fetching items page', { url, pageSize, searchParams });
    try {
      const collection = await fetchItemCollection(url);
      setPageCache([collection]);
      setCurrentPageIndex(0);
      logger.logInfo('Successfully loaded items page', { url, itemCount: collection.features.length });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.logError('Error fetching items page', error, { url, pageSize });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemsHref) {
      setPageCache([]);
      setCurrentPageIndex(0);
      setError(null);
      return;
    }

    fetchPage(itemsHref);
  }, [itemsHref, pageSize, itemSearchParamsToString(searchParams)]);

  const goNext = async () => {
    if (!currentPage || loading) return;

    const nextLink = currentPage.links.find((link) => link.rel === 'next');
    if (!nextLink) return;

    setLoading(true);
    setError(null);
    logger.logInfo('Going to next items page', { url: nextLink.href });
    try {
      const nextCollection = await fetchItemCollection(nextLink.href);
      setPageCache([...pageCache, nextCollection]);
      setCurrentPageIndex(currentPageIndex + 1);
      logger.logInfo('Successfully loaded next page', { url: nextLink.href, itemCount: nextCollection.features.length, newPage: currentPageIndex + 2 });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.logError('Error going to next page', error, { url: nextLink.href });
    } finally {
      setLoading(false);
    }
  };

  const goPrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const setPageSize = (size: number) => {
    setPageSizeState(size);
  };

  const hasNext = currentPage?.links.some((link) => link.rel === 'next') ?? false;
  const hasPrevious = currentPageIndex > 0;

  return {
    items,
    loading,
    error,
    page: currentPageIndex + 1,
    pageSize,
    setPageSize,
    hasNext,
    hasPrevious,
    numberMatched,
    supportsSearch,
    goNext,
    goPrevious,
    retry: () => {
      if (itemsHref) {
        fetchPage(itemsHref);
      }
    },
  };
}
