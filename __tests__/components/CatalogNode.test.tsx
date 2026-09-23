import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CatalogNode } from '../../src/components/CatalogNode';
import type { StacCatalog } from '../../src/types/stac';

vi.mock('../../src/hooks/useStacNode', () => ({
  useStacNode: vi.fn(),
}));

import { useStacNode } from '../../src/hooks/useStacNode';

const mockCatalog: StacCatalog = {
  type: 'Catalog',
  stac_version: '1.0.0',
  id: 'test-catalog',
  title: 'Test Catalog',
  description: 'A test catalog',
  links: [
    { rel: 'child', href: 'child1.json' },
    { rel: 'child', href: 'child2.json' },
    { rel: 'item', href: 'item1.json' },
  ],
};

describe('CatalogNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('should render error state with retry button', () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should render nothing when data is null and no error', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { container } = render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(container.firstChild).toBeNull();
  });

  it('should render catalog data with title and description', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.getByText('Test Catalog')).toBeInTheDocument();
    expect(screen.getByText('A test catalog')).toBeInTheDocument();
  });

  it('should render catalog ID when different from title', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.getByText('test-catalog')).toBeInTheDocument();
  });

  it('should render statistics for children and items', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.getByText(/2 children/)).toBeInTheDocument();
    expect(screen.getByText(/1 item/)).toBeInTheDocument();
  });

  it('should render expand button when children exist', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    const expandButton = screen.getByRole('button', { name: /▶|▼/ });
    expect(expandButton).toBeInTheDocument();
  });

  it('should not render expand button when no children', () => {
    const catalogWithoutChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'leaf-catalog',
      description: 'A leaf catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    expect(screen.queryByRole('button', { name: /▶|▼/ })).not.toBeInTheDocument();
  });

  it('should be expanded by default when isRoot is true', () => {
    const catalogWithoutChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'root-catalog',
      description: 'Root catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(
      <CatalogNode
        url="https://example.com/catalog.json"
        isRoot={true}
        depth={0}
      />
    );

    // Root node without children shouldn't have an expand button, but we test it exists
    // when expanded=true is the initial state. Create a node with children instead.
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { rerender } = render(
      <CatalogNode url="https://example.com/catalog.json" isRoot={true} />
    );

    const expandButton = screen.getAllByRole('button')[0];
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should toggle expansion on button click', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    const expandButton = screen.getByRole('button', { name: /▶/ });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(expandButton);

    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should call retry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    render(<CatalogNode url="https://example.com/catalog.json" />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('should apply correct padding based on depth', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { container } = render(
      <CatalogNode url="https://example.com/catalog.json" depth={2} />
    );

    const node = container.querySelector('.catalog-node');
    expect(node).toHaveStyle({ paddingLeft: '40px' });
  });
});
