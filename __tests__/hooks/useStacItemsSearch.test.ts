import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStacItemsSearch } from '../../src/hooks/useStacItemsSearch';
import type { StacItemCollection } from '../../src/types/stac';

vi.stubGlobal('fetch', vi.fn());

describe('useStacItemsSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItemCollection: StacItemCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'item1',
        geometry: null,
        properties: {},
        links: [{ rel: 'self', href: 'https://example.com/item1' }],
      },
      {
        type: 'Feature',
        id: 'item2',
        geometry: null,
        properties: {},
        links: [{ rel: 'self', href: 'https://example.com/item2' }],
      },
    ],
    links: [
      { rel: 'self', href: 'https://example.com/items?limit=2' },
      { rel: 'next', href: 'https://example.com/items?limit=2&cursor=abc' },
    ],
    numberMatched: 100,
    numberReturned: 2,
  };

  const mockSecondPage: StacItemCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'item3',
        geometry: null,
        properties: {},
        links: [{ rel: 'self', href: 'https://example.com/item3' }],
      },
      {
        type: 'Feature',
        id: 'item4',
        geometry: null,
        properties: {},
        links: [{ rel: 'self', href: 'https://example.com/item4' }],
      },
    ],
    links: [
      { rel: 'self', href: 'https://example.com/items?limit=2&cursor=abc' },
      { rel: 'next', href: 'https://example.com/items?limit=2&cursor=def' },
    ],
    numberMatched: 100,
    numberReturned: 2,
  };

  const mockLastPage: StacItemCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'item5',
        geometry: null,
        properties: {},
        links: [{ rel: 'self', href: 'https://example.com/item5' }],
      },
    ],
    links: [
      { rel: 'self', href: 'https://example.com/items?limit=2&cursor=def' },
    ],
    numberMatched: 100,
    numberReturned: 1,
  };

  it('should initialize with null href and no data', () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch(null));

    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.hasNext).toBe(false);
    expect(result.current.hasPrevious).toBe(false);
  });

  it('should fetch items on mount with limit parameter', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItemCollection.features);
    expect(result.current.numberMatched).toBe(100);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('limit=25')
    );
  });

  it('should set hasNext when next link is present', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNext).toBe(true);
  });

  it('should set hasNext to false when no next link', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLastPage,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNext).toBe(false);
  });

  it('should fetch next page and cache it', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecondPage,
      } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 2, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItemCollection.features);
    expect(result.current.page).toBe(1);

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.items).toEqual(mockSecondPage.features);
    expect(result.current.page).toBe(2);
  });

  it('should navigate back to cached page without fetching', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecondPage,
      } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 2, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.goPrevious();
    });

    expect(result.current.items).toEqual(mockItemCollection.features);
    expect(result.current.page).toBe(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('should set hasPrevious correctly', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasPrevious).toBe(false);

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.hasPrevious).toBe(true);
  });

  it('should change page size and refetch with new limit', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pageSize).toBe(25);

    await act(async () => {
      result.current.setPageSize(50);
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.pageSize).toBe(50);
    expect(result.current.page).toBe(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('limit=50')
    );
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network error');
    vi.mocked(fetch).mockRejectedValue(error);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.items).toEqual([]);
  });

  it('should retry failed fetch', async () => {
    const error = new Error('Network error');
    vi.mocked(fetch)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    await act(async () => {
      result.current.retry();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual(mockItemCollection.features);
  });

  it('should refetch when href changes', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result, rerender } = renderHook(
      ({ href, shouldFetch }) => useStacItemsSearch(href, 25, {}, shouldFetch),
      { initialProps: { href: 'https://example.com/items1', shouldFetch: true } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    rerender({ href: 'https://example.com/items2', shouldFetch: true });

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    });
  });

  it('should not fetch when href is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch(null));

    expect(result.current.loading).toBe(false);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('should handle invalid response from goNext', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.error).not.toBeNull();
  });


  it('should not call goNext when currentPage is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch(null));

    expect(result.current.loading).toBe(false);

    const initialFetchCount = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.goNext();
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(initialFetchCount);
  });

  it('should not call goNext when there is no next link', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLastPage,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasNext).toBe(false);

    const initialFetchCount = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.goNext();
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(initialFetchCount);
  });

  it('should handle non-Error exceptions in fetchPage', async () => {
    vi.mocked(fetch).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('String error');
  });

  it('should handle non-Error exceptions in goNext', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response)
      .mockRejectedValueOnce('String error in goNext');

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.error?.message).toBe('String error in goNext');
  });

  it('should handle retry when itemsHref is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch(null));

    expect(result.current.loading).toBe(false);

    const initialFetchCount = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.retry();
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(initialFetchCount);
  });

  it('should not navigate previous on first page', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.page).toBe(1);

    await act(async () => {
      result.current.goPrevious();
    });

    expect(result.current.page).toBe(1);
  });

  it('should use cached page when navigating with goNext', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItemCollection,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecondPage,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLastPage,
      } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 2, {}, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstPageFetch = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.page).toBe(2);

    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.page).toBe(3);

    const secondPageFetch = vi.mocked(fetch).mock.calls.length;

    await act(async () => {
      result.current.goPrevious();
    });

    expect(result.current.page).toBe(2);
    expect(vi.mocked(fetch).mock.calls.length).toBe(secondPageFetch);
  });

  it('should apply search params to fetch URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() =>
      useStacItemsSearch('https://example.com/items', 25, {
        bbox: [-180, -90, 180, 90],
        datetime: '2020-01-01/2023-12-31',
      }, true)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('bbox=-180%2C-90%2C180%2C90');
    expect(fetchCall).toContain('datetime=2020-01-01%2F2023-12-31');
    expect(fetchCall).toContain('limit=25');
  });

  it('should apply ids search params to fetch URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() =>
      useStacItemsSearch('https://example.com/items', 25, {
        ids: ['item-1', 'item-2'],
      }, true)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('ids=item-1%2Citem-2');
  });

  it('should refetch from page 1 when search params change', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result, rerender } = renderHook(
      ({ searchParams, shouldFetch }) => useStacItemsSearch('https://example.com/items', 25, searchParams, shouldFetch),
      { initialProps: { searchParams: {}, shouldFetch: true } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.page).toBe(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    // Go to next page
    await act(async () => {
      result.current.goNext();
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    expect(result.current.page).toBe(2);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    // Change search params, should reset to page 1
    rerender({ searchParams: { bbox: [-180, -90, 180, 90] }, shouldFetch: true });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.page).toBe(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });

  it('should handle limit in search params separately from page size', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() =>
      useStacItemsSearch('https://example.com/items', 10, {
        limit: 50,
      }, true)
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    // Both search params limit and page size limit should be in the URL
    expect(fetchCall).toContain('limit=10');
  });

  it('should not fetch when shouldFetch is false', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25, {}, false));

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});
