import { useState } from 'react';
import type { StacLink } from '../types/stac';
import '../styles/LinksDisplay.css';

interface LinksDisplayProps {
  links: StacLink[];
}

export function LinksDisplay({ links }: LinksDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="links-display">
      <button
        className="links-display-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="links-display-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="links-display-toggle-label">Links ({links.length})</span>
      </button>

      {isExpanded && (
        <div className="links-display-content">
          <div className="links-display-list">
            {links.map((link, index) => (
              <div key={index} className="link-item">
                <div className="link-item-header">
                  <span className="link-rel">{link.rel}</span>
                  {link.type && <span className="link-type">{link.type}</span>}
                </div>
                {link.title && <p className="link-title">{link.title}</p>}
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-href"
                  title="Open link"
                >
                  {link.href}
                  <span className="link-href-icon">↗</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
