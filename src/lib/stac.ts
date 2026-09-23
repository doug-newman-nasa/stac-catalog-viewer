import type { StacCatalog, StacLink } from '../types/stac';

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

export function getChildLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'child');
}

export function getItemLinks(catalog: StacCatalog): StacLink[] {
  return catalog.links.filter((link) => link.rel === 'item');
}

export function resolveHref(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch (e) {
    console.error('Failed to resolve href', { base, href }, e);
    return href;
  }
}
