import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeywordsDisplay } from '../../src/components/KeywordsDisplay';

describe('KeywordsDisplay', () => {
  it('should render nothing when no keywords provided', () => {
    const { container } = render(<KeywordsDisplay keywords={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when keywords is undefined', () => {
    const { container } = render(<KeywordsDisplay keywords={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single keyword', () => {
    render(<KeywordsDisplay keywords={['climate']} />);

    expect(screen.getByText('Keywords')).toBeInTheDocument();
    expect(screen.getByText('climate')).toBeInTheDocument();
  });

  it('should render multiple keywords', () => {
    const keywords = ['climate', 'temperature', 'atmosphere', 'weather'];

    render(<KeywordsDisplay keywords={keywords} />);

    expect(screen.getByText('Keywords')).toBeInTheDocument();
    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  it('should render keywords with special characters', () => {
    const keywords = ['sea-ice', 'CO2', 'H2O', 'soil_moisture'];

    render(<KeywordsDisplay keywords={keywords} />);

    expect(screen.getByText('sea-ice')).toBeInTheDocument();
    expect(screen.getByText('CO2')).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText('soil_moisture')).toBeInTheDocument();
  });

  it('should render keywords as tags with correct CSS class', () => {
    const { container } = render(<KeywordsDisplay keywords={['keyword1', 'keyword2']} />);

    const tags = container.querySelectorAll('.keyword-tag');
    expect(tags).toHaveLength(2);
    expect(tags[0].textContent).toBe('keyword1');
    expect(tags[1].textContent).toBe('keyword2');
  });

  it('should display keywords in a list container', () => {
    const { container } = render(<KeywordsDisplay keywords={['keyword']} />);

    const list = container.querySelector('.keywords-list');
    expect(list).toBeInTheDocument();
    expect(list?.textContent).toContain('keyword');
  });

  it('should render keywords title', () => {
    render(<KeywordsDisplay keywords={['keyword']} />);

    const title = screen.getByText('Keywords');
    expect(title).toHaveClass('keywords-title');
  });

  it('should render keywords display container', () => {
    const { container } = render(<KeywordsDisplay keywords={['keyword']} />);

    const display = container.querySelector('.keywords-display');
    expect(display).toBeInTheDocument();
  });

  it('should render many keywords', () => {
    const keywords = Array.from({ length: 20 }, (_, i) => `keyword${i + 1}`);

    render(<KeywordsDisplay keywords={keywords} />);

    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  it('should handle very long keyword text', () => {
    const longKeyword = 'a'.repeat(100);
    render(<KeywordsDisplay keywords={[longKeyword]} />);

    expect(screen.getByText(longKeyword)).toBeInTheDocument();
  });

  it('should render keywords with numbers', () => {
    const keywords = ['2024', '1999', '100m_band'];

    render(<KeywordsDisplay keywords={keywords} />);

    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  it('should render keywords with spaces', () => {
    const keywords = ['sea ice', 'cloud cover', 'land surface'];

    render(<KeywordsDisplay keywords={keywords} />);

    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  it('should render empty string keyword', () => {
    const { container } = render(<KeywordsDisplay keywords={['']} />);

    const tags = container.querySelectorAll('.keyword-tag');
    expect(tags).toHaveLength(1);
  });

  it('should handle keywords with unicode characters', () => {
    const keywords = ['café', '北京', 'москва', '日本'];

    render(<KeywordsDisplay keywords={keywords} />);

    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  it('should render all keyword types together', () => {
    const keywords = [
      'simple',
      'with-dash',
      'with_underscore',
      'with number 123',
      'CamelCase',
      'UPPERCASE',
      'lowercase',
    ];

    render(<KeywordsDisplay keywords={keywords} />);

    keywords.forEach((keyword) => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });
});
