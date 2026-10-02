import type { StacLink } from '../types/stac';
import '../styles/BrowseImagesDisplay.css';

interface BrowseImagesDisplayProps {
  images: StacLink[];
  baseUrl?: string;
}

export function BrowseImagesDisplay({ images, baseUrl }: BrowseImagesDisplayProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const resolveImageUrl = (href: string): string => {
    if (!baseUrl) return href;
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  };

  return (
    <section className="browse-images-display" aria-labelledby="browse-images-heading">
      <h3 id="browse-images-heading" className="browse-images-title">Browse Images</h3>
      <div className="browse-images-grid" role="region" aria-label={`${images.length} available browse images`}>
        {images.map((image, idx) => (
          <div key={idx} className="browse-image-item">
            <a
              href={resolveImageUrl(image.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="browse-image-link"
              aria-label={image.title ? `View ${image.title}` : `View browse image ${idx + 1}`}
            >
              <img
                src={resolveImageUrl(image.href)}
                alt={image.title || `Browse image ${idx + 1}`}
                className="browse-image"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.style.display = 'none';
                  const container = e.currentTarget.closest('.browse-image-item');
                  if (container) {
                    container.classList.add('image-error');
                  }
                }}
              />
            </a>
            {image.title && <p className="browse-image-caption">{image.title}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
