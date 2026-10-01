import { describe, it, expect } from 'vitest';
import { getPaginatedData, getTotalPages, PAGE_SIZE_OPTIONS } from '../../src/lib/pagination';

describe('pagination', () => {
  describe('getPaginatedData', () => {
    it('should return correct slice for first page', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedData(items, 1, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return correct slice for middle page', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedData(items, 2, 3);
      expect(result).toEqual([4, 5, 6]);
    });

    it('should return partial slice for last page', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getPaginatedData(items, 4, 3);
      expect(result).toEqual([10]);
    });

    it('should return empty array if page is beyond total pages', () => {
      const items = [1, 2, 3];
      const result = getPaginatedData(items, 5, 3);
      expect(result).toEqual([]);
    });

    it('should return all items if page size is larger than total items', () => {
      const items = [1, 2, 3];
      const result = getPaginatedData(items, 1, 10);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should work with empty array', () => {
      const items: number[] = [];
      const result = getPaginatedData(items, 1, 10);
      expect(result).toEqual([]);
    });

    it('should work with generic types', () => {
      const items = [
        { id: 'a', name: 'Item A' },
        { id: 'b', name: 'Item B' },
        { id: 'c', name: 'Item C' },
      ];
      const result = getPaginatedData(items, 1, 2);
      expect(result).toEqual([
        { id: 'a', name: 'Item A' },
        { id: 'b', name: 'Item B' },
      ]);
    });
  });

  describe('getTotalPages', () => {
    it('should return 1 for items that fit in one page', () => {
      expect(getTotalPages(5, 10)).toBe(1);
    });

    it('should return correct page count for exact fit', () => {
      expect(getTotalPages(10, 5)).toBe(2);
    });

    it('should round up for partial last page', () => {
      expect(getTotalPages(10, 3)).toBe(4);
    });

    it('should return 0 for empty collection', () => {
      expect(getTotalPages(0, 10)).toBe(0);
    });

    it('should handle large numbers', () => {
      expect(getTotalPages(1000, 25)).toBe(40);
    });

    it('should handle page size of 1', () => {
      expect(getTotalPages(5, 1)).toBe(5);
    });
  });

  describe('PAGE_SIZE_OPTIONS', () => {
    it('should be an array of valid page size values', () => {
      expect(Array.isArray(PAGE_SIZE_OPTIONS)).toBe(true);
      expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100]);
    });
  });
});
