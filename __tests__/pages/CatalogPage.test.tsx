import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CatalogPage } from '../../src/pages/CatalogPage';
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
    { rel: 'child', href: 'child1.json', title: 'Child 1' },
    { rel: 'child', href: 'child2.json', title: 'Child 2' },
    { rel: 'item', href: 'item1.json', title: 'Item 1' },
  ],
};

const renderWithRouter = (
  url: string = 'https://example.com/catalog.json',
  component = <CatalogPage />
) => {
  return render(
    <MemoryRouter
      initialEntries={[`/catalog?url=${encodeURIComponent(url)}`]}
    >
      <Routes>
        <Route path="/catalog" element={component} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('CatalogPage', () => {
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

    renderWithRouter();

    expect(screen.getByText(/loading catalog/i)).toBeInTheDocument();
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

    renderWithRouter();

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should show error when no URL is provided', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Routes>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/no catalog url provided/i)).toBeInTheDocument();
  });

  it('should render catalog data with title and description', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

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

    renderWithRouter();

    expect(screen.getByText('test-catalog')).toBeInTheDocument();
  });

  it('should render statistics for children and items', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/2 children/)).toBeInTheDocument();
    expect(screen.getByText(/1 item/)).toBeInTheDocument();
  });

  it('should render child catalogs section with links', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Child Catalogs')).toBeInTheDocument();
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should render child catalog links with correct URLs', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const childLinks = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.includes('/catalog?url=')
    );

    expect(childLinks.length).toBeGreaterThan(0);
    expect(childLinks[0].getAttribute('href')).toContain('/catalog?url=');
    expect(childLinks[0].getAttribute('href')).toContain('child1.json');
  });

  it('should render items section with links', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Items')).toBeInTheDocument();
    const itemLink = screen.getByText('Item 1');
    expect(itemLink.closest('a')).toHaveAttribute('href', 'https://example.com/item1.json');
    expect(itemLink.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('should not render child catalogs section when no children', () => {
    const catalogWithoutChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'leaf-catalog',
      description: 'A leaf catalog',
      links: [{ rel: 'item', href: 'item1.json' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.queryByText('Child Catalogs')).not.toBeInTheDocument();
  });

  it('should not render items section when no items', () => {
    const catalogWithoutItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog',
      description: 'A catalog',
      links: [{ rel: 'child', href: 'child1.json', title: 'Child 1' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.queryByText('Items')).not.toBeInTheDocument();
  });

  it('should render back button', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/← Back/)).toBeInTheDocument();
  });

  it('should call retry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    renderWithRouter();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalled();
  });

  it('should render nothing when data is null and no error', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.queryByText(/catalog/i)).not.toBeInTheDocument();
  });

  it('should render URL toggle button', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should hide URL by default', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.queryByText(/catalog url:/i)).not.toBeInTheDocument();
  });

  it('should show URL when toggle button is clicked', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/catalog url:/i)).toBeInTheDocument();
    expect(screen.getByText('https://example.com/catalog.json')).toBeInTheDocument();
  });

  it('should toggle URL visibility', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });

    fireEvent.click(toggleButton);
    expect(screen.getByText(/catalog url:/i)).toBeInTheDocument();

    const hideButton = screen.getByRole('button', { name: /hide url/i });
    fireEvent.click(hideButton);
    expect(screen.queryByText(/catalog url:/i)).not.toBeInTheDocument();
  });

  it('should render copy button when URL is shown', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('should copy URL to clipboard when copy button is clicked', async () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    fireEvent.click(toggleButton);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/catalog.json');
  });
});
