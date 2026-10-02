import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStacCatalog, getChildLinks, getItemLinks, getItemsLink, getBrowseLinks, getBrowseAssets, getKeywords, withLimit, fetchItemCollection, resolveHref, getItemBrowseLinks, getItemBrowseAssets, getOtherLinks, getItemOtherLinks, getParentLink, isCatalog, isItemCollection, fetchStacResource } from '../../src/lib/stac';
import type { StacCatalog, StacItem } from '../../src/types/stac';

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
      ).rejects.toThrow(/Invalid STAC Catalog:.*The parent URL may not point to a STAC catalog/);
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

  describe('getKeywords', () => {
    it('should return keywords from catalog', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        keywords: ['climate', 'temperature', 'atmosphere'],
      };

      const result = getKeywords(catalog);
      expect(result).toEqual(['climate', 'temperature', 'atmosphere']);
    });

    it('should return empty array when no keywords', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
      };

      const result = getKeywords(catalog);
      expect(result).toEqual([]);
    });

    it('should return empty array when keywords is undefined', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        keywords: undefined,
      };

      const result = getKeywords(catalog);
      expect(result).toEqual([]);
    });

    it('should return single keyword', () => {
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        keywords: ['single-keyword'],
      };

      const result = getKeywords(catalog);
      expect(result).toEqual(['single-keyword']);
    });

    it('should preserve keyword order', () => {
      const keywords = ['z', 'a', 'm', 'b'];
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        keywords,
      };

      const result = getKeywords(catalog);
      expect(result).toEqual(keywords);
    });

    it('should handle special characters in keywords', () => {
      const keywords = ['sea-ice', 'CO2', 'soil_moisture', 'H2O'];
      const catalog: StacCatalog = {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
        keywords,
      };

      const result = getKeywords(catalog);
      expect(result).toEqual(keywords);
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

  describe('getItemBrowseLinks', () => {
    it('should return browse links from item', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        links: [
          { rel: 'browse', href: 'https://example.com/browse.png' },
          { rel: 'self', href: 'https://example.com/item.json' },
          { rel: 'preview', href: 'https://example.com/preview.jpg' },
        ],
      };

      const result = getItemBrowseLinks(item);
      expect(result).toHaveLength(2);
      expect(result[0].rel).toBe('browse');
      expect(result[1].rel).toBe('preview');
    });

    it('should return empty array if no browse links', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        links: [
          { rel: 'self', href: 'https://example.com/item.json' },
        ],
      };

      const result = getItemBrowseLinks(item);
      expect(result).toHaveLength(0);
    });

    it('should return empty array if no links', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
      };

      const result = getItemBrowseLinks(item);
      expect(result).toHaveLength(0);
    });
  });

  describe('getItemBrowseAssets', () => {
    it('should return image assets from item', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
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
          data: {
            href: 'https://example.com/data.tif',
            type: 'image/tiff; application=geotiff',
          },
        },
      };

      const result = getItemBrowseAssets(item);
      expect(result).toHaveLength(3);
      expect(result[0].href).toBe('https://example.com/thumb.jpg');
      expect(result[0].title).toBe('Thumbnail');
    });

    it('should filter out non-image assets', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        assets: {
          thumbnail: {
            href: 'https://example.com/thumb.jpg',
            type: 'image/jpeg',
          },
          metadata: {
            href: 'https://example.com/metadata.xml',
            type: 'application/xml',
          },
        },
      };

      const result = getItemBrowseAssets(item);
      expect(result).toHaveLength(1);
      expect(result[0].href).toBe('https://example.com/thumb.jpg');
    });

    it('should return empty array if no assets', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
      };

      const result = getItemBrowseAssets(item);
      expect(result).toHaveLength(0);
    });

    it('should recognize browse and thumbnail content types', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        assets: {
          browse: {
            href: 'https://example.com/browse.jpg',
            type: 'application/browse',
          },
          thumbnail: {
            href: 'https://example.com/thumb.jpg',
            type: 'application/thumbnail',
          },
        },
      };

      const result = getItemBrowseAssets(item);
      expect(result).toHaveLength(2);
    });
  });

  describe('getOtherLinks', () => {
    it('should filter out excluded rel types', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'self', href: 'https://example.com/self' },
          { rel: 'root', href: 'https://example.com/root' },
          { rel: 'parent', href: 'https://example.com/parent' },
          { rel: 'items', href: 'https://example.com/items' },
          { rel: 'via', href: 'https://example.com/via' },
          { rel: 'derived_from', href: 'https://example.com/derived' },
        ],
      };

      const result = getOtherLinks(catalog);

      expect(result).toHaveLength(2);
      expect(result[0].rel).toBe('via');
      expect(result[1].rel).toBe('derived_from');
    });

    it('should include other link types', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'child', href: 'https://example.com/child' },
          { rel: 'preview', href: 'https://example.com/preview' },
          { rel: 'alternate', href: 'https://example.com/alternate' },
        ],
      };

      const result = getOtherLinks(catalog);

      expect(result).toHaveLength(2);
      expect(result.map((l) => l.rel)).not.toContain('child');
      expect(result.map((l) => l.rel)).toContain('preview');
      expect(result.map((l) => l.rel)).toContain('alternate');
    });

    it('should handle empty link list', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [],
      };

      const result = getOtherLinks(catalog);

      expect(result).toHaveLength(0);
    });

    it('should handle links with only excluded types', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'self', href: 'https://example.com/self' },
          { rel: 'root', href: 'https://example.com/root' },
          { rel: 'parent', href: 'https://example.com/parent' },
          { rel: 'items', href: 'https://example.com/items' },
        ],
      };

      const result = getOtherLinks(catalog);

      expect(result).toHaveLength(0);
    });
  });

  describe('getParentLink', () => {
    it('should return parent link when present', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'child', href: 'https://example.com/child' },
          { rel: 'parent', href: 'https://example.com/parent', title: 'Parent Catalog' },
          { rel: 'self', href: 'https://example.com/self' },
        ],
      };

      const result = getParentLink(catalog);

      expect(result).toBeDefined();
      expect(result?.rel).toBe('parent');
      expect(result?.href).toBe('https://example.com/parent');
      expect(result?.title).toBe('Parent Catalog');
    });

    it('should return undefined when no parent link', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'child', href: 'https://example.com/child' },
          { rel: 'self', href: 'https://example.com/self' },
        ],
      };

      const result = getParentLink(catalog);

      expect(result).toBeUndefined();
    });

    it('should return parent link without title', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'parent', href: 'https://example.com/parent' },
        ],
      };

      const result = getParentLink(catalog);

      expect(result).toBeDefined();
      expect(result?.rel).toBe('parent');
      expect(result?.href).toBe('https://example.com/parent');
      expect(result?.title).toBeUndefined();
    });

    it('should return only the first parent link if multiple exist', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [
          { rel: 'parent', href: 'https://example.com/parent1' },
          { rel: 'parent', href: 'https://example.com/parent2' },
        ],
      };

      const result = getParentLink(catalog);

      expect(result?.href).toBe('https://example.com/parent1');
    });

    it('should handle empty link list', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [],
      };

      const result = getParentLink(catalog);

      expect(result).toBeUndefined();
    });
  });

  describe('getItemOtherLinks', () => {
    it('should filter out excluded rel types from item', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        links: [
          { rel: 'self', href: 'https://example.com/self' },
          { rel: 'root', href: 'https://example.com/root' },
          { rel: 'parent', href: 'https://example.com/parent' },
          { rel: 'items', href: 'https://example.com/items' },
          { rel: 'via', href: 'https://example.com/via' },
          { rel: 'alternate', href: 'https://example.com/alt' },
        ],
      };

      const result = getItemOtherLinks(item);

      expect(result).toHaveLength(2);
      expect(result[0].rel).toBe('via');
      expect(result[1].rel).toBe('alternate');
    });

    it('should handle item without links', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
      };

      const result = getItemOtherLinks(item);

      expect(result).toHaveLength(0);
    });

    it('should handle item with empty links array', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        links: [],
      };

      const result = getItemOtherLinks(item);

      expect(result).toHaveLength(0);
    });

    it('should include other link types from item', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
        links: [
          { rel: 'derived_from', href: 'https://example.com/derived' },
          { rel: 'via', href: 'https://example.com/via', type: 'application/json' },
        ],
      };

      const result = getItemOtherLinks(item);

      expect(result).toHaveLength(2);
      expect(result[0].rel).toBe('derived_from');
      expect(result[1].rel).toBe('via');
      expect(result[1].type).toBe('application/json');
    });
  });

  describe('isCatalog', () => {
    it('should identify a Catalog', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
      };
      expect(isCatalog(catalog)).toBe(true);
    });

    it('should identify a catalog without type field (some APIs omit it)', () => {
      const catalog = {
        id: 'test-catalog',
        description: 'Test',
        links: [{ rel: 'child', href: 'child.json' }],
      };
      expect(isCatalog(catalog as any)).toBe(true);
    });

    it('should identify a catalog without description', () => {
      const catalog = {
        type: 'Catalog',
        id: 'test-catalog',
        links: [{ rel: 'child', href: 'child.json' }],
      };
      expect(isCatalog(catalog as any)).toBe(true);
    });

    it('should reject a FeatureCollection', () => {
      const featureCollection: StacItemCollection = {
        type: 'FeatureCollection',
        features: [],
        links: [],
      };
      expect(isCatalog(featureCollection)).toBe(false);
    });

    it('should reject objects missing required fields', () => {
      expect(isCatalog({ type: 'Catalog' })).toBe(false); // no links or id
      expect(isCatalog({ links: [] })).toBe(false); // no id
      expect(isCatalog({ id: 'test' })).toBe(false); // no links
      expect(isCatalog({})).toBe(false);
      expect(isCatalog(null)).toBe(false);
      expect(isCatalog(undefined)).toBe(false);
    });

    it('should reject Feature items', () => {
      const feature = {
        type: 'Feature',
        id: 'test-feature',
        geometry: null,
        properties: {},
        links: [],
      };
      expect(isCatalog(feature as any)).toBe(false);
    });
  });

  describe('isItemCollection', () => {
    it('should identify a FeatureCollection with features and links', () => {
      const collection: StacItemCollection = {
        type: 'FeatureCollection',
        features: [],
        links: [],
      };
      expect(isItemCollection(collection)).toBe(true);
    });

    it('should reject a Catalog', () => {
      const catalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test',
        description: 'Test',
        links: [],
      };
      expect(isItemCollection(catalog)).toBe(false);
    });

    it('should reject objects missing features array', () => {
      const incomplete = {
        type: 'FeatureCollection',
        links: [],
      };
      expect(isItemCollection(incomplete as any)).toBe(false);
    });

    it('should reject objects missing links array', () => {
      const incomplete = {
        type: 'FeatureCollection',
        features: [],
      };
      expect(isItemCollection(incomplete as any)).toBe(false);
    });
  });

  describe('fetchStacResource', () => {
    it('should fetch and return a Catalog', async () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test catalog',
        links: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockCatalog,
      });

      const result = await fetchStacResource('https://example.com/catalog.json');
      expect(result).toEqual(mockCatalog);
      expect(isCatalog(result)).toBe(true);
    });

    it('should fetch and return a FeatureCollection', async () => {
      const mockCollection: StacItemCollection = {
        type: 'FeatureCollection',
        features: [],
        links: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => mockCollection,
      });

      const result = await fetchStacResource('https://example.com/collections.json');
      expect(result).toEqual(mockCollection);
      expect(isItemCollection(result)).toBe(true);
    });

    it('should throw error on invalid resource', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ id: 'test' }),
      });

      await expect(
        fetchStacResource('https://example.com/invalid.json')
      ).rejects.toThrow(/Invalid STAC resource/);
    });

    it('should treat response as catalog fallback if it has id and links', async () => {
      const fallbackCatalog = {
        id: 'test-catalog',
        links: [{ rel: 'child', href: 'child.json' }],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => fallbackCatalog,
      });

      const result = await fetchStacResource('https://example.com/fallback.json');
      expect(result).toEqual(fallbackCatalog);
    });

    it('should throw error on network failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fetchStacResource('https://example.com/notfound.json')
      ).rejects.toThrow('HTTP 404: Not Found');
    });
  });
});
