import type { JSX } from 'react';
import type { StacLink } from '../types/stac';
import '../styles/ParentNavigation.css';

interface ParentNavigationProps {
  parentLink: StacLink;
  onNavigate: (href: string) => void;
}

export function ParentNavigation({
  parentLink,
  onNavigate,
}: ParentNavigationProps): JSX.Element {
  const handleClick = () => {
    onNavigate(parentLink.href);
  };

  return (
    <div className="parent-navigation">
      <button
        onClick={handleClick}
        className="parent-navigation-button"
        title={`Navigate to parent catalog: ${parentLink.title || 'parent'}. Note: Some parent URLs may not be STAC catalogs (e.g., provider landing pages).`}
      >
        <span className="parent-navigation-icon">↑</span>
        <span className="parent-navigation-text">
          <span className="parent-navigation-label">Parent:</span>
          <span className="parent-navigation-name">{parentLink.title || 'Unnamed Parent'}</span>
        </span>
      </button>
    </div>
  );
}
