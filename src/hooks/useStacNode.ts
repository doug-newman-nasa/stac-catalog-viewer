import { useEffect, useState } from 'react';
import type { StacCatalog } from '../types/stac';
import { fetchStacCatalog } from '../lib/stac';

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
    try {
      const catalog = await fetchStacCatalog(url);
      setData(catalog);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
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
