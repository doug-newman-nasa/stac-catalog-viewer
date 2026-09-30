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
    <div className="browse-images-display">
      <h4 className="browse-images-title">Browse Images</h4>
      <div className="browse-images-grid">
        {images.map((image, idx) => (
          <div key={idx} className="browse-image-item">
            <a
              href={resolveImageUrl(image.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="browse-image-link"
              title={image.title || 'Browse image'}
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
    </div>
  );
}
