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
});
