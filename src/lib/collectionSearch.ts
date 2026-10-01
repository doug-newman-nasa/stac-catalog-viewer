import type { StacCatalog } from '../types/stac';
import { logger } from './logger';

export interface CollectionSearchParams {
  bbox?: [number, number, number, number]; // [west, south, east, north]
  bboxString?: string; // Raw bbox input string for display
  datetime?: string; // ISO 8601 interval: start/end, start/, /end, or single datetime
  limit?: number;
  q?: string; // Free-text search
  filter?: string; // CQL2 filter expression
  sort?: Array<{ property: string; direction?: 'asc' | 'desc' }>;
  fields?: Array<{ property: string; exclude?: boolean }>;
}

export interface CollectionSearchResult {
  collections: StacCatalog[];
  numberMatched?: number;
  numberReturned?: number;
}

/**
 * Build query parameters for collection search endpoint
 */
export function buildCollectionSearchParams(params: CollectionSearchParams): URLSearchParams {
  const queryParams = new URLSearchParams();

  if (params.bbox) {
    queryParams.set('bbox', params.bbox.join(','));
  }

  if (params.datetime) {
    queryParams.set('datetime', params.datetime);
  }

  if (params.limit) {
    queryParams.set('limit', String(params.limit));
  }

  if (params.q) {
    queryParams.set('q', params.q);
  }

  if (params.filter) {
    queryParams.set('filter', params.filter);
  }

  if (params.sort && params.sort.length > 0) {
    const sortString = params.sort
      .map((s) => `${s.direction === 'desc' ? '-' : '+'}${s.property}`)
      .join(',');
    queryParams.set('sortby', sortString);
  }

  if (params.fields && params.fields.length > 0) {
    const includedFields = params.fields
      .filter((f) => !f.exclude)
      .map((f) => f.property);
    const excludedFields = params.fields
      .filter((f) => f.exclude)
      .map((f) => f.property);

    if (includedFields.length > 0) {
      queryParams.set('fields', `+${includedFields.join(',+')}`);
    }
    if (excludedFields.length > 0) {
      queryParams.set('fields', `-${excludedFields.join(',-')}`);
    }
  }

  return queryParams;
}

/**
 * Fetch collections using the collection search extension
 */
export async function searchCollections(
  baseUrl: string,
  params: CollectionSearchParams
): Promise<CollectionSearchResult> {
  const queryParams = buildCollectionSearchParams(params);
  const url = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}collections?${queryParams.toString()}`;

  logger.logRequest('GET', url, { params });

  const startTime = performance.now();
  try {
    const response = await fetch(url);
    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logResponse(url, response.status, duration, { statusText: response.statusText });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logger.logResponse(url, response.status, duration, {
      type: typeof data,
      hasCollections: Array.isArray(data.collections),
      collectionCount: data.collections?.length || 0,
    });

    // Handle both array response and object response with collections property
    const collections = Array.isArray(data) ? data : data.collections || [];

    if (!Array.isArray(collections)) {
      throw new Error('Invalid collection search response: collections is not an array');
    }

    return {
      collections: collections as StacCatalog[],
      numberMatched: data.numberMatched,
      numberReturned: data.numberReturned || collections.length,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    if (error instanceof Error) {
      logger.logError('Error searching collections', error, { url, duration });
    }
    throw error;
  }
}

/**
 * Filter collections locally by bounding box
 */
export function filterCollectionsByBbox(
  collections: StacCatalog[],
  bbox: [number, number, number, number]
): StacCatalog[] {
  const [west, south, east, north] = bbox;

  return collections.filter((collection) => {
    const extent = collection.extent?.spatial?.bbox;
    if (!extent || extent.length === 0) {
      return false;
    }

    const [extWest, extSouth, extEast, extNorth] = extent[0];

    // Check if bboxes intersect
    return !(east < extWest || west > extEast || north < extSouth || south > extNorth);
  });
}

/**
 * Filter collections locally by datetime
 */
export function filterCollectionsByDatetime(
  collections: StacCatalog[],
  datetime: string
): StacCatalog[] {
  const [startStr, endStr] = datetime.split('/');
  const start = startStr ? new Date(startStr).getTime() : -Infinity;
  const end = endStr ? new Date(endStr).getTime() : Infinity;

  return collections.filter((collection) => {
    const intervals = collection.extent?.temporal?.interval;
    if (!intervals || intervals.length === 0) {
      return false;
    }

    const [intervalStart, intervalEnd] = intervals[0];
    const collStart = intervalStart ? new Date(intervalStart).getTime() : -Infinity;
    const collEnd = intervalEnd ? new Date(intervalEnd).getTime() : Infinity;

    // Check if date ranges overlap
    return !(end < collStart || start > collEnd);
  });
}

/**
 * Filter collections locally by free-text search
 */
export function filterCollectionsByText(
  collections: StacCatalog[],
  query: string
): StacCatalog[] {
  const lowerQuery = query.toLowerCase();

  return collections.filter((collection) => {
    const searchFields = [
      collection.id,
      collection.title,
      collection.description,
      collection.keywords?.join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchFields.includes(lowerQuery);
  });
}

/**
 * Sort collections by a property
 */
export function sortCollections(
  collections: StacCatalog[],
  sorts: Array<{ property: string; direction?: 'asc' | 'desc' }>
): StacCatalog[] {
  if (sorts.length === 0) {
    return collections;
  }

  const sorted = [...collections];

  sorted.sort((a, b) => {
    for (const sort of sorts) {
      const aVal = (a as any)[sort.property];
      const bVal = (b as any)[sort.property];

      if (aVal === bVal) {
        continue;
      }

      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'desc' ? -comparison : comparison;
    }
    return 0;
  });

  return sorted;
}

/**
 * Select specific fields from collections
 */
export function selectFields(
  collections: StacCatalog[],
  fields: Array<{ property: string; exclude?: boolean }>
): Partial<StacCatalog>[] {
  const includeFields = fields.filter((f) => !f.exclude).map((f) => f.property);
  const excludeFields = fields.filter((f) => f.exclude).map((f) => f.property);

  return collections.map((collection) => {
    if (includeFields.length > 0) {
      // Include only specified fields
      const result: any = {};
      for (const field of includeFields) {
        if (field in collection) {
          result[field] = (collection as any)[field];
        }
      }
      return result as Partial<StacCatalog>;
    } else if (excludeFields.length > 0) {
      // Exclude specified fields
      const result = { ...collection };
      for (const field of excludeFields) {
        delete (result as any)[field];
      }
      return result;
    }
    return collection;
  });
}
