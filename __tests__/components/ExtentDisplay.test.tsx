import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExtentDisplay } from '../../src/components/ExtentDisplay';
import type { Extent } from '../../src/types/stac';

describe('ExtentDisplay', () => {
  it('should render nothing when no extent provided', () => {
    const { container } = render(<ExtentDisplay extent={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when extent is empty object', () => {
    const { container } = render(<ExtentDisplay extent={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render spatial extent with 4D bbox', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Spatial Extent')).toBeInTheDocument();
    expect(screen.getByText(/West: -180\.00°, South: -90\.00°, East: 180\.00°, North: 90\.00°/)).toBeInTheDocument();
  });

  it('should render spatial extent with 6D bbox', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 0, 180, 90, 1000]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Spatial Extent')).toBeInTheDocument();
    expect(screen.getByText(/Min Elev: 0\.00m, East: 180\.00°, North: 90\.00°, Max Elev: 1000\.00m/)).toBeInTheDocument();
  });

  it('should render multiple spatial extents', () => {
    const extent: Extent = {
      spatial: {
        bbox: [
          [-180, -90, 180, 90],
          [-10, -10, 10, 10],
        ],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Spatial Extent')).toBeInTheDocument();
    expect(screen.getByText(/West: -180\.00°/)).toBeInTheDocument();
    expect(screen.getByText(/West: -10\.00°/)).toBeInTheDocument();
  });

  it('should render temporal extent with start and end dates', () => {
    const extent: Extent = {
      temporal: {
        interval: [['2002-07-04T00:00:00Z', '2024-12-31T23:59:59Z']],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    expect(screen.getByText(/2002 to Dec 31, 2024/)).toBeInTheDocument();
  });

  it('should render temporal extent with open start date', () => {
    const extent: Extent = {
      temporal: {
        interval: [[null, '2024-12-31T23:59:59Z']],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    expect(screen.getByText(/Open to Dec 31, 2024/)).toBeInTheDocument();
  });

  it('should render temporal extent with ongoing end date', () => {
    const extent: Extent = {
      temporal: {
        interval: [['2002-07-04T00:00:00Z', null]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    expect(screen.getByText(/2002 to Ongoing/)).toBeInTheDocument();
  });

  it('should render temporal extent with both null dates', () => {
    const extent: Extent = {
      temporal: {
        interval: [[null, null]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    expect(screen.getByText(/Open to Ongoing/)).toBeInTheDocument();
  });

  it('should render multiple temporal intervals', () => {
    const extent: Extent = {
      temporal: {
        interval: [
          ['2002-07-04T00:00:00Z', '2010-12-31T23:59:59Z'],
          ['2015-01-01T00:00:00Z', '2024-12-31T23:59:59Z'],
        ],
      },
    };

    const { container } = render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    const items = container.querySelectorAll('.extent-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toMatch(/2002 to Dec 31, 2010/);
    expect(items[1].textContent).toMatch(/2015 to Dec 31, 2024/);
  });

  it('should render both spatial and temporal extents', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
      temporal: {
        interval: [['2002-07-04T00:00:00Z', null]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Spatial Extent')).toBeInTheDocument();
    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
    expect(screen.getByText(/West: -180\.00°/)).toBeInTheDocument();
    expect(screen.getByText(/2002 to Ongoing/)).toBeInTheDocument();
  });

  it('should only render spatial extent when temporal is undefined', () => {
    const extent: Extent = {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.getByText('Spatial Extent')).toBeInTheDocument();
    expect(screen.queryByText('Temporal Extent')).not.toBeInTheDocument();
  });

  it('should only render temporal extent when spatial is undefined', () => {
    const extent: Extent = {
      temporal: {
        interval: [['2002-07-04T00:00:00Z', null]],
      },
    };

    render(<ExtentDisplay extent={extent} />);

    expect(screen.queryByText('Spatial Extent')).not.toBeInTheDocument();
    expect(screen.getByText('Temporal Extent')).toBeInTheDocument();
  });

  it('should handle empty spatial bbox array', () => {
    const extent: Extent = {
      spatial: {
        bbox: [],
      },
    };

    const { container } = render(<ExtentDisplay extent={extent} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Spatial Extent')).not.toBeInTheDocument();
  });

  it('should handle empty temporal interval array', () => {
    const extent: Extent = {
      temporal: {
        interval: [],
      },
    };

    const { container } = render(<ExtentDisplay extent={extent} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Temporal Extent')).not.toBeInTheDocument();
  });
});
