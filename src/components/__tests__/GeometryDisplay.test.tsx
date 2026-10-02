import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeometryDisplay } from '../GeometryDisplay';

describe('GeometryDisplay', () => {
  it('returns null when no geometry or bbox provided', () => {
    const { container } = render(<GeometryDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('displays toggle button', () => {
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('📍 Location');
  });

  it('starts collapsed by default', () => {
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);
    expect(screen.queryByText('North:')).not.toBeInTheDocument();
  });

  it('expands when toggle button clicked', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('North:')).toBeInTheDocument();
  });

  it('displays bbox coordinates when expanded', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[10, 20, 30, 40]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText(/North:/)).toBeInTheDocument();
    expect(screen.getByText(/40\.0000°/)).toBeInTheDocument();
    expect(screen.getByText(/South:/)).toBeInTheDocument();
    expect(screen.getByText(/20\.0000°/)).toBeInTheDocument();
    expect(screen.getByText(/East:/)).toBeInTheDocument();
    expect(screen.getByText(/30\.0000°/)).toBeInTheDocument();
    expect(screen.getByText(/West:/)).toBeInTheDocument();
    expect(screen.getByText(/10\.0000°/)).toBeInTheDocument();
  });

  it('displays bbox array notation', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[10, 20, 30, 40]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('[10.0000, 20.0000, 30.0000, 40.0000]')).toBeInTheDocument();
  });

  it('extracts bbox from Point geometry', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'Point',
      coordinates: [15, 25],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Geometry Type:')).toBeInTheDocument();
    expect(screen.getByText('Point')).toBeInTheDocument();
  });

  it('extracts bbox from Polygon geometry', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'Polygon',
      coordinates: [
        [
          [10, 20],
          [30, 20],
          [30, 40],
          [10, 40],
          [10, 20],
        ],
      ],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Polygon')).toBeInTheDocument();
  });

  it('displays geometry type when present', async () => {
    const user = userEvent.setup();
    const geometry = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Geometry Type:')).toBeInTheDocument();
    expect(screen.getByText('LineString')).toBeInTheDocument();
  });

  it('displays collapsible GeoJSON view', async () => {
    const user = userEvent.setup();
    const geometry = { type: 'Point', coordinates: [10, 20] };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('View GeoJSON')).toBeInTheDocument();

    const details = screen.getByText('View GeoJSON').closest('details');
    expect(details).toBeInTheDocument();
  });

  it('shows arrow icon when collapsed', () => {
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('▶');
  });

  it('shows arrow icon when expanded', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(button).toHaveTextContent('▼');
  });

  it('toggles expand/collapse on button click', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);

    const button = screen.getByRole('button');

    // Initially collapsed
    expect(screen.queryByText('North:')).not.toBeInTheDocument();

    // Click to expand
    await user.click(button);
    expect(screen.getByText('North:')).toBeInTheDocument();

    // Click to collapse
    await user.click(button);
    expect(screen.queryByText('North:')).not.toBeInTheDocument();
  });

  it('extracts bbox from MultiLineString geometry', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'MultiLineString',
      coordinates: [
        [[0, 0], [10, 10]],
        [[20, 20], [30, 30]],
      ],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('MultiLineString')).toBeInTheDocument();
  });

  it('extracts bbox from MultiPolygon geometry', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        [[[20, 20], [30, 20], [30, 30], [20, 30], [20, 20]]],
      ],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('MultiPolygon')).toBeInTheDocument();
  });

  it('extracts bbox from MultiPoint geometry', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'MultiPoint',
      coordinates: [[10, 20], [30, 40]],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('MultiPoint')).toBeInTheDocument();
  });

  it('handles invalid geometry gracefully', async () => {
    const user = userEvent.setup();
    const geometry = { type: 'InvalidType', coordinates: [] };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    // Should still render without crashing
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles null geometry with valid bbox', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay geometry={null} bbox={[5, 15, 25, 35]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('North:')).toBeInTheDocument();
    expect(screen.queryByText('Geometry Type:')).not.toBeInTheDocument();
  });

  it('handles undefined geometry and bbox', () => {
    const { container } = render(<GeometryDisplay geometry={undefined} bbox={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles valid Point with coordinates', async () => {
    const user = userEvent.setup();
    const geometry = { type: 'Point', coordinates: [15, 25] };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Point')).toBeInTheDocument();
  });

  it('displays bbox with negative coordinates', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-180, -90, -120, -45]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('North:')).toBeInTheDocument();
    expect(screen.getByText('South:')).toBeInTheDocument();
    expect(screen.getByText('West:')).toBeInTheDocument();
    // Check for negative values in the bbox array
    const bboxArray = screen.getByText(/\[-180\.0000, -90\.0000, -120\.0000, -45\.0000\]/);
    expect(bboxArray).toBeInTheDocument();
  });

  it('handles bbox array notation with negative values', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-45, -60, 30, 75]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('[-45.0000, -60.0000, 30.0000, 75.0000]')).toBeInTheDocument();
  });

  it('handles GeometryCollection', async () => {
    const user = userEvent.setup();
    const geometry = {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Point', coordinates: [10, 20] },
        { type: 'LineString', coordinates: [[0, 0], [10, 10]] },
      ],
    };

    render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('GeometryCollection')).toBeInTheDocument();
  });

  it('handles non-object geometry', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay geometry="not an object" />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Should render without error
    expect(button).toBeInTheDocument();
  });

  it('handles geometry that is null', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay geometry={null} bbox={[10, 20, 30, 40]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('North:')).toBeInTheDocument();
    expect(screen.getByText(/30\.0000°/)).toBeInTheDocument();
  });

  it('shows full GeoJSON view content', async () => {
    const user = userEvent.setup();
    const geometry = { type: 'Point', coordinates: [10, 20] };

    const { container } = render(<GeometryDisplay geometry={geometry} />);
    const button = screen.getByRole('button');
    await user.click(button);

    const detailsElement = container.querySelector('details');
    expect(detailsElement).toBeInTheDocument();

    const preElement = container.querySelector('pre');
    expect(preElement).toHaveTextContent('Point');
    expect(preElement).toHaveTextContent('10');
    expect(preElement).toHaveTextContent('20');
  });

  it('aria-expanded attribute updates on toggle', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[-180, -90, 180, 90]} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('handles bbox with dimensions less than 1 degree', async () => {
    const user = userEvent.setup();
    render(<GeometryDisplay bbox={[10, 10, 10.1, 10.1]} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('North:')).toBeInTheDocument();
    expect(screen.getByText('West:')).toBeInTheDocument();
    const bboxArray = screen.getByText(/\[10\.0000, 10\.0000, 10\.1000, 10\.1000\]/);
    expect(bboxArray).toBeInTheDocument();
  });
});
