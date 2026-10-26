import { useState, useRef } from 'react';
import type { StacCatalog } from '../types/stac';
import type { CollectionSearchParams, CollectionSearchResult } from '../lib/collectionSearch';
import { buildCollectionSearchUrl, fetchCollectionsPage } from '../lib/collectionSearch';
import { logger } from '../lib/logger';

interface UseCollectionSearchReturn {
  results: StacCatalog[];
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  loading: boolean;
  error: Error | null;
  search: (baseUrl: string, params: CollectionSearchParams) => Promise<void>;
  clearResults: () => void;
  goNext: () => Promise<void>;
  goPrevious: () => void;
  retry: () => Promise<void>;
}

export function useCollectionSearch(): UseCollectionSearchReturn {
  // Pages already fetched for the current search, so going back does not request them again
  const [pages, setPages] = useState<CollectionSearchResult[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Identifies the current search so that responses from an earlier search are ignored
  const searchIdRef = useRef(0);
  const firstPageUrlRef = useRef<string | null>(null);

  const handleError = (err: unknown, url: string) => {
    const error = err instanceof Error ? err : new Error(String(err));
    setError(error);
    logger.logError('Collection search failed', error, { url });
  };

  const loadFirstPage = async (url: string) => {
    const searchId = ++searchIdRef.current;
    firstPageUrlRef.current = url;

    setPages([]);
    setPageIndex(0);
    setLoading(true);
    setError(null);
    logger.logInfo('Searching collections', { url });

    try {
      const page = await fetchCollectionsPage(url);
      if (searchId === searchIdRef.current) {
        setPages([page]);
      }
    } catch (err) {
      if (searchId === searchIdRef.current) {
        handleError(err, url);
      }
    } finally {
      if (searchId === searchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const search = (baseUrl: string, params: CollectionSearchParams) =>
    loadFirstPage(buildCollectionSearchUrl(baseUrl, params));

  const clearResults = () => {
    searchIdRef.current++;
    firstPageUrlRef.current = null;
    setPages([]);
    setPageIndex(0);
    setLoading(false);
    setError(null);
  };

  const goNext = async () => {
    if (loading) return;

    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1);
      return;
    }

    // Only request the following server page when the user asks for it
    const nextUrl = pages[pages.length - 1]?.nextUrl;
    if (!nextUrl) return;

    const searchId = searchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchCollectionsPage(nextUrl);
      if (searchId === searchIdRef.current) {
        setPages((previous) => [...previous, page]);
        setPageIndex(pages.length);
      }
    } catch (err) {
      if (searchId === searchIdRef.current) {
        handleError(err, nextUrl);
      }
    } finally {
      if (searchId === searchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const goPrevious = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const retry = async () => {
    if (firstPageUrlRef.current) {
      await loadFirstPage(firstPageUrlRef.current);
    }
  };

  const lastPage = pages[pages.length - 1];

  return {
    results: pages[pageIndex]?.collections ?? [],
    page: pageIndex + 1,
    hasNext: pageIndex < pages.length - 1 || !!lastPage?.nextUrl,
    hasPrevious: pageIndex > 0,
    loading,
    error,
    search,
    clearResults,
    goNext,
    goPrevious,
    retry,
  };
}
