import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStacCatalog, getChildLinks, getItemLinks, getItemsLink, getBrowseLinks, getBrowseAssets, withLimit, fetchItemCollection, resolveHref } from '../../src/lib/stac';
import type { StacCatalog } from '../../src/types/stac';

describe('stac utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchStacCatalog', () => {
    it('should fetch and return a valid STAC catalog', async () => {
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

      const result = await fetchStacCatalog('https://example.com/catalog.json');
      expect(result).toEqual(mockCatalog);
    });

    it('should throw error on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fetchStacCatalog('https://example.com/catalog.json')
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw error if response is missing required fields', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test' }),
      });

      await expect(
        fetchStacCatalog('https://example.com/catalog.json')
      ).rejects.toThrow('Invalid STAC Catalog: missing type or links');
    });
  });

  describe('getChildLinks', () => {
    it('should return only child links', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child1.json' },
          { rel: 'item', href: 'item1.json' },
          { rel: 'child', href: 'child2.json' },
          { rel: 'parent', href: 'parent.json' },
        ],
      };

      const result = getChildLinks(catalog);
      expect(result).toHaveLength(2);
      expect(result.every((link) => link.rel === 'child')).toBe(true);
    });

    it('should return empty array if no child links', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [{ rel: 'item', href: 'item.json' }],
      };

      const result = getChildLinks(catalog);
      expect(result).toHaveLength(0);
    });
  });

  describe('getItemLinks', () => {
    it('should return only item links', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child.json' },
          { rel: 'item', href: 'item1.json' },
          { rel: 'item', href: 'item2.json' },
        ],
      };

      const result = getItemLinks(catalog);
      expect(result).toHaveLength(2);
      expect(result.every((link) => link.rel === 'item')).toBe(true);
    });

    it('should return empty array if no item links', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [{ rel: 'child', href: 'child.json' }],
      };

      const result = getItemLinks(catalog);
      expect(result).toHaveLength(0);
    });
  });

  describe('resolveHref', () => {
    it('should resolve relative hrefs to absolute URLs', () => {
      const result = resolveHref('https://example.com/catalog/', 'child.json');
      expect(result).toBe('https://example.com/catalog/child.json');
    });

    it('should handle absolute URLs', () => {
      const result = resolveHref(
        'https://example.com/catalog/',
        'https://other.com/catalog.json'
      );
      expect(result).toBe('https://other.com/catalog.json');
    });

    it('should handle parent directory traversal', () => {
      const result = resolveHref(
        'https://example.com/catalog/subcatalog/',
        '../parent.json'
      );
      expect(result).toBe('https://example.com/catalog/parent.json');
    });

    it('should return href on resolution error', () => {
      const result = resolveHref('not a url', 'child.json');
      expect(result).toBe('child.json');
    });
  });

  describe('getItemsLink', () => {
    it('should return the items link when present', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child.json' },
          { rel: 'items', href: 'items.json' },
        ],
      };

      const result = getItemsLink(catalog);
      expect(result).toEqual({ rel: 'items', href: 'items.json' });
    });

    it('should return undefined when no items link', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [{ rel: 'child', href: 'child.json' }],
      };

      const result = getItemsLink(catalog);
      expect(result).toBeUndefined();
    });
  });

  describe('getBrowseLinks', () => {
    it('should return only preview links', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'preview', href: 'preview.jpg', type: 'image/jpeg' },
          { rel: 'item', href: 'item.json' },
          { rel: 'preview', href: 'preview2.jpg', type: 'image/jpeg' },
        ],
      };

      const result = getBrowseLinks(catalog);
      expect(result).toHaveLength(2);
      expect(result.every((link) => link.rel === 'preview')).toBe(true);
    });

    it('should return browse links', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'browse', href: 'browse.jpg', type: 'image/jpeg' },
          { rel: 'item', href: 'item.json' },
        ],
      };

      const result = getBrowseLinks(catalog);
      expect(result).toHaveLength(1);
      expect(result[0].rel).toBe('browse');
    });

    it('should return both preview and browse links', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'preview', href: 'preview.jpg', type: 'image/jpeg' },
          { rel: 'browse', href: 'browse.jpg', type: 'image/jpeg' },
          { rel: 'child', href: 'child.json' },
        ],
      };

      const result = getBrowseLinks(catalog);
      expect(result).toHaveLength(2);
      expect(result.some((link) => link.rel === 'preview')).toBe(true);
      expect(result.some((link) => link.rel === 'browse')).toBe(true);
    });

    it('should return empty array if no browse links', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child.json' },
          { rel: 'item', href: 'item.json' },
        ],
      };

      const result = getBrowseLinks(catalog);
      expect(result).toHaveLength(0);
    });

    it('should preserve link metadata', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [
          {
            rel: 'preview',
            href: 'preview.jpg',
            type: 'image/jpeg',
            title: 'True Color Preview',
          },
        ],
      };

      const result = getBrowseLinks(catalog);
      expect(result[0]).toEqual({
        rel: 'preview',
        href: 'preview.jpg',
        type: 'image/jpeg',
        title: 'True Color Preview',
      });
    });
  });

  describe('getBrowseAssets', () => {
    it('should return browse assets from catalog', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          thumbnail: {
            href: 'https://example.com/thumb.jpg',
            type: 'image/jpeg',
            title: 'Thumbnail',
          },
          preview: {
            href: 'https://example.com/preview.png',
            type: 'image/png',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result).toHaveLength(2);
      expect(result.some((asset) => asset.href === 'https://example.com/thumb.jpg')).toBe(true);
      expect(result.some((asset) => asset.href === 'https://example.com/preview.png')).toBe(true);
    });

    it('should filter assets by type', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          thumbnail: {
            href: 'https://example.com/thumb.jpg',
            type: 'image/jpeg',
          },
          data: {
            href: 'https://example.com/data.tif',
            type: 'image/tiff',
          },
          readme: {
            href: 'https://example.com/readme.txt',
            type: 'text/plain',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result.every((asset) => asset.href.includes('jpg') || asset.href.includes('tif'))).toBe(true);
    });

    it('should return empty array when no assets', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
      };

      const result = getBrowseAssets(catalog);
      expect(result).toEqual([]);
    });

    it('should return empty array when assets is undefined', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: undefined,
      };

      const result = getBrowseAssets(catalog);
      expect(result).toEqual([]);
    });

    it('should handle assets without type field', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          image: {
            href: 'https://example.com/image.jpg',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result).toHaveLength(0);
    });

    it('should accept assets with browse in type', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          browse: {
            href: 'https://example.com/browse.jpg',
            type: 'application/browse',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result).toHaveLength(1);
    });

    it('should accept assets with thumbnail in type', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          thumb: {
            href: 'https://example.com/thumb.jpg',
            type: 'image/thumbnail',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result).toHaveLength(1);
    });

    it('should use asset key as title when title is missing', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          browse_image: {
            href: 'https://example.com/browse.jpg',
            type: 'image/jpeg',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result[0].title).toBe('browse_image');
    });

    it('should preserve asset title when present', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          browse: {
            href: 'https://example.com/browse.jpg',
            type: 'image/jpeg',
            title: 'Browse Image',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result[0].title).toBe('Browse Image');
    });

    it('should handle multiple image type formats', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        assets: {
          jpeg: {
            href: 'https://example.com/image.jpg',
            type: 'image/jpeg',
          },
          png: {
            href: 'https://example.com/image.png',
            type: 'image/png',
          },
          gif: {
            href: 'https://example.com/image.gif',
            type: 'image/gif',
          },
          webp: {
            href: 'https://example.com/image.webp',
            type: 'image/webp',
          },
        },
      };

      const result = getBrowseAssets(catalog);
      expect(result).toHaveLength(4);
    });
  });

  describe('withLimit', () => {
    it('should add limit parameter to URL', () => {
      const result = withLimit('https://example.com/items', 25);
      expect(result).toBe('https://example.com/items?limit=25');
    });

    it('should update existing limit parameter', () => {
      const result = withLimit('https://example.com/items?limit=10', 50);
      expect(result).toBe('https://example.com/items?limit=50');
    });

    it('should preserve other query parameters', () => {
      const result = withLimit('https://example.com/items?cursor=abc&filter=x', 25);
      const url = new URL(result);
      expect(url.searchParams.get('limit')).toBe('25');
      expect(url.searchParams.get('cursor')).toBe('abc');
      expect(url.searchParams.get('filter')).toBe('x');
    });
  });

  describe('fetchItemCollection', () => {
    it('should fetch and return a valid item collection', async () => {
      const mockCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'item1',
            geometry: null,
            properties: {},
            links: [],
          },
        ],
        links: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCollection,
      });

      const result = await fetchItemCollection('https://example.com/items');
      expect(result).toEqual(mockCollection);
    });

    it('should throw error on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fetchItemCollection('https://example.com/items')
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw error if response is missing type', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [] }),
      });

      await expect(
        fetchItemCollection('https://example.com/items')
      ).rejects.toThrow('Invalid STAC ItemCollection: missing type or features');
    });

    it('should throw error if response is missing features', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'FeatureCollection' }),
      });

      await expect(
        fetchItemCollection('https://example.com/items')
      ).rejects.toThrow('Invalid STAC ItemCollection: missing type or features');
    });
  });
});
