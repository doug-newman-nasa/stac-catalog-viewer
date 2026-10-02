import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildCollectionSearchParams,
  searchCollections,
  filterCollectionsByBbox,
  filterCollectionsByDatetime,
  filterCollectionsByText,
  sortCollections,
  selectFields,
  type CollectionSearchParams,
} from '../../src/lib/collectionSearch';
import type { StacCatalog } from '../../src/types/stac';

describe('Collection Search', () => {
  const mockCollection: StacCatalog = {
    type: 'Collection',
    stac_version: '1.0.0',
    id: 'sentinel-2',
    title: 'Sentinel-2 L2A',
    description: 'Sentinel-2 Level 2A processed data',
    links: [],
    keywords: ['sentinel', 'copernicus', 'esa', 'imagery'],
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
      temporal: {
        interval: [['2015-06-23', null]],
      },
    },
  };

  const mockCollection2: StacCatalog = {
    type: 'Collection',
    stac_version: '1.0.0',
    id: 'landsat-8',
    title: 'Landsat 8 Collection 2',
    description: 'Landsat 8 Collection 2 level 2 data',
    links: [],
    keywords: ['landsat', 'usgs', 'imagery'],
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
      temporal: {
        interval: [['2013-02-11', null]],
      },
    },
  };

  describe('buildCollectionSearchParams', () => {
    it('should build bbox parameter', () => {
      const params: CollectionSearchParams = {
        bbox: [-10, -10, 10, 10],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('bbox')).toBe('-10,-10,10,10');
    });

    it('should build datetime parameter', () => {
      const params: CollectionSearchParams = {
        datetime: '2020-01-01/2023-12-31',
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('datetime')).toBe('2020-01-01/2023-12-31');
    });

    it('should build limit parameter', () => {
      const params: CollectionSearchParams = {
        limit: 50,
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('limit')).toBe('50');
    });

    it('should build free-text search parameter', () => {
      const params: CollectionSearchParams = {
        q: 'sentinel imagery',
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('q')).toBe('sentinel imagery');
    });

    it('should build sort parameters', () => {
      const params: CollectionSearchParams = {
        sort: [
          { property: 'title', direction: 'asc' },
          { property: 'id', direction: 'desc' },
        ],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('sortby')).toBe('+title,-id');
    });

    it('should build all parameters together', () => {
      const params: CollectionSearchParams = {
        bbox: [0, 0, 10, 10],
        datetime: '2020-01-01/2023-12-31',
        limit: 25,
        q: 'test',
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('bbox')).toBe('0,0,10,10');
      expect(result.get('datetime')).toBe('2020-01-01/2023-12-31');
      expect(result.get('limit')).toBe('25');
      expect(result.get('q')).toBe('test');
    });

    it('should build filter parameter', () => {
      const params: CollectionSearchParams = {
        filter: "start_datetime >= '2020-01-01'",
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('filter')).toBe("start_datetime >= '2020-01-01'");
    });

    it('should build fields with included fields', () => {
      const params: CollectionSearchParams = {
        fields: [
          { property: 'id' },
          { property: 'title' },
        ],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('fields')).toBe('+id,+title');
    });

    it('should build fields with excluded fields', () => {
      const params: CollectionSearchParams = {
        fields: [
          { property: 'description', exclude: true },
          { property: 'keywords', exclude: true },
        ],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('fields')).toBe('-description,-keywords');
    });

    it('should build fields with both included and excluded (excluded overwrites)', () => {
      const params: CollectionSearchParams = {
        fields: [
          { property: 'id' },
          { property: 'title' },
          { property: 'description', exclude: true },
        ],
      };

      const result = buildCollectionSearchParams(params);
      // When both are present, excluded fields overwrites included (last one wins)
      expect(result.get('fields')).toBe('-description');
    });

    it('should not set fields if empty array', () => {
      const params: CollectionSearchParams = {
        fields: [],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('fields')).toBeNull();
    });

    it('should build sort with default ascending direction', () => {
      const params: CollectionSearchParams = {
        sort: [
          { property: 'title' },
        ],
      };

      const result = buildCollectionSearchParams(params);
      expect(result.get('sortby')).toBe('+title');
    });
  });

  describe('searchCollections', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch collections from API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          collections: [mockCollection],
          numberMatched: 1,
        }),
      });

      const result = await searchCollections('https://example.com/stac', {
        limit: 25,
      });

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].id).toBe('sentinel-2');
      expect(result.numberMatched).toBe(1);
    });

    it('should handle array response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [mockCollection, mockCollection2],
      });

      const result = await searchCollections('https://example.com/stac', {
        limit: 25,
      });

      expect(result.collections).toHaveLength(2);
    });

    it('should throw on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        searchCollections('https://example.com/stac', { limit: 25 })
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw on invalid response structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          collections: 'not an array',
        }),
      });

      await expect(
        searchCollections('https://example.com/stac', { limit: 25 })
      ).rejects.toThrow('Invalid collection search response');
    });
  });

  describe('filterCollectionsByBbox', () => {
    it('should filter collections by bounding box', () => {
      const collections = [mockCollection, mockCollection2];
      const bbox: [number, number, number, number] = [-90, -45, 90, 45];

      const result = filterCollectionsByBbox(collections, bbox);
      expect(result).toHaveLength(2);
    });

    it('should exclude collections outside bbox', () => {
      const collection = {
        ...mockCollection,
        extent: {
          ...mockCollection.extent,
          spatial: {
            bbox: [[0, 0, 10, 10]],
          },
        },
      };

      const bbox: [number, number, number, number] = [-90, -90, -50, -50];
      const result = filterCollectionsByBbox([collection], bbox);

      expect(result).toHaveLength(0);
    });

    it('should handle missing spatial extent', () => {
      const collection = {
        ...mockCollection,
        extent: {
          ...mockCollection.extent,
          spatial: {
            bbox: [],
          },
        },
      };

      const bbox: [number, number, number, number] = [0, 0, 10, 10];
      const result = filterCollectionsByBbox([collection], bbox);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterCollectionsByDatetime', () => {
    it('should filter collections by date range', () => {
      const collections = [mockCollection, mockCollection2];
      const result = filterCollectionsByDatetime(collections, '2010-01-01/2024-12-31');

      expect(result).toHaveLength(2);
    });

    it('should exclude collections outside date range', () => {
      const collection = {
        ...mockCollection,
        extent: {
          ...mockCollection.extent,
          temporal: {
            interval: [['2000-01-01', '2005-12-31']],
          },
        },
      };

      const result = filterCollectionsByDatetime([collection], '2010-01-01/2024-12-31');
      expect(result).toHaveLength(0);
    });

    it('should handle open-ended ranges', () => {
      const result = filterCollectionsByDatetime([mockCollection], '2010-01-01/');
      expect(result).toHaveLength(1);
    });

    it('should handle missing temporal extent', () => {
      const collection = {
        ...mockCollection,
        extent: {
          ...mockCollection.extent,
          temporal: {
            interval: [],
          },
        },
      };

      const result = filterCollectionsByDatetime([collection], '2010-01-01/2024-12-31');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterCollectionsByText', () => {
    it('should filter collections by title', () => {
      const collections = [mockCollection, mockCollection2];
      const result = filterCollectionsByText(collections, 'sentinel');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sentinel-2');
    });

    it('should filter collections by description', () => {
      const collections = [mockCollection, mockCollection2];
      const result = filterCollectionsByText(collections, 'level 2a');

      expect(result).toHaveLength(1);
    });

    it('should filter collections by keywords', () => {
      const collections = [mockCollection, mockCollection2];
      const result = filterCollectionsByText(collections, 'usgs');

      expect(result).toHaveLength(1);
    });

    it('should be case-insensitive', () => {
      const collections = [mockCollection];
      const result = filterCollectionsByText(collections, 'SENTINEL');

      expect(result).toHaveLength(1);
    });

    it('should not match non-existent terms', () => {
      const collections = [mockCollection, mockCollection2];
      const result = filterCollectionsByText(collections, 'modis');

      expect(result).toHaveLength(0);
    });
  });

  describe('sortCollections', () => {
    it('should sort by title ascending', () => {
      const collections = [mockCollection2, mockCollection];
      const result = sortCollections(collections, [
        { property: 'title', direction: 'asc' },
      ]);

      expect(result[0].id).toBe('landsat-8');
      expect(result[1].id).toBe('sentinel-2');
    });

    it('should sort by title descending', () => {
      const collections = [mockCollection, mockCollection2];
      const result = sortCollections(collections, [
        { property: 'title', direction: 'desc' },
      ]);

      expect(result[0].id).toBe('sentinel-2');
      expect(result[1].id).toBe('landsat-8');
    });

    it('should handle multiple sort keys', () => {
      const collection3 = { ...mockCollection, id: 'sentinel-3', title: 'Landsat' };
      const collections = [collection3, mockCollection2, mockCollection];

      const result = sortCollections(collections, [
        { property: 'title', direction: 'asc' },
        { property: 'id', direction: 'asc' },
      ]);

      // Sort by title first: 'Landsat' < 'Landsat 8...' < 'Sentinel-2...'
      // collection3 has title 'Landsat', mockCollection2 has 'Landsat 8...'
      // Then by id: sentinel-3 < landsat-8
      expect(result[0].id).toBe('sentinel-3');
      expect(result[1].id).toBe('landsat-8');
      expect(result[2].id).toBe('sentinel-2');
    });

    it('should return original array if no sort specified', () => {
      const collections = [mockCollection2, mockCollection];
      const result = sortCollections(collections, []);

      expect(result).toEqual(collections);
    });

    it('should maintain order when all sort values are equal', () => {
      const collection1 = { ...mockCollection, id: 'a', title: 'Same Title' };
      const collection2 = { ...mockCollection, id: 'b', title: 'Same Title' };
      const collections = [collection1, collection2];

      const result = sortCollections(collections, [
        { property: 'title', direction: 'asc' },
      ]);

      // When titles are equal, should return 0 and maintain order
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('should use secondary sort key when primary is equal', () => {
      const collection1 = { ...mockCollection, id: 'z', title: 'Same Title' };
      const collection2 = { ...mockCollection, id: 'a', title: 'Same Title' };
      const collections = [collection1, collection2];

      const result = sortCollections(collections, [
        { property: 'title', direction: 'asc' },
        { property: 'id', direction: 'asc' },
      ]);

      // Title equal, so sort by id ascending
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('z');
    });
  });

  describe('selectFields', () => {
    it('should include only specified fields', () => {
      const collections = [mockCollection];
      const result = selectFields(collections, [
        { property: 'id' },
        { property: 'title' },
      ]);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).not.toHaveProperty('description');
    });

    it('should exclude specified fields', () => {
      const collections = [mockCollection];
      const result = selectFields(collections, [
        { property: 'description', exclude: true },
        { property: 'keywords', exclude: true },
      ]);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).not.toHaveProperty('description');
      expect(result[0]).not.toHaveProperty('keywords');
    });

    it('should return all fields if none specified', () => {
      const collections = [mockCollection];
      const result = selectFields(collections, []);

      expect(Object.keys(result[0])).toContain('id');
      expect(Object.keys(result[0])).toContain('title');
    });
  });
});
