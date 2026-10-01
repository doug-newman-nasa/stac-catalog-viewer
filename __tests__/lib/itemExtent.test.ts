import { describe, it, expect } from 'vitest';
import { extractItemExtent } from '../../src/lib/itemExtent';
import type { StacItem } from '../../src/types/stac';

describe('itemExtent', () => {
  describe('extractItemExtent', () => {
    it('should extract extent from item with Point geometry and datetime', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'Point',
          coordinates: [-122.5, 37.5],
        },
        properties: {
          datetime: '2023-01-15T10:30:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.5, 37.5, -122.5, 37.5]]);
      expect(extent?.temporal?.interval).toEqual([['2023-01-15T10:30:00Z', '2023-01-15T10:30:00Z']]);
    });

    it('should extract extent from item with Polygon geometry', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-122.5, 37.5],
              [-122.0, 37.5],
              [-122.0, 38.0],
              [-122.5, 38.0],
              [-122.5, 37.5],
            ],
          ],
        },
        properties: {
          datetime: '2023-06-20T12:00:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.5, 37.5, -122.0, 38.0]]);
      expect(extent?.temporal?.interval).toEqual([['2023-06-20T12:00:00Z', '2023-06-20T12:00:00Z']]);
    });

    it('should extract extent from item with LineString geometry', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-122.0, 37.0],
            [-121.0, 38.0],
            [-120.0, 37.5],
          ],
        },
        properties: {
          datetime: '2023-03-10T08:00:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.0, 37.0, -120.0, 38.0]]);
      expect(extent?.temporal?.interval).toEqual([['2023-03-10T08:00:00Z', '2023-03-10T08:00:00Z']]);
    });

    it('should return undefined for item without geometry and datetime', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {},
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeUndefined();
    });

    it('should return extent with only spatial if no datetime', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'Point',
          coordinates: [-122.5, 37.5],
        },
        properties: {},
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.5, 37.5, -122.5, 37.5]]);
      expect(extent?.temporal).toBeUndefined();
    });

    it('should return extent with only temporal if no geometry', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {
          datetime: '2023-01-15T10:30:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial).toBeUndefined();
      expect(extent?.temporal?.interval).toEqual([['2023-01-15T10:30:00Z', '2023-01-15T10:30:00Z']]);
    });

    it('should handle MultiPolygon geometry', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [-122.5, 37.5],
                [-122.0, 37.5],
                [-122.0, 38.0],
                [-122.5, 38.0],
                [-122.5, 37.5],
              ],
            ],
            [
              [
                [-120.5, 36.5],
                [-120.0, 36.5],
                [-120.0, 37.0],
                [-120.5, 37.0],
                [-120.5, 36.5],
              ],
            ],
          ],
        },
        properties: {
          datetime: '2023-05-05T06:00:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.5, 36.5, -120.0, 38.0]]);
    });

    it('should handle null geometry gracefully', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: null,
        properties: {
          datetime: '2023-01-15T10:30:00Z',
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial).toBeUndefined();
      expect(extent?.temporal).toBeDefined();
    });

    it('should ignore invalid datetime format', () => {
      const item: StacItem = {
        type: 'Feature',
        id: 'test-item',
        geometry: {
          type: 'Point',
          coordinates: [-122.5, 37.5],
        },
        properties: {
          datetime: null,
        },
      };

      const extent = extractItemExtent(item);

      expect(extent).toBeDefined();
      expect(extent?.spatial?.bbox).toEqual([[-122.5, 37.5, -122.5, 37.5]]);
      expect(extent?.temporal).toBeUndefined();
    });
  });
});
