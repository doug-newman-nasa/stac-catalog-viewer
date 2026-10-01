import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetLinks } from '../../src/components/AssetLinks';
import type { StacAsset } from '../../src/types/stac';

describe('AssetLinks', () => {
  it('should render nothing when assets is empty', () => {
    const { container } = render(<AssetLinks assets={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render toggle button with asset count', () => {
    const assets: Record<string, StacAsset> = {
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        type: 'image/jpeg',
        title: 'Thumbnail',
      },
      data: {
        href: 'https://example.com/data.tif',
        type: 'image/tiff',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets \(2\)/ });
    expect(toggle).toBeInTheDocument();
  });

  it('should expand and collapse asset list on toggle click', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        type: 'image/jpeg',
        title: 'Thumbnail',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });

    // Initially collapsed
    expect(screen.queryByText('Thumbnail')).not.toBeInTheDocument();

    // Click to expand
    await user.click(toggle);
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();

    // Click to collapse
    await user.click(toggle);
    expect(screen.queryByText('Thumbnail')).not.toBeInTheDocument();
  });

  it('should display asset key, type, title, and href', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        type: 'image/jpeg',
        title: 'Thumbnail Image',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });
    await user.click(toggle);

    expect(screen.getByText('thumbnail')).toBeInTheDocument();
    expect(screen.getByText('image/jpeg')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail Image')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/example.com\/thumb.jpg/)).toBeInTheDocument();
  });

  it('should display asset description when available', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      data: {
        href: 'https://example.com/data.tif',
        type: 'image/tiff',
        title: 'Data File',
        description: 'GeoTIFF data file with metadata',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });
    await user.click(toggle);

    expect(screen.getByText('GeoTIFF data file with metadata')).toBeInTheDocument();
  });

  it('should display multiple assets correctly', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        type: 'image/jpeg',
        title: 'Thumbnail',
      },
      data: {
        href: 'https://example.com/data.tif',
        type: 'image/tiff',
        title: 'Data File',
      },
      metadata: {
        href: 'https://example.com/metadata.xml',
        type: 'application/xml',
        title: 'Metadata',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets \(3\)/ });
    await user.click(toggle);

    expect(screen.getByText('thumbnail')).toBeInTheDocument();
    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('metadata')).toBeInTheDocument();
  });

  it('should create external links with correct attributes', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      data: {
        href: 'https://example.com/data.tif',
        type: 'image/tiff',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });
    await user.click(toggle);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/data.tif');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should handle assets without title or description', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      data: {
        href: 'https://example.com/data.tif',
        type: 'image/tiff',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });
    await user.click(toggle);

    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('image/tiff')).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('should handle assets without type', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      unknown: {
        href: 'https://example.com/unknown',
        title: 'Unknown Asset',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button', { name: /Assets/ });
    await user.click(toggle);

    expect(screen.getByText('unknown')).toBeInTheDocument();
    expect(screen.getByText('Unknown Asset')).toBeInTheDocument();
    // Type should not be rendered if not present
    expect(screen.queryByText(/^image\//)).not.toBeInTheDocument();
  });

  it('should update aria-expanded attribute when toggled', async () => {
    const user = userEvent.setup();
    const assets: Record<string, StacAsset> = {
      thumbnail: {
        href: 'https://example.com/thumb.jpg',
        type: 'image/jpeg',
      },
    };

    render(<AssetLinks assets={assets} />);

    const toggle = screen.getByRole('button');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
