import type { StacCatalog, StacLink, StacItemCollection } from '../types/stac';

export async function fetchStacCatalog(url: string): Promise<StacCatalog> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.type || !data.links) {
    throw new Error('Invalid STAC Catalog: missing type or links');
  }

  return data as StacCatalog;
}

export async function fetchItemCollection(url: string): Promise<StacItemCollection> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error('Invalid STAC ItemCollection: missing type or features');
  }

  return data as StacItemCollection;
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
    console.error('Failed to resolve href', { base, href }, e);
    return href;
  }
}
