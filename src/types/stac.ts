export interface StacLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
}

export interface StacCatalog {
  type: string;
  stac_version: string;
  id: string;
  title?: string;
  description: string;
  links: StacLink[];
  [key: string]: unknown;
}

export interface StacItem {
  type: string;
  id: string;
  geometry?: unknown;
  properties?: Record<string, unknown>;
  assets?: Record<string, unknown>;
  links?: StacLink[];
  [key: string]: unknown;
}

export interface StacItemCollection {
  type: 'FeatureCollection';
  features: StacItem[];
  links: StacLink[];
  numberMatched?: number;
  numberReturned?: number;
  [key: string]: unknown;
}
