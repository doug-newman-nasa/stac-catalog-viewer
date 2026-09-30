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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 2));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 2));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items', 25));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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
      ({ href }) => useStacItemsSearch(href),
      { initialProps: { href: 'https://example.com/items1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    rerender({ href: 'https://example.com/items2' });

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

    const { result } = renderHook(() => useStacItemsSearch('https://example.com/items'));

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
});
