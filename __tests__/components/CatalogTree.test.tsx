import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogTree } from '../../src/components/CatalogTree';

vi.mock('../../src/components/CatalogNode', () => ({
  CatalogNode: ({ url, depth, isRoot }: { url: string; depth: number; isRoot: boolean }) => (
    <div data-testid="mock-catalog-node">
      CatalogNode: {url}, depth: {depth}, isRoot: {isRoot ? 'true' : 'false'}
    </div>
  ),
}));

describe('CatalogTree', () => {
  it('should render catalog tree container', () => {
    render(<CatalogTree rootUrl="https://example.com/catalog.json" />);

    expect(screen.getByText(/CatalogNode:/)).toBeInTheDocument();
  });

  it('should render CatalogNode with root props', () => {
    const rootUrl = 'https://example.com/catalog.json';
    render(<CatalogTree rootUrl={rootUrl} />);

    expect(screen.getByText(/CatalogNode: https:\/\/example.com\/catalog.json/)).toBeInTheDocument();
    expect(screen.getByText(/depth: 0/)).toBeInTheDocument();
    expect(screen.getByText(/isRoot: true/)).toBeInTheDocument();
  });

  it('should pass correct props to CatalogNode', () => {
    render(<CatalogTree rootUrl="https://api.example.com/v1/catalogs" />);

    const mockNode = screen.getByTestId('mock-catalog-node');
    expect(mockNode.textContent).toContain('https://api.example.com/v1/catalogs');
    expect(mockNode.textContent).toContain('depth: 0');
    expect(mockNode.textContent).toContain('isRoot: true');
  });

  it('should have catalog-tree CSS class', () => {
    const { container } = render(<CatalogTree rootUrl="https://example.com/catalog.json" />);

    expect(container.querySelector('.catalog-tree')).toBeInTheDocument();
  });
});
