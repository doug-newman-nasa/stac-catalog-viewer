import { useState, useCallback } from 'react';
import type { StacCatalog } from '../types/stac';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import { searchCollections } from '../lib/collectionSearch';
import { logger } from '../lib/logger';

interface UseCollectionSearchState {
  results: StacCatalog[];
  loading: boolean;
  error: Error | null;
  numberMatched?: number;
  numberReturned?: number;
}

interface UseCollectionSearchActions {
  search: (baseUrl: string, params: CollectionSearchParams) => Promise<void>;
  clearResults: () => void;
  retry: () => Promise<void>;
}

interface UseCollectionSearchReturn extends UseCollectionSearchState, UseCollectionSearchActions {}

export function useCollectionSearch(): UseCollectionSearchReturn {
  const [state, setState] = useState<UseCollectionSearchState>({
    results: [],
    loading: false,
    error: null,
  });

  const [lastParams, setLastParams] = useState<{ baseUrl: string; params: CollectionSearchParams } | null>(
    null
  );

  const search = useCallback(async (baseUrl: string, params: CollectionSearchParams) => {
    setState({ results: [], loading: true, error: null });
    setLastParams({ baseUrl, params });

    logger.logInfo('Searching collections', { baseUrl, params });

    try {
      const result = await searchCollections(baseUrl, params);
      logger.logInfo('Collection search successful', {
        collectionCount: result.collections.length,
        numberMatched: result.numberMatched,
      });

      setState({
        results: result.collections,
        loading: false,
        error: null,
        numberMatched: result.numberMatched,
        numberReturned: result.numberReturned,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.logError('Collection search failed', error, { baseUrl, params });

      setState({
        results: [],
        loading: false,
        error,
      });
    }
  }, []);

  const clearResults = useCallback(() => {
    setState({ results: [], loading: false, error: null });
    setLastParams(null);
  }, []);

  const retry = useCallback(async () => {
    if (lastParams) {
      await search(lastParams.baseUrl, lastParams.params);
    }
  }, [lastParams, search]);

  return {
    ...state,
    search,
    clearResults,
    retry,
  };
}
