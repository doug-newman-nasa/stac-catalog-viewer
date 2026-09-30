import { useEffect, useState } from 'react';
import type { StacItem, StacItemCollection } from '../types/stac';
import { fetchItemCollection, withLimit } from '../lib/stac';

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
  goNext: () => void;
  goPrevious: () => void;
  retry: () => void;
}

export function useStacItemsSearch(
  itemsHref: string | null,
  initialPageSize: number = 25
): UseStacItemsSearchState {
  const [pageCache, setPageCache] = useState<StacItemCollection[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const currentPage = pageCache[currentPageIndex];
  const items = currentPage?.features || [];
  const numberMatched = currentPage?.numberMatched;

  const fetchPage = async (href: string) => {
    setLoading(true);
    setError(null);
    try {
      const collection = await fetchItemCollection(withLimit(href, pageSize));
      setPageCache([collection]);
      setCurrentPageIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
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
  }, [itemsHref, pageSize]);

  const goNext = async () => {
    if (!currentPage || loading) return;

    const nextLink = currentPage.links.find((link) => link.rel === 'next');
    if (!nextLink) return;

    setLoading(true);
    setError(null);
    try {
      const nextCollection = await fetchItemCollection(nextLink.href);
      setPageCache([...pageCache, nextCollection]);
      setCurrentPageIndex(currentPageIndex + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
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
    goNext,
    goPrevious,
    retry: () => {
      if (itemsHref) {
        fetchPage(itemsHref);
      }
    },
  };
}
