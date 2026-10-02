import type { StacCatalog, StacLink, StacItemCollection, StacItem, StacResource } from '../types/stac';
import { logger } from './logger';

export async function fetchStacCatalog(url: string): Promise<StacCatalog> {
  const startTime = performance.now();
  logger.logRequest('GET', url);

  try {
    const response = await fetch(url);
    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logResponse(url, response.status, duration, { statusText: response.statusText });
      const error = `HTTP ${response.status}: ${response.statusText}`;
      logger.logError('Failed to fetch STAC catalog', error, { url });
      throw new Error(error);
    }

    const data = await response.json();
    logger.logResponse(url, response.status, duration, { dataType: typeof data });

    if (!data.type || !data.links) {
      const details = [];
      if (!data.type) details.push('missing "type"');
      if (!data.links) details.push('missing "links"');
      const error = `Invalid STAC Catalog: ${details.join(' and ')}. The parent URL may not point to a STAC catalog.`;
      logger.logError('Invalid catalog response', error, { url, hasType: !!data.type, hasLinks: !!data.links, dataKeys: Object.keys(data || {}) });
      throw new Error(error);
    }

    return data as StacCatalog;
  } catch (error) {
    const duration = performance.now() - startTime;
    if (error instanceof Error) {
      logger.logError('Error fetching STAC catalog', error, { url, duration });
    }
    throw error;
  }
}

export async function fetchItemCollection(url: string): Promise<StacItemCollection> {
  const startTime = performance.now();
  logger.logRequest('GET', url);

  try {
    const response = await fetch(url);
    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logResponse(url, response.status, duration, { statusText: response.statusText });
      const error = `HTTP ${response.status}: ${response.statusText}`;
      logger.logError('Failed to fetch item collection', error, { url });
      throw new Error(error);
    }

    const data = await response.json();
    logger.logResponse(url, response.status, duration, { dataType: typeof data, itemCount: data.features?.length || 0 });

    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      const error = 'Invalid STAC ItemCollection: missing type or features';
      logger.logError('Invalid item collection response', error, {
        url,
        hasType: !!data.type,
        hasFeatures: Array.isArray(data.features),
      });
      throw new Error(error);
    }

    return data as StacItemCollection;
  } catch (error) {
    const duration = performance.now() - startTime;
    if (error instanceof Error) {
      logger.logError('Error fetching item collection', error, { url, duration });
    }
    throw error;
  }
}

export function isCatalog(data: unknown): data is StacCatalog {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  // A catalog must have links and should have a type that's not FeatureCollection
  // Some implementations may have relaxed type validation
  const hasLinks = Array.isArray(obj.links);
  const isNotFeatureCollection = !obj.type || obj.type !== 'FeatureCollection';
  const notAnItem = obj.type !== 'Feature';

  return hasLinks && isNotFeatureCollection && notAnItem;
}

export function isItemCollection(data: unknown): data is StacItemCollection {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  // A FeatureCollection must have type, features array, and links
  return obj.type === 'FeatureCollection' && Array.isArray(obj.features) && Array.isArray(obj.links);
}

export async function fetchStacResource(url: string): Promise<StacResource> {
  const startTime = performance.now();
  logger.logRequest('GET', url);

  try {
    const response = await fetch(url);
    const duration = performance.now() - startTime;

    if (!response.ok) {
      logger.logResponse(url, response.status, duration, { statusText: response.statusText });
      const error = `HTTP ${response.status}: ${response.statusText}`;
      logger.logError('Failed to fetch STAC resource', error, { url });
      throw new Error(error);
    }

    let contentType = '';
    try {
      contentType = response.headers?.get('content-type') || '';
    } catch (e) {
      // headers might not be accessible in some contexts
    }
    const data = await response.json();
    logger.logResponse(url, response.status, duration, { dataType: typeof data, contentType });

    if (isCatalog(data)) {
      return data as StacCatalog;
    } else if (isItemCollection(data)) {
      return data as StacItemCollection;
    } else if (Array.isArray(data?.links)) {
      // Fallback: treat any object with 'links' array as a catalog
      // This handles non-compliant STAC implementations that may not have id or type
      logger.logInfo('Treating response as catalog fallback', { url, hasLinks: true });
      return data as StacCatalog;
    } else {
      const dataKeys = data && typeof data === 'object' ? Object.keys(data).slice(0, 10).join(', ') : 'N/A';
      const error = `Invalid STAC resource at ${url}. Expected a Catalog (with 'id' and 'links') or FeatureCollection (with 'type': 'FeatureCollection', 'features', and 'links'). Received fields: ${dataKeys}`;
      logger.logError('Invalid resource response', error, {
        url,
        hasType: !!data?.type,
        typeValue: data?.type,
        hasId: typeof data?.id === 'string',
        hasLinks: Array.isArray(data?.links),
        hasFeatures: Array.isArray(data?.features),
        dataKeys,
        contentType
      });
      throw new Error(error);
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    if (error instanceof Error) {
      logger.logError('Error fetching STAC resource', error, { url, duration });
    }
    throw error;
  }
}

export function getChildLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'child');
}

export function getItemLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'item');
}

export function getItemsLink(catalog: StacCatalog): StacLink | undefined {
  return catalog.links.find((link) => link.rel === 'items');
}

export function getSearchLink(catalog: StacCatalog | undefined): StacLink | undefined {
  if (!catalog) return undefined;
  return catalog.links.find((link) => link.rel === 'search' || link.rel === 'data');
}

export function getParentLink(catalog: StacCatalog): StacLink | undefined {
  return catalog.links.find((link) => link.rel === 'parent');
}

export function getBrowseLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'preview' || link.rel === 'browse');
}

export function getBrowseAssets(catalog: StacCatalog): Array<{ href: string; title?: string; type?: string }> {
  if (!catalog.assets) return [];
  return Object.entries(catalog.assets)
    .filter(([_, asset]) => {
      if (!asset.type) return false;
      return asset.type === 'image/jpeg' || asset.type === 'image/png' || asset.type === 'image/gif' || asset.type === 'image/webp' ||
             (asset.type && asset.type.startsWith('image/')) ||
             asset.type.includes('browse') ||
             asset.type.includes('thumbnail');
    })
    .map(([key, asset]) => ({
      href: asset.href,
      title: asset.title || key,
      type: asset.type,
    }));
}

export function getKeywords(catalog: StacCatalog): string[] {
  return catalog.keywords || [];
}

export function withLimit(href: string, limit: number): string {
  const url = new URL(href);
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export function resolveHref(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch (e) {
    logger.logError('Failed to resolve href', e instanceof Error ? e : new Error(String(e)), { base, href });
    return href;
  }
}

export function getItemBrowseLinks(item: StacItem): StacLink[] {
  return (item.links || []).filter((link) => link.rel === 'preview' || link.rel === 'browse');
}

export function getItemBrowseAssets(item: StacItem): Array<{ href: string; title?: string; type?: string }> {
  if (!item.assets) return [];
  return Object.entries(item.assets)
    .filter(([_, asset]) => {
      const assetObj = asset as any;
      if (!assetObj.type) return false;
      return assetObj.type === 'image/jpeg' || assetObj.type === 'image/png' || assetObj.type === 'image/gif' || assetObj.type === 'image/webp' ||
             (assetObj.type && assetObj.type.startsWith('image/')) ||
             assetObj.type.includes('browse') ||
             assetObj.type.includes('thumbnail');
    })
    .map(([key, asset]) => {
      const assetObj = asset as any;
      return {
        href: assetObj.href,
        title: assetObj.title || key,
        type: assetObj.type,
      };
    });
}

const EXCLUDED_LINK_RELS = ['self', 'root', 'parent', 'items', 'child', 'next', 'prev', 'data'];

export function getOtherLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => !EXCLUDED_LINK_RELS.includes(link.rel));
}

export function getItemOtherLinks(item: StacItem): StacLink[] {
  return (item.links || []).filter((link) => !EXCLUDED_LINK_RELS.includes(link.rel));
}
