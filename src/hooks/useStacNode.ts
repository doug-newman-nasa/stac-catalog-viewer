import { useEffect, useState } from 'react';
import type { StacResource } from '../types/stac';
import { fetchStacResource } from '../lib/stac';
import { logger } from '../lib/logger';

interface UseStacNodeState {
  data: StacResource | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useStacNode(url: string): UseStacNodeState {
  const [data, setData] = useState<StacResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    logger.logInfo('Fetching STAC node', { url });
    try {
      const resource = await fetchStacResource(url);
      setData(resource);
      logger.logInfo('Successfully loaded STAC node', { url, type: resource.type });
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
