import type { StacCatalog, StacLink, StacItemCollection, StacItem } from '../types/stac';
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
      const error = 'Invalid STAC Catalog: missing type or links';
      logger.logError('Invalid catalog response', error, { url, hasType: !!data.type, hasLinks: !!data.links });
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

export function getChildLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'child');
}

export function getItemLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'item');
}

export function getItemsLink(catalog: StacCatalog): StacLink | undefined {
  return catalog.links.find((link) => link.rel === 'items');
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

const EXCLUDED_LINK_RELS = ['self', 'root', 'parent', 'items'];

export function getOtherLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => !EXCLUDED_LINK_RELS.includes(link.rel));
}

export function getItemOtherLinks(item: StacItem): StacLink[] {
  return (item.links || []).filter((link) => !EXCLUDED_LINK_RELS.includes(link.rel));
}
