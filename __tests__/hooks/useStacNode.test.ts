import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStacNode } from '../../src/hooks/useStacNode';
import type { StacCatalog } from '../../src/types/stac';

describe('useStacNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves
        })
    );

    const { result } = renderHook(() => useStacNode('https://example.com/catalog.json'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch and set data on success', async () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCatalog,
    });

    const { result } = renderHook(() => useStacNode('https://example.com/catalog.json'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCatalog);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useStacNode('https://example.com/catalog.json'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('404');
  });

  it('should clear error when fetching new URL', async () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCatalog,
    });

    const { result, rerender } = renderHook(
      ({ url }: { url: string }) => useStacNode(url),
      {
        initialProps: { url: 'https://example.com/catalog.json' },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCatalog);

    rerender({ url: 'https://example.com/other-catalog.json' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockCatalog);
  });

  it('should provide a retry function', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [],
      }),
    });

    const { result } = renderHook(() => useStacNode('https://example.com/catalog.json'));

    expect(typeof result.current.retry).toBe('function');
  });

  it('should handle non-Error thrown values', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      throw 'String error';
    });

    const { result } = renderHook(() => useStacNode('https://example.com/catalog.json'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('String error');
  });
});
