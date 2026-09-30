import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpatialExtentMap } from '../../src/components/SpatialExtentMap';
import type { Extent } from '../../src/types/stac';

// Mock react-leaflet to avoid DOM/canvas requirements in tests
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, className }: any) => (
    <div className={className} data-testid="map-container">
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Rectangle: ({ children, pathOptions }: any) => (
    <div data-testid="rectangle" data-color={pathOptions.color}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));

describe('SpatialExtentMap', () => {
  it('should render nothing when no extent provided', () => {
    const { container } = render(<SpatialExtentMap extent={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when extent has no spatial data', () => {
    const extent: Extent = {
      temporal: {
        interval: [['2020-01-01', '2020-12-31']],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when spatial bbox is empty', () => {
    const extent: Extent = {
      spatial: {
        bbox: [],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render map with single bbox', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByText('Spatial Extent Map')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });

  it('should render map with multiple bboxes', () => {
    const extent: Extent = {
      spatial: {
        bbox: [
          [-180, -90, 180, 90],
          [-10, -10, 10, 10],
        ],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    const rectangles = container.querySelectorAll('[data-testid="rectangle"]');
    expect(rectangles).toHaveLength(2);
  });

  it('should render map title', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByText('Spatial Extent Map')).toHaveClass('map-title');
  });

  it('should render tooltip with coordinate information', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('should handle bbox with only 4 elements', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    expect(container.querySelector('[data-testid="rectangle"]')).toBeInTheDocument();
  });

  it('should ignore bbox with less than 4 elements', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10]],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    expect(container.querySelector('[data-testid="rectangle"]')).not.toBeInTheDocument();
  });

  it('should render with correct map styling', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    const mapContainer = container.querySelector('.spatial-extent-map');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should render rectangles with blue color', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    const rectangle = screen.getByTestId('rectangle');
    expect(rectangle).toHaveAttribute('data-color', '#2196f3');
  });

  it('should handle negative coordinates', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, -10, -45]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });

  it('should handle zero coordinates', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 0, 0]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });

  it('should render with spatial extent container', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    expect(container.querySelector('.spatial-extent-map')).toBeInTheDocument();
    expect(container.querySelector('.map-title')).toBeInTheDocument();
    expect(container.querySelector('.map-container')).toBeInTheDocument();
  });

  it('should handle multiple rectangles with different bounds', () => {
    const extent: Extent = {
      spatial: {
        bbox: [
          [-180, -90, 0, 0],
          [0, 0, 180, 90],
          [-45, -45, 45, 45],
        ],
      },
    };

    const { container } = render(<SpatialExtentMap extent={extent} />);

    const rectangles = container.querySelectorAll('[data-testid="rectangle"]');
    expect(rectangles).toHaveLength(3);
  });

  it('should render tile layer', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0, 0, 10, 10]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('should render with both extent and spatial data', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-10, -10, 10, 10]],
      },
      temporal: {
        interval: [['2020-01-01', '2020-12-31']],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByText('Spatial Extent Map')).toBeInTheDocument();
    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });

  it('should handle large coordinate values', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });

  it('should handle small regions', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[0.1, 0.1, 0.2, 0.2]],
      },
    };

    render(<SpatialExtentMap extent={extent} />);

    expect(screen.getByTestId('rectangle')).toBeInTheDocument();
  });
});
