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
    const searchParams = buildItemSearchParams(params);

    // Apply the search params to the URL
    for (const [key, value] of searchParams) {
      url.searchParams.set(key, value);
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
