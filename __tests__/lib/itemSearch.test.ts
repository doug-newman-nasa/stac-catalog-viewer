import { describe, it, expect } from 'vitest';
import {
  buildItemSearchParams,
  applyItemSearchParams,
  isItemSearchParamsEmpty,
  itemSearchParamsToString,
  type ItemSearchParams,
} from '../../src/lib/itemSearch';

describe('Item Search', () => {
  describe('buildItemSearchParams', () => {
    it('should build query params from bbox', () => {
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
      };
      const result = buildItemSearchParams(params);
      expect(result.get('bbox')).toBe('-180,-90,180,90');
    });

    it('should build query params from datetime', () => {
      const params: ItemSearchParams = {
        datetime: '2020-01-01/2023-12-31',
      };
      const result = buildItemSearchParams(params);
      expect(result.get('datetime')).toBe('2020-01-01/2023-12-31');
    });

    it('should build query params from ids', () => {
      const params: ItemSearchParams = {
        ids: ['id1', 'id2', 'id3'],
      };
      const result = buildItemSearchParams(params);
      expect(result.get('ids')).toBe('id1,id2,id3');
    });

    it('should build query params from limit', () => {
      const params: ItemSearchParams = {
        limit: 50,
      };
      const result = buildItemSearchParams(params);
      expect(result.get('limit')).toBe('50');
    });

    it('should build query params from all parameters', () => {
      const params: ItemSearchParams = {
        bbox: [-120, -60, 120, 60],
        datetime: '2021-06-01/2021-12-31',
        ids: ['item-a', 'item-b'],
        limit: 100,
      };
      const result = buildItemSearchParams(params);
      expect(result.get('bbox')).toBe('-120,-60,120,60');
      expect(result.get('datetime')).toBe('2021-06-01/2021-12-31');
      expect(result.get('ids')).toBe('item-a,item-b');
      expect(result.get('limit')).toBe('100');
    });

    it('should not include empty ids array', () => {
      const params: ItemSearchParams = {
        ids: [],
      };
      const result = buildItemSearchParams(params);
      expect(result.get('ids')).toBeNull();
    });

    it('should return empty params for empty input', () => {
      const params: ItemSearchParams = {};
      const result = buildItemSearchParams(params);
      expect(result.toString()).toBe('');
    });

    it('should handle single start date', () => {
      const params: ItemSearchParams = {
        datetime: '2020-01-01/',
      };
      const result = buildItemSearchParams(params);
      expect(result.get('datetime')).toBe('2020-01-01/');
    });

    it('should handle single end date', () => {
      const params: ItemSearchParams = {
        datetime: '/2023-12-31',
      };
      const result = buildItemSearchParams(params);
      expect(result.get('datetime')).toBe('/2023-12-31');
    });
  });

  describe('applyItemSearchParams', () => {
    it('should apply bbox to URL', () => {
      const href = 'https://example.com/collections/items';
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
      };
      const result = applyItemSearchParams(href, params);
      expect(result).toContain('bbox=-180%2C-90%2C180%2C90');
    });

    it('should apply multiple params to URL', () => {
      const href = 'https://example.com/collections/items';
      const params: ItemSearchParams = {
        bbox: [-120, -60, 120, 60],
        datetime: '2021-01-01/2021-12-31',
        ids: ['id1', 'id2'],
        limit: 50,
      };
      const result = applyItemSearchParams(href, params);
      const url = new URL(result);
      expect(url.searchParams.get('bbox')).toBe('-120,-60,120,60');
      expect(url.searchParams.get('datetime')).toBe('2021-01-01/2021-12-31');
      expect(url.searchParams.get('ids')).toBe('id1,id2');
      expect(url.searchParams.get('limit')).toBe('50');
    });

    it('should preserve existing query params', () => {
      const href = 'https://example.com/collections/items?token=abc123';
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
      };
      const result = applyItemSearchParams(href, params);
      const url = new URL(result);
      expect(url.searchParams.get('token')).toBe('abc123');
      expect(url.searchParams.get('bbox')).toBe('-180,-90,180,90');
    });

    it('should override existing params with same name', () => {
      const href = 'https://example.com/collections/items?limit=10';
      const params: ItemSearchParams = {
        limit: 50,
      };
      const result = applyItemSearchParams(href, params);
      const url = new URL(result);
      expect(url.searchParams.get('limit')).toBe('50');
    });

    it('should handle empty search params', () => {
      const href = 'https://example.com/collections/items';
      const params: ItemSearchParams = {};
      const result = applyItemSearchParams(href, params);
      expect(result).toBe(href);
    });

    it('should handle invalid URL gracefully', () => {
      const href = 'not-a-valid-url';
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
      };
      const result = applyItemSearchParams(href, params);
      expect(result).toBe(href);
    });

    it('should handle empty href', () => {
      const href = '';
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
      };
      const result = applyItemSearchParams(href, params);
      expect(result).toBe('');
    });
  });

  describe('isItemSearchParamsEmpty', () => {
    it('should return true for empty params', () => {
      expect(isItemSearchParamsEmpty({})).toBe(true);
    });

    it('should return false when bbox is set', () => {
      expect(isItemSearchParamsEmpty({ bbox: [-180, -90, 180, 90] })).toBe(false);
    });

    it('should return false when bboxString is set', () => {
      expect(isItemSearchParamsEmpty({ bboxString: '-180,-90,180,90' })).toBe(false);
    });

    it('should return false when datetime is set', () => {
      expect(isItemSearchParamsEmpty({ datetime: '2020-01-01/2023-12-31' })).toBe(false);
    });

    it('should return false when ids is set', () => {
      expect(isItemSearchParamsEmpty({ ids: ['id1', 'id2'] })).toBe(false);
    });

    it('should return false when idsString is set', () => {
      expect(isItemSearchParamsEmpty({ idsString: 'id1,id2' })).toBe(false);
    });

    it('should return false when limit is set', () => {
      expect(isItemSearchParamsEmpty({ limit: 50 })).toBe(false);
    });

    it('should return true for empty ids array', () => {
      expect(isItemSearchParamsEmpty({ ids: [] })).toBe(true);
    });
  });

  describe('itemSearchParamsToString', () => {
    it('should serialize params to string', () => {
      const params: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
        datetime: '2020-01-01/2023-12-31',
        ids: ['id1', 'id2'],
        limit: 50,
      };
      const result = itemSearchParamsToString(params);
      const parsed = JSON.parse(result);
      expect(parsed.bbox).toEqual([-180, -90, 180, 90]);
      expect(parsed.datetime).toBe('2020-01-01/2023-12-31');
      expect(parsed.ids).toEqual(['id1', 'id2']);
      expect(parsed.limit).toBe(50);
    });

    it('should serialize empty params', () => {
      const params: ItemSearchParams = {};
      const result = itemSearchParamsToString(params);
      const parsed = JSON.parse(result);
      expect(parsed.bbox).toBeUndefined();
      expect(parsed.datetime).toBeUndefined();
      expect(parsed.ids).toBeUndefined();
      expect(parsed.limit).toBeUndefined();
    });

    it('should produce stable strings for comparison', () => {
      const params1: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
        datetime: '2020-01-01/2023-12-31',
      };
      const params2: ItemSearchParams = {
        bbox: [-180, -90, 180, 90],
        datetime: '2020-01-01/2023-12-31',
      };
      expect(itemSearchParamsToString(params1)).toBe(itemSearchParamsToString(params2));
    });
  });
});
