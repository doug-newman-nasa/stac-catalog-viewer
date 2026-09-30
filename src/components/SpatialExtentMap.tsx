import { MapContainer, TileLayer, Rectangle, Tooltip } from 'react-leaflet';
import type { Extent } from '../types/stac';
import '../styles/SpatialExtentMap.css';

interface SpatialExtentMapProps {
  extent?: Extent;
}

export function SpatialExtentMap({ extent }: SpatialExtentMapProps) {
  if (!extent?.spatial?.bbox?.length) {
    return null;
  }

  const bboxes = extent.spatial.bbox;

  const calculateBounds = () => {
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;

    bboxes.forEach((bbox) => {
      if (bbox.length >= 4) {
        minLon = Math.min(minLon, bbox[0]);
        minLat = Math.min(minLat, bbox[1]);
        maxLon = Math.max(maxLon, bbox[2]);
        maxLat = Math.max(maxLat, bbox[3]);
      }
    });

    return { minLat, maxLat, minLon, maxLon };
  };

  const { minLat, maxLat, minLon, maxLon } = calculateBounds();

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  const formatCoordinate = (value: number, type: 'lat' | 'lon'): string => {
    const abs = Math.abs(value);
    const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
    return `${abs.toFixed(2)}° ${direction}`;
  };

  return (
    <div className="spatial-extent-map">
      <h4 className="map-title">Spatial Extent Map</h4>
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={2}
        className="map-container"
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bboxes.map((bbox, idx) => {
          if (bbox.length < 4) return null;

          const south = bbox[1];
          const west = bbox[0];
          const north = bbox[3];
          const east = bbox[2];

          return (
            <Rectangle
              key={idx}
              bounds={[
                [south, west],
                [north, east],
              ]}
              pathOptions={{
                color: '#2196f3',
                weight: 2,
                opacity: 0.7,
                fillColor: '#2196f3',
                fillOpacity: 0.1,
              }}
            >
              <Tooltip>
                <div className="bbox-tooltip">
                  <div>{formatCoordinate(west, 'lon')} to {formatCoordinate(east, 'lon')}</div>
                  <div>{formatCoordinate(south, 'lat')} to {formatCoordinate(north, 'lat')}</div>
                </div>
              </Tooltip>
            </Rectangle>
          );
        })}
      </MapContainer>
    </div>
  );
}
