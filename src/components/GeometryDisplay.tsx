import { useState } from 'react';
import '../styles/GeometryDisplay.css';

interface GeometryDisplayProps {
  geometry?: unknown;
  bbox?: number[];
}

export function GeometryDisplay({ geometry, bbox }: GeometryDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!geometry && !bbox) {
    return null;
  }

  const getBboxFromGeometry = (geom: unknown): number[] | null => {
    try {
      const g = geom as any;
      if (!g || typeof g !== 'object') return null;

      if (g.type === 'Point' && Array.isArray(g.coordinates)) {
        const [lon, lat] = g.coordinates;
        return [lon, lat, lon, lat];
      }

      if ((g.type === 'LineString' || g.type === 'MultiPoint') && Array.isArray(g.coordinates)) {
        const coords = g.coordinates.flat(1);
        const lons = coords.map((c: any) => c[0]);
        const lats = coords.map((c: any) => c[1]);
        return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
      }

      if ((g.type === 'Polygon' || g.type === 'MultiLineString') && Array.isArray(g.coordinates)) {
        const coords = g.coordinates.flat(2);
        const lons = coords.filter((_: any, i: number) => i % 2 === 0);
        const lats = coords.filter((_: any, i: number) => i % 2 === 1);
        return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
      }

      if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates)) {
        const coords = g.coordinates.flat(3);
        const lons = coords.filter((_: any, i: number) => i % 2 === 0);
        const lats = coords.filter((_: any, i: number) => i % 2 === 1);
        return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
      }
    } catch {
      return null;
    }
    return null;
  };

  const displayBbox = bbox || getBboxFromGeometry(geometry);
  const [west, south, east, north] = displayBbox || [0, 0, 0, 0];

  const getGeometryType = (geom: unknown): string | null => {
    try {
      const g = geom as any;
      return g?.type || null;
    } catch {
      return null;
    }
  };

  const geometryType = geometry ? getGeometryType(geometry) : null;
  const hasValidBbox = displayBbox && displayBbox.length >= 4;

  return (
    <div className="geometry-display">
      <button
        className="geometry-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="geometry-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="geometry-toggle-label">📍 Location</span>
      </button>

      {isExpanded && (
        <>
          <div className="geometry-section">
            {hasValidBbox && (
              <div className="bbox-info">
                <div className="bbox-grid">
                  <div className="bbox-item">
                    <span className="bbox-label">North:</span>
                    <span className="bbox-value">{north.toFixed(4)}°</span>
                  </div>
                  <div className="bbox-item">
                    <span className="bbox-label">South:</span>
                    <span className="bbox-value">{south.toFixed(4)}°</span>
                  </div>
                  <div className="bbox-item">
                    <span className="bbox-label">East:</span>
                    <span className="bbox-value">{east.toFixed(4)}°</span>
                  </div>
                  <div className="bbox-item">
                    <span className="bbox-label">West:</span>
                    <span className="bbox-value">{west.toFixed(4)}°</span>
                  </div>
                </div>
                <div className="bbox-coords">
                  [{west.toFixed(4)}, {south.toFixed(4)}, {east.toFixed(4)}, {north.toFixed(4)}]
                </div>
              </div>
            )}
            {geometryType && (
              <div className="geometry-type">
                <span className="geometry-type-label">Geometry Type:</span>
                <span className="geometry-type-value">{geometryType}</span>
              </div>
            )}
            {geometry !== undefined && (
              <details className="geometry-details">
                <summary className="geometry-summary">View GeoJSON</summary>
                <pre className="geometry-json">
                  {JSON.stringify(geometry, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </>
      )}
    </div>
  );
}
