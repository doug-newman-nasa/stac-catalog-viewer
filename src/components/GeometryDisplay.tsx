import '../styles/GeometryDisplay.css';

interface GeometryDisplayProps {
  geometry?: unknown;
  bbox?: number[];
}

export function GeometryDisplay({ geometry, bbox }: GeometryDisplayProps) {
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
        const lons = coords.filter((_, i) => i % 2 === 0);
        const lats = coords.filter((_, i) => i % 2 === 1);
        return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
      }

      if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates)) {
        const coords = g.coordinates.flat(3);
        const lons = coords.filter((_, i) => i % 2 === 0);
        const lats = coords.filter((_, i) => i % 2 === 1);
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
      <div className="geometry-section">
        <h4 className="geometry-title">📍 Location</h4>
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
        {geometry && (
          <details className="geometry-details">
            <summary className="geometry-summary">View GeoJSON</summary>
            <pre className="geometry-json">
              {JSON.stringify(geometry, null, 2)}
            </pre>
          </details>
        )}
      </div>

      <svg
        className="bbox-map"
        viewBox="0 0 360 180"
        preserveAspectRatio="xMidYMid meet"
        title="Bounding box visualization"
      >
        <defs>
          <pattern id="latGrid" x="30" y="0" width="30" height="180" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="180" stroke="#ddd" strokeWidth="0.5" />
          </pattern>
          <pattern id="lonGrid" x="0" y="15" width="360" height="15" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="360" y2="0" stroke="#ddd" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="360" height="180" fill="#f0f4f8" />
        <rect width="360" height="180" fill="url(#latGrid)" />
        <rect width="360" height="180" fill="url(#lonGrid)" />

        <line x1="180" y1="0" x2="180" y2="180" stroke="#999" strokeWidth="1" strokeDasharray="2,2" />
        <line x1="0" y1="90" x2="360" y2="90" stroke="#999" strokeWidth="1" strokeDasharray="2,2" />

        {hasValidBbox && (
          <>
            <rect
              x={(west + 180) % 360}
              y={90 - north}
              width={Math.max(0.5, east - west)}
              height={Math.max(0.5, north - south)}
              fill="#6b5acd"
              fillOpacity="0.3"
              stroke="#6b5acd"
              strokeWidth="1"
            />
            <circle cx={(west + 180) % 360} cy={90 - north} r="2" fill="#6b5acd" />
            <circle cx={(east + 180) % 360} cy={90 - south} r="2" fill="#6b5acd" />
          </>
        )}

        <text x="5" y="15" fontSize="10" fill="#666">
          90°N
        </text>
        <text x="5" y="175" fontSize="10" fill="#666">
          90°S
        </text>
        <text x="350" y="95" fontSize="10" fill="#666" textAnchor="end">
          180°E
        </text>
        <text x="10" y="95" fontSize="10" fill="#666">
          180°W
        </text>
      </svg>
    </div>
  );
}
