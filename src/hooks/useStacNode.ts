import { useEffect, useState } from 'react';
import type { StacCatalog } from '../types/stac';
import { fetchStacCatalog } from '../lib/stac';
import { logger } from '../lib/logger';

interface UseStacNodeState {
  data: StacCatalog | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useStacNode(url: string): UseStacNodeState {
  const [data, setData] = useState<StacCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    logger.logInfo('Fetching STAC node', { url });
    try {
      const catalog = await fetchStacCatalog(url);
      setData(catalog);
      logger.logInfo('Successfully loaded STAC node', { url, type: catalog.type });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.logError('Error in useStacNode hook', error, { url });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return {
    data,
    loading,
    error,
    retry: fetchData,
  };
}
