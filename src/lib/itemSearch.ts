export interface ItemSearchParams {
  bbox?: [number, number, number, number]; // [west, south, east, north]
  bboxString?: string; // Raw bbox input string for display
  datetime?: string; // ISO 8601 interval: start/end, start/, /end, or single datetime
  ids?: string[]; // Item identifiers
  idsString?: string; // Raw comma-separated IDs input string for display
  limit?: number;
}

export function buildItemSearchParams(params: ItemSearchParams): URLSearchParams {
  const queryParams = new URLSearchParams();

  if (params.bbox) {
    queryParams.set('bbox', params.bbox.join(','));
  }

  if (params.datetime) {
    queryParams.set('datetime', params.datetime);
  }

  if (params.ids && params.ids.length > 0) {
    queryParams.set('ids', params.ids.join(','));
  }

  if (params.limit) {
    queryParams.set('limit', String(params.limit));
  }

  return queryParams;
}

export function applyItemSearchParams(href: string, params: ItemSearchParams): string {
  if (!href) return href;

  try {
    const url = new URL(href);

    // Only set parameters if they are explicitly provided by the user
    // If a parameter is provided in params, it overrides any existing value
    // If a parameter is NOT provided in params, preserve any existing value in the URL

    // Handle bbox - only override if user provided new bbox
    if (params.bbox) {
      url.searchParams.set('bbox', params.bbox.join(','));
    }

    // Handle datetime - only override if user provided new datetime
    if (params.datetime) {
      url.searchParams.set('datetime', params.datetime);
    }

    // Handle ids - only override if user provided new ids
    if (params.ids && params.ids.length > 0) {
      url.searchParams.set('ids', params.ids.join(','));
    }

    // Handle limit - only override if user provided new limit
    if (params.limit) {
      url.searchParams.set('limit', String(params.limit));
    }

    return url.toString();
  } catch (e) {
    // If URL parsing fails, return original href
    return href;
  }
}

export function isItemSearchParamsEmpty(params: ItemSearchParams): boolean {
  return (
    !params.bbox &&
    !params.bboxString &&
    !params.datetime &&
    (!params.ids || params.ids.length === 0) &&
    !params.idsString &&
    !params.limit
  );
}

export function itemSearchParamsToString(params: ItemSearchParams): string {
  return JSON.stringify({
    bbox: params.bbox,
    datetime: params.datetime,
    ids: params.ids,
    limit: params.limit,
  });
}

export function collectionSearchParamsToItemSearchParams(
  collectionParams: any // CollectionSearchParams type
): ItemSearchParams {
  return {
    bbox: collectionParams.bbox,
    bboxString: collectionParams.bboxString,
    datetime: collectionParams.datetime,
    limit: collectionParams.limit,
  };
}
