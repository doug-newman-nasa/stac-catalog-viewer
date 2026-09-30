import type { Extent } from '../types/stac';
import '../styles/ExtentDisplay.css';

interface ExtentDisplayProps {
  extent?: Extent;
}

function formatBBox(bbox: number[]): string {
  if (bbox.length === 4) {
    return `West: ${bbox[0].toFixed(2)}°, South: ${bbox[1].toFixed(2)}°, East: ${bbox[2].toFixed(2)}°, North: ${bbox[3].toFixed(2)}°`;
  }
  if (bbox.length === 6) {
    return `West: ${bbox[0].toFixed(2)}°, South: ${bbox[1].toFixed(2)}°, Min Elev: ${bbox[2].toFixed(2)}m, East: ${bbox[3].toFixed(2)}°, North: ${bbox[4].toFixed(2)}°, Max Elev: ${bbox[5].toFixed(2)}m`;
  }
  return bbox.map((v) => v.toFixed(2)).join(', ');
}

function formatTemporalRange(interval: (string | null)[]): string {
  const [start, end] = interval;
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };
  const startStr = start ? formatDate(start) : 'Open';
  const endStr = end ? formatDate(end) : 'Ongoing';
  return `${startStr} to ${endStr}`;
}

export function ExtentDisplay({ extent }: ExtentDisplayProps) {
  if (!extent || (!extent.spatial?.bbox?.length && !extent.temporal?.interval?.length)) {
    return null;
  }

  return (
    <div className="extent-display">
      {extent.spatial?.bbox && extent.spatial.bbox.length > 0 && (
        <div className="extent-section">
          <h4 className="extent-title">Spatial Extent</h4>
          <div className="extent-content">
            {extent.spatial.bbox.map((bbox, idx) => (
              <div key={idx} className="extent-item">
                {formatBBox(bbox)}
              </div>
            ))}
          </div>
        </div>
      )}

      {extent.temporal?.interval && extent.temporal.interval.length > 0 && (
        <div className="extent-section">
          <h4 className="extent-title">Temporal Extent</h4>
          <div className="extent-content">
            {extent.temporal.interval.map((interval, idx) => (
              <div key={idx} className="extent-item">
                {formatTemporalRange(interval)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
