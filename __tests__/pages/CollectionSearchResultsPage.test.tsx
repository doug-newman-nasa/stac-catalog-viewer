import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionSearchResultsPage } from '../../src/pages/CollectionSearchResultsPage';
import * as collectionSearch from '../../src/lib/collectionSearch';
import type { StacCatalog } from '../../src/types/stac';

vi.mock('../../src/lib/collectionSearch');

describe('CollectionSearchResultsPage', () => {
  const mockUrl = 'https://example.com/catalog';
  const mockOnNavigateToCollection = vi.fn();
  const mockOnResultsChange = vi.fn();

  const mockCatalogData: StacCatalog = {
    id: 'test-catalog',
    title: 'Test Catalog',
    description: 'A test catalog',
    stac_version: '1.0.0',
    type: 'Catalog',
    links: [
      { rel: 'search', href: 'https://example.com/search' },
      { rel: 'self', href: 'https://example.com/catalog' },
    ],
  };

  const mockCollections: StacCatalog[] = [
    {
      id: 'collection1',
      title: 'Collection 1',
      description: 'Test collection 1',
      stac_version: '1.0.0',
      type: 'Collection',
      links: [{ rel: 'self', href: 'https://example.com/collections/collection1' }],
    },
    {
      id: 'collection2',
      title: 'Collection 2',
      description: 'Test collection 2',
      stac_version: '1.0.0',
      type: 'Collection',
      links: [{ rel: 'self', href: 'https://example.com/collections/collection2' }],
    },
  ];

  const renderComponent = () => {
    return render(
      <CollectionSearchResultsPage
        url={mockUrl}
        catalogData={mockCatalogData}
        onNavigateToCollection={mockOnNavigateToCollection}
        onResultsChange={mockOnResultsChange}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the CollectionSearch component', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/Search by title/i)).toBeInTheDocument();
  });

  it('should call onSearchParamsChange when text input changes', async () => {
    const user = userEvent.setup();
    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'sentinel');
    expect(searchInput).toHaveValue('sentinel');
  });

  it('should call search on form submit', async () => {
    const user = userEvent.setup();
    const mockSearch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'sentinel');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(vi.mocked(collectionSearch.searchCollections)).toHaveBeenCalled();
    });
  });

  it('should display search results when available', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'collection');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });
  });

  it('should display loading state while searching', async () => {
    const user = userEvent.setup();
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    vi.mocked(collectionSearch.searchCollections).mockReturnValue(searchPromise as any);

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    // The button should show "Searching..." when loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Searching/i })).toBeInTheDocument();
    });

    resolveSearch({ collections: mockCollections, numberMatched: 2, numberReturned: 2 });
  });

  it('should display search error when search fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Search failed');
    vi.mocked(collectionSearch.searchCollections).mockRejectedValue(error);

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'bad');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });

  it('should clear search results when clear button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
    });
  });

  it('should navigate to collection when result is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'collection');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Collection 1')).toBeInTheDocument();
    });

    const collectionResult = screen.getByText('Collection 1').closest('.child-link');
    await user.click(collectionResult!);

    await waitFor(() => {
      expect(mockOnNavigateToCollection).toHaveBeenCalledWith(
        'https://example.com/collections/collection1',
        expect.objectContaining({ q: 'collection' })
      );
    });
  });

  it('should use collection id as fallback URL if no self link', async () => {
    const user = userEvent.setup();
    const collectionWithoutSelfLink: StacCatalog[] = [
      {
        id: 'collection1',
        title: 'Collection 1',
        description: 'Test collection 1',
        stac_version: '1.0.0',
        type: 'Collection',
        links: [],
      },
    ];

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: collectionWithoutSelfLink,
      numberMatched: 1,
      numberReturned: 1,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'collection');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Collection 1')).toBeInTheDocument();
    });

    const collectionResult = screen.getByText('Collection 1').closest('.child-link');
    await user.click(collectionResult!);

    await waitFor(() => {
      expect(mockOnNavigateToCollection).toHaveBeenCalledWith(
        `${mockUrl}/collection1`,
        expect.objectContaining({ q: 'collection' })
      );
    });
  });

  it('should display collection title or id', async () => {
    const user = userEvent.setup();
    const collectionWithoutTitle: StacCatalog[] = [
      {
        id: 'collection-without-title',
        description: 'Test collection',
        stac_version: '1.0.0',
        type: 'Collection',
        links: [],
      },
    ];

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: collectionWithoutTitle,
      numberMatched: 1,
      numberReturned: 1,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('collection-without-title')).toBeInTheDocument();
    });
  });

  it('should handle pagination of results', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [{ rel: 'self', href: `https://example.com/collections/collection${i}` }],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'collection');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Verify pagination controls exist
    const pageInfoElements = screen.getAllByText(/Page \d+ of \d+/);
    expect(pageInfoElements.length).toBeGreaterThan(0);
  });

  it('should change page when next button is clicked', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'collection');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    await user.click(nextButtons[0]);

    const pageInfoElements = screen.getAllByText('Page 2 of 2');
    expect(pageInfoElements.length).toBeGreaterThan(0);
  });

  it('should call onResultsChange when results change', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockOnResultsChange).toHaveBeenCalledWith(true);
    });
  });

  it('should call onResultsChange with false when results are cleared', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: mockCollections,
      numberMatched: 2,
      numberReturned: 2,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockOnResultsChange).toHaveBeenCalledWith(true);
    });

    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockOnResultsChange).toHaveBeenCalledWith(false);
    });
  });

  it('should reset page to 1 when search is performed', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Verify it's on page 1
    const pageInfoElements = screen.getAllByText('Page 1 of 2');
    expect(pageInfoElements.length).toBeGreaterThan(0);
  });

  it('should not render search results section if no results and not loading', () => {
    renderComponent();
    expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
  });

  it('should disable pagination controls at boundaries', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    prevButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('should click previous button on bottom pagination', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Go to page 2
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    await user.click(nextButtons[0]);

    await waitFor(() => {
      const pageInfoElements = screen.getAllByText('Page 2 of 2');
      expect(pageInfoElements.length).toBeGreaterThan(0);
    });

    // Click the bottom previous button (index 1)
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    await user.click(prevButtons[1]);

    await waitFor(() => {
      const pageInfoElements = screen.getAllByText('Page 1 of 2');
      expect(pageInfoElements.length).toBeGreaterThan(0);
    });
  });

  it('should click next button on bottom pagination', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Click the bottom next button (index 1)
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    await user.click(nextButtons[1]);

    await waitFor(() => {
      const pageInfoElements = screen.getAllByText('Page 2 of 2');
      expect(pageInfoElements.length).toBeGreaterThan(0);
    });
  });

  it('should click previous button on top pagination after navigating', async () => {
    const user = userEvent.setup();
    const manyCollections = Array.from({ length: 50 }, (_, i) => ({
      id: `collection${i}`,
      title: `Collection ${i}`,
      description: `Test collection ${i}`,
      stac_version: '1.0.0',
      type: 'Collection' as const,
      links: [],
    }));

    vi.mocked(collectionSearch.searchCollections).mockResolvedValue({
      collections: manyCollections,
      numberMatched: 50,
      numberReturned: 50,
    });

    renderComponent();
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    // Go to page 2 using top next button
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    await user.click(nextButtons[0]);

    await waitFor(() => {
      const pageInfoElements = screen.getAllByText('Page 2 of 2');
      expect(pageInfoElements.length).toBeGreaterThan(0);
    });

    // Click the top previous button (index 0)
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    await user.click(prevButtons[0]);

    await waitFor(() => {
      const pageInfoElements = screen.getAllByText('Page 1 of 2');
      expect(pageInfoElements.length).toBeGreaterThan(0);
    });
  });
});
