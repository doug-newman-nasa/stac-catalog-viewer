import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowseImagesDisplay } from '../../src/components/BrowseImagesDisplay';
import type { StacLink } from '../../src/types/stac';

describe('BrowseImagesDisplay', () => {
  it('should render nothing when no images provided', () => {
    const { container } = render(<BrowseImagesDisplay images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when images is undefined', () => {
    const { container } = render(<BrowseImagesDisplay images={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single browse image', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    expect(screen.getByText('Browse Images')).toBeInTheDocument();
    const img = screen.getByAltText('Browse image 1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should render multiple browse images', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image1.jpg',
        type: 'image/jpeg',
      },
      {
        rel: 'browse',
        href: 'https://example.com/image2.png',
        type: 'image/png',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    expect(screen.getByText('Browse Images')).toBeInTheDocument();
    expect(screen.getByAltText('Browse image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Browse image 2')).toBeInTheDocument();
  });

  it('should render image with title', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
        title: 'Example Preview Image',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    expect(screen.getByText('Example Preview Image')).toBeInTheDocument();
    const img = screen.getByAltText('Example Preview Image');
    expect(img).toBeInTheDocument();
  });

  it('should resolve relative URLs with baseUrl', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: './images/preview.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} baseUrl="https://example.com/catalog/" />);

    const img = screen.getByAltText('Browse image 1');
    expect(img).toHaveAttribute('src', 'https://example.com/catalog/images/preview.jpg');
  });

  it('should use absolute URLs directly', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://cdn.example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} baseUrl="https://example.com/catalog/" />);

    const img = screen.getByAltText('Browse image 1');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/image.jpg');
  });

  it('should create links to images', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/image.jpg');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render grid layout', () => {
    const images: StacLink[] = [
      { rel: 'preview', href: 'https://example.com/image1.jpg', type: 'image/jpeg' },
      { rel: 'preview', href: 'https://example.com/image2.jpg', type: 'image/jpeg' },
      { rel: 'preview', href: 'https://example.com/image3.jpg', type: 'image/jpeg' },
    ];

    const { container } = render(<BrowseImagesDisplay images={images} />);

    const grid = container.querySelector('.browse-images-grid');
    expect(grid).toBeInTheDocument();
    const items = grid?.querySelectorAll('.browse-image-item');
    expect(items?.length).toBe(3);
  });

  it('should use image title as link aria-label', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
        title: 'RGB True Color',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'View RGB True Color');
  });

  it('should use default aria-label when image title is missing', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'View browse image 1');
  });

  it('should handle missing baseUrl gracefully', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    const img = screen.getByAltText('Browse image 1');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should handle browse links', () => {
    const images: StacLink[] = [
      {
        rel: 'browse',
        href: 'https://example.com/browse.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    expect(screen.getByAltText('Browse image 1')).toBeInTheDocument();
  });

  it('should handle relative paths', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: '../images/preview.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} baseUrl="https://example.com/catalogs/main/" />);

    const img = screen.getByAltText('Browse image 1');
    expect(img).toHaveAttribute('src', 'https://example.com/catalogs/images/preview.jpg');
  });

  it('should display multiple captions', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image1.jpg',
        type: 'image/jpeg',
        title: 'First Image',
      },
      {
        rel: 'preview',
        href: 'https://example.com/image2.jpg',
        type: 'image/jpeg',
        title: 'Second Image',
      },
    ];

    render(<BrowseImagesDisplay images={images} />);

    expect(screen.getByText('First Image')).toBeInTheDocument();
    expect(screen.getByText('Second Image')).toBeInTheDocument();
  });

  it('should handle image load errors', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    const { container } = render(<BrowseImagesDisplay images={images} />);

    const img = screen.getByAltText('Browse image 1') as HTMLImageElement;
    expect(img).toBeInTheDocument();

    // Simulate image load error
    const errorEvent = new Event('error', { bubbles: true });
    Object.defineProperty(errorEvent, 'currentTarget', {
      value: img,
      enumerable: true,
    });

    img.dispatchEvent(errorEvent);

    expect(img.style.display).toBe('none');
    const item = container.querySelector('.browse-image-item');
    expect(item?.classList.contains('image-error')).toBe(true);
  });

  it('should handle invalid baseUrl gracefully', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    render(<BrowseImagesDisplay images={images} baseUrl="not a valid url" />);

    const img = screen.getByAltText('Browse image 1');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should hide images without captions when no title', () => {
    const images: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      },
    ];

    const { container } = render(<BrowseImagesDisplay images={images} />);

    const caption = container.querySelector('.browse-image-caption');
    expect(caption).not.toBeInTheDocument();
  });
});
