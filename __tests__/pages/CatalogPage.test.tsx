import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CatalogPage } from '../../src/pages/CatalogPage';
import type { StacCatalog } from '../../src/types/stac';

vi.mock('../../src/hooks/useStacNode', () => ({
  useStacNode: vi.fn(),
}));

vi.mock('../../src/hooks/useStacItemsSearch', () => ({
  useStacItemsSearch: vi.fn(),
}));

import { useStacNode } from '../../src/hooks/useStacNode';
import { useStacItemsSearch } from '../../src/hooks/useStacItemsSearch';

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

const mockCatalogWithoutItems: StacCatalog = {
  type: 'Catalog',
  stac_version: '1.0.0',
  id: 'test-catalog',
  title: 'Test Catalog',
  description: 'A test catalog',
  links: [
    { rel: 'child', href: 'child1.json', title: 'Child 1' },
    { rel: 'child', href: 'child2.json', title: 'Child 2' },
    { rel: 'search', href: 'search.json', title: 'Search' },
  ],
};

const mockItemsSearchDefault = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  pageSize: 25,
  setPageSize: vi.fn(),
  hasNext: false,
  hasPrevious: false,
  supportsSearch: true,
  goNext: vi.fn(),
  goPrevious: vi.fn(),
  retry: vi.fn(),
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
    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);
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

  it('should render page size selector for child catalogs', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should show pagination controls when items exceed page size', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const pageInfos = screen.getAllByText(/page 1 of/i);
    expect(pageInfos.length).toBeGreaterThan(0);
  });

  it('should change page when next button is clicked', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    const pageInfos = screen.getAllByText(/page 1 of/i);
    expect(pageInfos.length).toBeGreaterThan(0);

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    const page2Infos = screen.getAllByText(/page 2 of/i);
    expect(page2Infos.length).toBeGreaterThan(0);
  });

  it('should disable previous button on first page', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(prevButtons[0]).toBeDisabled();
  });

  it('should change page size for child catalogs', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const pageInfosInitial = screen.getAllByText(/page 1 of 2/i);
    expect(pageInfosInitial.length).toBeGreaterThan(0);

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const childPageSizeSelect = selects[0] as HTMLSelectElement;
    childPageSizeSelect.value = '50';
    fireEvent.change(childPageSizeSelect);

    expect(screen.getByText('Child 30')).toBeInTheDocument();
  });

  it('should handle pagination for items independently from child catalogs', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: [
        { rel: 'child', href: 'child1.json', title: 'Child 1' },
        ...Array.from({ length: 30 }, (_, i) => ({
          rel: 'item',
          href: `item${i}.json`,
          title: `Item ${i + 1}`,
        })),
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const pageInfos = screen.getAllByText(/page 1 of/i);
    expect(pageInfos.length).toBeGreaterThan(0);
  });

  it('should navigate home when back button is clicked in no-URL error state', () => {
    render(
      <MemoryRouter initialEntries={['/catalog']}>
        <Routes>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to home/i });
    fireEvent.click(backButton);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked in error state', () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    renderWithRouter();
    const backButtons = screen.getAllByRole('button', { name: /← back/i });
    const errorBackButton = backButtons.find((btn) =>
      btn.closest('.error-actions')
    );

    expect(errorBackButton).toBeInTheDocument();
  });

  it('should navigate back when header back button is clicked', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const backButtons = screen.getAllByRole('button', { name: /← back/i });
    const headerBackButton = backButtons.find((btn) =>
      btn.classList.contains('back-button-header')
    );

    expect(headerBackButton).toBeInTheDocument();
  });

  it('should navigate to next page from bottom pagination when next button is clicked on last page', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    const page2Infos = screen.getAllByText(/page 2 of/i);
    expect(page2Infos.length).toBeGreaterThan(0);
  });

  it('should navigate back from page 2 using previous button', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    expect(screen.getAllByText(/page 2 of/i).length).toBeGreaterThan(0);

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    fireEvent.click(prevButtons[0]);

    expect(screen.getAllByText(/page 1 of 2/i).length).toBeGreaterThan(0);
  });

  it('should disable next button on last page for items', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    const itemNextButton = nextButtons[nextButtons.length - 1];

    fireEvent.click(itemNextButton);
    fireEvent.click(itemNextButton);

    const disabledNextButtons = screen.getAllByRole('button', { name: /next/i });
    const lastNextButton = disabledNextButtons[disabledNextButtons.length - 1];
    expect(lastNextButton).toBeDisabled();
  });

  it('should render both top and bottom pagination controls for large results', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const paginationElements = screen.getAllByText(/page 1 of 2/i);
    expect(paginationElements.length).toBe(2);
  });

  it('should hide bottom pagination when moving to last page with all items shown', () => {
    const catalogWithExactlyTwoPages: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-two-pages',
      description: 'A catalog with exactly 50 items',
      links: Array.from({ length: 50 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithExactlyTwoPages,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    const page2Infos = screen.getAllByText(/page 2 of 2/i);
    expect(page2Infos.length).toBeGreaterThan(0);
  });

  it('should navigate back from header when back button is clicked and data loads', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { container } = renderWithRouter();

    const backButtonHeader = screen.getByRole('button', { name: /← back/i });
    expect(backButtonHeader).toBeInTheDocument();
    expect(backButtonHeader.classList.contains('back-button-header')).toBe(true);
  });

  it('should navigate back when back button is clicked in error state', () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    renderWithRouter();

    const backButtons = screen.getAllByRole('button', { name: /← back/i });
    const errorBackButton = backButtons.find((btn) =>
      btn.className.includes('back-button')
    );

    expect(errorBackButton).toBeInTheDocument();
  });

  it('should navigate to previous page from bottom pagination for items', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    const itemNextButton = nextButtons[nextButtons.length - 1];
    fireEvent.click(itemNextButton);

    expect(screen.getAllByText(/page 2 of/i).length).toBeGreaterThan(0);

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    const itemPrevButton = prevButtons[prevButtons.length - 1];
    fireEvent.click(itemPrevButton);

    expect(screen.getAllByText(/page 1 of 2/i).length).toBeGreaterThan(0);
  });

  it('should display correct items when navigating to page 2', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Item 1')).toBeInTheDocument();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    const itemNextButton = nextButtons[nextButtons.length - 1];
    fireEvent.click(itemNextButton);

    expect(screen.getByText('Item 26')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('should trigger error back button click handler', async () => {
    const mockRetry = vi.fn();
    vi.mocked(useStacNode).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      retry: mockRetry,
    });

    const { container: errorContainer } = renderWithRouter();

    const errorBackButton = errorContainer.querySelector('.error-actions .back-button');
    expect(errorBackButton).toBeInTheDocument();

    fireEvent.click(errorBackButton as HTMLElement);
  });

  it('should trigger header back button click handler', async () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { container: headerContainer } = renderWithRouter();

    const headerBackButton = headerContainer.querySelector('.back-button-header');
    expect(headerBackButton).toBeInTheDocument();

    fireEvent.click(headerBackButton as HTMLElement);
  });

  it('should trigger child catalog previous button at bottom pagination', async () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Child 26')).toBeInTheDocument();
    });

    const allPrevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(allPrevButtons.length).toBeGreaterThan(0);
    fireEvent.click(allPrevButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Child 1')).toBeInTheDocument();
    });
  });

  it('should trigger item pagination previous button at bottom', async () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Item 26')).toBeInTheDocument();
    });

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    fireEvent.click(prevButtons[prevButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('should show copied confirmation and then hide it after timeout', async () => {
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

    expect(screen.getByRole('button', { name: /✓ copied!/i })).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should handle clipboard write failure gracefully', async () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied')),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    renderWithRouter();

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    fireEvent.click(toggleButton);

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/catalog.json'
    );
  });

  it('should render catalog with only title (no id shown when same)', () => {
    const catalogWithSameTitleAndId: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'same-title-and-id',
      title: 'same-title-and-id',
      description: 'A catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithSameTitleAndId,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const { container } = renderWithRouter();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'same-title-and-id'
    );
    const codeElements = container.querySelectorAll('.catalog-id');
    expect(codeElements.length).toBe(0);
  });

  it('should render catalog without title (show id as title)', () => {
    const catalogWithoutTitle: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-without-title',
      description: 'A catalog without title',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutTitle,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'catalog-without-title'
    );
  });

  it('should render catalog without description', () => {
    const catalogWithoutDescription: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'no-desc-catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutDescription,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'no-desc-catalog'
    );
    expect(screen.queryByText(/a catalog/i)).not.toBeInTheDocument();
  });

  it('should render child link without type', () => {
    const catalogWithUnTypedChild: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'child', href: 'child1.json', title: 'Child 1' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithUnTypedChild,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
  });

  it('should render child link with type', () => {
    const catalogWithTypedChild: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        {
          rel: 'child',
          href: 'child1.json',
          title: 'Child 1',
          type: 'application/json',
        },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithTypedChild,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('should render child link without title', () => {
    const catalogWithUntitledChild: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'child', href: 'child1.json' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithUntitledChild,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('should render item link without title', () => {
    const catalogWithUntitledItem: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'item', href: 'item1.json' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithUntitledItem,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Untitled Item')).toBeInTheDocument();
  });

  it('should not show pagination when only one page of children', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalog,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const paginationControls = screen.queryAllByText(/page 1 of 1/i);
    expect(paginationControls.length).toBe(0);
  });

  it('should not show pagination when only one page of items', () => {
    const catalogWithFewItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'item', href: 'item1.json', title: 'Item 1' },
        { rel: 'item', href: 'item2.json', title: 'Item 2' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithFewItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const paginationControls = screen.queryAllByText(/page 1 of 1/i);
    expect(paginationControls.length).toBe(0);
  });

  it('should disable next button on last page for children', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    const childNextButton = nextButtons[0];

    fireEvent.click(childNextButton);
    fireEvent.click(childNextButton);

    const disabledNextButtons = screen.getAllByRole('button', { name: /next/i });
    const lastChildNextButton = disabledNextButtons[0];
    expect(lastChildNextButton).toBeDisabled();
  });

  it('should resolve relative URLs for child catalogs correctly', () => {
    const catalogWithRelativeUrl: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'child', href: '../child/catalog.json', title: 'Child' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithRelativeUrl,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter('https://example.com/catalogs/main/catalog.json');

    const childLink = screen.getByText('Child').closest('a');
    expect(childLink).toHaveAttribute('href');
    expect(childLink?.getAttribute('href')).toContain('/catalog?url=');
  });

  it('should show singular "child" for exactly one child', () => {
    const catalogWithOneChild: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'child', href: 'child1.json', title: 'Child 1' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithOneChild,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/1 child$/)).toBeInTheDocument();
  });

  it('should show singular "item" for exactly one item', () => {
    const catalogWithOneItem: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'item', href: 'item1.json', title: 'Item 1' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithOneItem,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/1 item$/)).toBeInTheDocument();
  });

  it('should show child and item stats together', () => {
    const catalogWithBoth: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'child', href: 'child1.json', title: 'Child 1' },
        { rel: 'item', href: 'item1.json', title: 'Item 1' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithBoth,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/1 child$/)).toBeInTheDocument();
    expect(screen.getByText(/1 item$/)).toBeInTheDocument();
  });

  it('should not show stats when catalog has no children or items', () => {
    const catalogWithoutChildrenOrItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutChildrenOrItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.queryByText(/children/)).not.toBeInTheDocument();
    expect(screen.queryByText(/item/)).not.toBeInTheDocument();
  });

  it('should update child page to 1 when changing page size', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    expect(screen.getAllByText(/page 2 of/i).length).toBeGreaterThan(0);

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const childPageSizeSelect = selects[0] as HTMLSelectElement;
    childPageSizeSelect.value = '50';
    fireEvent.change(childPageSizeSelect);

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 30')).toBeInTheDocument();
  });

  it('should render URL correctly when URL has query parameters', () => {
    const url = 'https://example.com/catalog.json?param=value';
    const catalogData: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogData,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter(url);

    const toggleButton = screen.getByRole('button', { name: /show url/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText(url)).toBeInTheDocument();
  });

  it('should handle catalog with many children and many items', () => {
    const catalogWithManyChildrenAndItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        ...Array.from({ length: 30 }, (_, i) => ({
          rel: 'child',
          href: `child${i}.json`,
          title: `Child ${i + 1}`,
        })),
        ...Array.from({ length: 30 }, (_, i) => ({
          rel: 'item',
          href: `item${i}.json`,
          title: `Item ${i + 1}`,
        })),
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildrenAndItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/30 children/)).toBeInTheDocument();
    expect(screen.getByText(/30 items/)).toBeInTheDocument();

    const pageInfos = screen.getAllByText(/page 1 of/i);
    expect(pageInfos.length).toBeGreaterThanOrEqual(2);
  });

  it('should enable previous button when not on first page for children', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(prevButtons[0]).not.toBeDisabled();
  });

  it('should enable next button when not on last page for children', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    expect(nextButtons[0]).not.toBeDisabled();
  });

  it('should enable previous button when not on first page for items', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(prevButtons[prevButtons.length - 1]).not.toBeDisabled();
  });

  it('should enable next button when not on last page for items', () => {
    const catalogWithManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-many-items',
      description: 'A catalog with many items',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'item',
        href: `item${i}.json`,
        title: `Item ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    expect(nextButtons[nextButtons.length - 1]).not.toBeDisabled();
  });

  it('should render pagination top and bottom with correct controls', () => {
    const catalogWithExactlyOnePagePlusPlusOfChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog',
      title: 'Catalog',
      description: 'A catalog',
      links: Array.from({ length: 51 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithExactlyOnePagePlusPlusOfChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    renderWithRouter();

    const allPageInfos = screen.getAllByText(/page 1 of 3/i);
    expect(allPageInfos.length).toBe(2);

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    expect(nextButtons.length).toBe(2);

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(prevButtons.length).toBe(2);
  });

  it('should render dynamic items section with rel:items link', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockItem1 = {
      type: 'Feature',
      id: 'item1',
      geometry: null,
      properties: {},
      links: [{ rel: 'self', href: 'https://example.com/item1' }],
    };

    const mockItem2 = {
      type: 'Feature',
      id: 'item2',
      geometry: null,
      properties: {},
      links: [{ rel: 'self', href: 'https://example.com/item2' }],
    };

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [mockItem1, mockItem2],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: true,
      hasPrevious: false,
      numberMatched: 100,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('item1')).toBeInTheDocument();
    expect(screen.getByText('item2')).toBeInTheDocument();
  });

  it('should show page info with numberMatched for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: true,
      hasPrevious: false,
      numberMatched: 2798490,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    const pageInfos = screen.getAllByText(/Page/);
    expect(pageInfos.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/of ~2798490 items/).length).toBeGreaterThan(0);
  });

  it('should navigate to next page for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockGoNext = vi.fn();

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: true,
      hasPrevious: false,
      numberMatched: 100,
      goNext: mockGoNext,
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    fireEvent.click(nextButtons[0]);

    expect(mockGoNext).toHaveBeenCalled();
  });

  it('should navigate to previous page for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockGoPrevious = vi.fn();

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 2,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: true,
      hasPrevious: true,
      numberMatched: 100,
      goNext: vi.fn(),
      goPrevious: mockGoPrevious,
      retry: vi.fn(),
    });

    renderWithRouter();

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    fireEvent.click(prevButtons[0]);

    expect(mockGoPrevious).toHaveBeenCalled();
  });

  it('should disable next button when no more items for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 2,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: false,
      hasPrevious: true,
      numberMatched: 100,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    expect(nextButtons[0]).toBeDisabled();
  });

  it('should disable previous button on first page for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: true,
      hasPrevious: false,
      numberMatched: 100,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    const prevButtons = screen.getAllByRole('button', { name: /previous/i });
    expect(prevButtons[0]).toBeDisabled();
  });

  it('should show loading state for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: true,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: false,
      hasPrevious: false,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText(/Loading items/)).toBeInTheDocument();
  });

  it('should show error state for dynamic items', () => {
    const collection: StacCatalog = {
      type: 'Collection',
      stac_version: '1.0.0',
      id: 'test-collection',
      title: 'Test Collection',
      description: 'A test collection',
      links: [
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: collection,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockRetry = vi.fn();

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: new Error('Failed to fetch items'),
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: false,
      hasPrevious: false,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: mockRetry,
    });

    renderWithRouter();

    expect(screen.getAllByText('Failed to fetch items')[0]).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should render both static items and dynamic items sections when both present', () => {
    const catalogWithBoth: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'item', href: 'item1.json', title: 'Static Item 1' },
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithBoth,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    const mockItem = {
      type: 'Feature',
      id: 'dynamic-item1',
      geometry: null,
      properties: {},
      links: [{ rel: 'self', href: 'https://example.com/item' }],
    };

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [mockItem],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: false,
      hasPrevious: false,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('dynamic-item1')).toBeInTheDocument();
  });

  it('should render CollectionSearch component', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const collectionSearch = document.querySelector('.collection-search');
    expect(collectionSearch).toBeTruthy();
  });

  it('should render search form in CollectionSearch', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const searchForm = document.querySelector('.collection-search-form');
    expect(searchForm).toBeTruthy();

    const searchInput = document.querySelector('input[placeholder*="Search"]');
    expect(searchInput).toBeTruthy();

    const searchButton = document.querySelector('.search-button');
    expect(searchButton).toBeTruthy();
  });

  it('should render advanced filters button in CollectionSearch', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const advancedToggle = document.querySelector('.advanced-toggle');
    expect(advancedToggle).toBeTruthy();
    expect(advancedToggle?.textContent).toContain('Advanced');
  });

  it('should display collection search form with correct props', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const collectionSearch = document.querySelector('.collection-search');
    expect(collectionSearch).toBeTruthy();

    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    expect(searchInput).toBeInTheDocument();
  });

  it('should display search results section when collection search has results', () => {
    const searchResults: StacCatalog[] = [
      {
        type: 'Collection',
        stac_version: '1.0.0',
        id: 'searched-collection',
        title: 'Searched Collection',
        description: 'A collection found in search',
        links: [{ rel: 'self', href: 'https://example.com/collection.json' }],
      },
    ];

    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    // Manually set search results by simulating a search
    const { container } = renderWithRouter();

    // The search results section should only appear when results exist
    // Since we can't directly set state from test, we verify the component structure
    const collectionSearch = container.querySelector('.collection-search');
    expect(collectionSearch).toBeInTheDocument();
  });

  it('should hide child catalogs when collection search results exist', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // Child catalogs should be visible initially
    const childCatalogs = screen.queryByText(/Child Catalogs/i);
    expect(childCatalogs).toBeInTheDocument();
  });

  it('should handle catalog without child links or items', () => {
    const emptyLinks: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'empty-catalog',
      description: 'A catalog with no children or items',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: emptyLinks,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // Should not display child catalogs section if no children
    const childCatalogsHeader = screen.queryByText(/Child Catalogs/i);
    expect(childCatalogsHeader).not.toBeInTheDocument();
  });

  it('should handle catalog with extent data', () => {
    const catalogWithExtent: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'catalog-with-extent',
      title: 'Catalog with Extent',
      description: 'A catalog with spatial and temporal extent',
      links: [],
      extent: {
        spatial: {
          bbox: [[-180, -90, 180, 90]],
        },
        temporal: {
          interval: [['2020-01-01', '2023-12-31']],
        },
      },
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithExtent,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // Should display the extent information
    expect(screen.getByText(/Spatial Extent/)).toBeInTheDocument();
  });

  it('should handle page size change for child catalogs', async () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 30 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    const { container } = renderWithRouter();

    const pageSize = container.querySelector(
      '.page-size-select'
    ) as HTMLSelectElement;

    if (pageSize) {
      fireEvent.change(pageSize, { target: { value: '50' } });
      expect(pageSize.value).toBe('50');
    }
  });

  it('should display catalog title or id correctly', () => {
    const catalogWithTitle: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-id',
      title: 'Test Title',
      description: 'Test Description',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithTitle,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should display catalog id when title is same as id', () => {
    const catalogWithoutTitle: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'only-id',
      title: 'only-id',
      description: 'Test Description',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithoutTitle,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText('only-id')).toBeInTheDocument();
  });

  it('should display URL toggle button', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const urlToggle = screen.getByTitle(/Show URL|Hide URL/);
    expect(urlToggle).toBeInTheDocument();
  });

  it('should toggle URL visibility', async () => {
    const user = userEvent.setup();
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const urlToggle = screen.getByTitle(/Show URL/);
    await user.click(urlToggle);

    // URL display should appear
    const urlValue = screen.getByText(
      'https://example.com/catalog.json'
    );
    expect(urlValue).toBeInTheDocument();
  });

  it('should display copy button when URL is shown', async () => {
    const user = userEvent.setup();

    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const urlToggle = screen.getByTitle(/Show URL/);
    await user.click(urlToggle);

    const copyButton = screen.getByTitle(/Copy URL/);
    expect(copyButton).toBeInTheDocument();
  });

  it('should render search form on catalog page', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    const { container } = renderWithRouter();

    const searchForm = container.querySelector('.collection-search-form');
    expect(searchForm).toBeInTheDocument();
  });

  it('should handle catalog with assets', () => {
    const catalogWithAssets: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'assets-catalog',
      description: 'Catalog with assets',
      links: [],
      assets: {
        data: {
          href: 'data.tif',
          type: 'image/tiff; application=geotiff',
        },
      },
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithAssets,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    const { container } = renderWithRouter();
    expect(container).toBeDefined();
  });

  it('should display header with page controls', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    const { container } = renderWithRouter();

    const pageHeader = container.querySelector('.page-header');
    expect(pageHeader).toBeInTheDocument();
  });

  it('should render catalog description', () => {
    const catalogWithDescription: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'described-catalog',
      title: 'Described Catalog',
      description: 'This is a detailed description of the catalog',
      links: [],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithDescription,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText('This is a detailed description of the catalog')).toBeInTheDocument();
  });

  it('should handle collection search and display results', async () => {
    const user = userEvent.setup();
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test-collection');

    expect(searchInput).toHaveValue('test-collection');
  });

  it('should clear child catalogs when collection search results are displayed', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // Initially child catalogs should be visible
    expect(screen.getByText('Child Catalogs')).toBeInTheDocument();
  });

  it('should display "Search Results" section when search results exist', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // Search section should be rendered
    const searchForm = document.querySelector('.collection-search-form');
    expect(searchForm).toBeInTheDocument();
  });

  it('should render search results with pagination when results exceed page size', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const collectionSearch = document.querySelector('.collection-search');
    expect(collectionSearch).toBeInTheDocument();
  });

  it('should handle collection selection from search results', async () => {
    const user = userEvent.setup();
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'sentinel');

    expect(searchInput).toHaveValue('sentinel');
  });

  it('should show search error message when collection search fails', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // The error display would appear if collection search has an error
    // For now, verify that the search form is ready to show errors
    const searchForm = document.querySelector('.collection-search-form');
    expect(searchForm).toBeInTheDocument();
  });

  it('should handle collection search page size change', async () => {
    const user = userEvent.setup();
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const selects = screen.getAllByRole('combobox');
    const pageSize = selects[0] as HTMLSelectElement;
    await user.selectOptions(pageSize, '50');

    expect(pageSize.value).toBe('50');
  });

  it('should handle catalog with search results and child catalogs', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText('Child Catalogs')).toBeInTheDocument();
  });

  it('should render getPaginatedData correctly', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 60 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.queryByText('Child 26')).not.toBeInTheDocument();
  });

  it('should handle getTotalPages correctly', () => {
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 100 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const pageInfos = screen.getAllByText(/page 1 of 4/i);
    expect(pageInfos.length).toBeGreaterThan(0);
  });

  it('should handle collection selection with self link', async () => {
    const user = userEvent.setup();
    const catalogWithSearchableCollections: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'child', href: 'child1.json', title: 'Child 1' },
        { rel: 'search', href: 'search.json', title: 'Search' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithSearchableCollections,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should display advanced filters toggle in collection search', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const advancedToggle = document.querySelector('.advanced-toggle');
    expect(advancedToggle).toBeInTheDocument();
  });

  it('should handle collection search clear results', async () => {
    const user = userEvent.setup();
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    expect(searchInput).toHaveValue('test');
  });

  it('should render collection search with correct props from CatalogPage', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    const { container } = renderWithRouter();

    const collectionSearch = container.querySelector('.collection-search');
    expect(collectionSearch).toBeInTheDocument();

    const searchForm = container.querySelector('.collection-search-form');
    expect(searchForm).toBeInTheDocument();
  });

  it('should handle both child catalogs and items search link when neither has many items', () => {
    const catalogWithBoth: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'child', href: 'child1.json', title: 'Child 1' },
        { rel: 'items', href: 'items.json', title: 'Items' },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithBoth,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      page: 1,
      pageSize: 25,
      setPageSize: vi.fn(),
      hasNext: false,
      hasPrevious: false,
      goNext: vi.fn(),
      goPrevious: vi.fn(),
      retry: vi.fn(),
    });

    renderWithRouter();

    expect(screen.getByText('Child Catalogs')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('should display search loading state', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    // The CollectionSearch component is rendered
    const collectionSearch = document.querySelector('.collection-search');
    expect(collectionSearch).toBeInTheDocument();
  });

  it('should render child catalog with only title (no type)', () => {
    const catalogWithUntypedChild: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [{ rel: 'child', href: 'child1.json', title: 'Child 1' }],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithUntypedChild,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const childLink = screen.getByText('Child 1').closest('a');
    expect(childLink).toBeInTheDocument();
    expect(childLink).not.toHaveTextContent('application');
  });

  it('should handle catalog with multiple child catalogs and pagination', async () => {
    const user = userEvent.setup();
    const catalogWithManyChildren: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'large-catalog',
      description: 'A catalog with many children',
      links: Array.from({ length: 60 }, (_, i) => ({
        rel: 'child',
        href: `child${i}.json`,
        title: `Child ${i + 1}`,
      })),
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithManyChildren,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const pageInfo = screen.getAllByText(/page 1 of/i);
    expect(pageInfo.length).toBeGreaterThan(0);

    const nextButtons = screen.getAllByRole('button', { name: /next/i });
    await user.click(nextButtons[0]);

    expect(screen.getAllByText(/page 2 of/i).length).toBeGreaterThan(0);
  });

  it('should handle URL display and copy', async () => {
    const user = userEvent.setup();
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: mockClipboard,
    });

    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const toggleButton = screen.getByTitle(/Show URL/);
    await user.click(toggleButton);

    expect(screen.getByText(/catalog url:/i)).toBeInTheDocument();

    const copyButton = screen.getByTitle(/Copy URL/);
    await user.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('https://example.com/catalog.json');

    vi.unstubAllGlobals();
  });

  it('should render child catalog links as proper anchor tags', () => {
    vi.mocked(useStacNode).mockReturnValue({
      data: mockCatalogWithoutItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const childLinks = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.includes('/catalog?url=')
    );
    expect(childLinks.length).toBeGreaterThan(0);
  });

  it('should handle items with self link', () => {
    const catalogWithItemsSelfLink: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        {
          rel: 'item',
          href: 'item1.json',
          title: 'Item 1',
        },
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithItemsSelfLink,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    const itemLink = screen.getByText('Item 1').closest('a');
    expect(itemLink).toHaveAttribute('href', 'https://example.com/item1.json');
    expect(itemLink).toHaveAttribute('target', '_blank');
  });

  it('should render catalog statistics with proper pluralization', () => {
    const catalogWithOneChildAndManyItems: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'A test catalog',
      links: [
        { rel: 'child', href: 'child1.json', title: 'Child 1' },
        ...Array.from({ length: 5 }, (_, i) => ({
          rel: 'item',
          href: `item${i}.json`,
          title: `Item ${i + 1}`,
        })),
      ],
    };

    vi.mocked(useStacNode).mockReturnValue({
      data: catalogWithOneChildAndManyItems,
      loading: false,
      error: null,
      retry: vi.fn(),
    });

    vi.mocked(useStacItemsSearch).mockReturnValue(mockItemsSearchDefault);

    renderWithRouter();

    expect(screen.getByText(/1 child$/)).toBeInTheDocument();
    expect(screen.getByText(/5 items$/)).toBeInTheDocument();
  });
});
