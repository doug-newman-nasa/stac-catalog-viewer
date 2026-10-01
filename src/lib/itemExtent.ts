import type { Extent } from '../types/stac';
import type { StacItem } from '../types/stac';

export function extractItemExtent(item: StacItem): Extent | undefined {
  const extent: Extent = {};

  // Extract spatial extent from geometry
  if (item.geometry) {
    const bbox = extractBBoxFromGeometry(item.geometry);
    if (bbox) {
      extent.spatial = { bbox: [bbox] };
    }
  }

  // Extract temporal extent from properties.datetime
  if (item.properties && typeof item.properties.datetime === 'string') {
    const datetime = item.properties.datetime;
    extent.temporal = {
      interval: [[datetime, datetime]],
    };
  }

  return Object.keys(extent).length > 0 ? extent : undefined;
}

function extractBBoxFromGeometry(geometry: unknown): number[] | undefined {
  if (!geometry || typeof geometry !== 'object') {
    return undefined;
  }

  const geom = geometry as any;

  // Handle different geometry types
  if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
    const [lon, lat] = geom.coordinates;
    return [lon, lat, lon, lat]; // Point as bbox [west, south, east, north]
  }

  if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
    return calculateBBoxFromCoordinates(geom.coordinates);
  }

  if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
    // Polygon coordinates is an array of rings, we want the first ring (outer ring)
    return calculateBBoxFromCoordinates(geom.coordinates[0]);
  }

  if (geom.type === 'MultiPoint' && Array.isArray(geom.coordinates)) {
    return calculateBBoxFromCoordinates(geom.coordinates);
  }

  if (geom.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
    const allCoords = (geom.coordinates as any[]).flat();
    return calculateBBoxFromCoordinates(allCoords);
  }

  if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
    const allCoords = (geom.coordinates as any[]).flatMap((polygon) => polygon[0]);
    return calculateBBoxFromCoordinates(allCoords);
  }

  if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
    // Try to get bbox from the first geometry with one
    for (const g of geom.geometries) {
      const bbox = extractBBoxFromGeometry(g);
      if (bbox) return bbox;
    }
  }

  return undefined;
}

function calculateBBoxFromCoordinates(coords: Array<[number, number]>): number[] {
  if (!coords || coords.length === 0) {
    return undefined;
  }

  let minLon = coords[0][0];
  let maxLon = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];

  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return [minLon, minLat, maxLon, maxLat];
}
