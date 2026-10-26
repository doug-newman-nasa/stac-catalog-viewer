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
    vi.mocked(collectionSearch.buildCollectionSearchUrl).mockReturnValue('https://example.com/collections?limit=25');
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
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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
      expect(vi.mocked(collectionSearch.fetchCollectionsPage)).toHaveBeenCalled();
    });
  });

  it('should display search results when available', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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

    vi.mocked(collectionSearch.fetchCollectionsPage).mockReturnValue(searchPromise as any);

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
    vi.mocked(collectionSearch.fetchCollectionsPage).mockRejectedValue(error);

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
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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

    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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

    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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

  it('should call onResultsChange when results change', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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
    vi.mocked(collectionSearch.fetchCollectionsPage).mockResolvedValue({
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

  it('should not render search results section if no results and not loading', () => {
    renderComponent();
    expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
  });

  describe('server-driven pagination', () => {
    const firstPageUrl = 'https://example.com/collections?limit=25';
    const secondPageUrl = 'https://example.com/collections?limit=25&cursor=page2';

    const makeCollections = (start: number, count: number): StacCatalog[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `collection${start + i}`,
        title: `Collection ${start + i}`,
        description: `Test collection ${start + i}`,
        stac_version: '1.0.0',
        type: 'Collection' as const,
        links: [],
      }));

    beforeEach(() => {
      vi.mocked(collectionSearch.fetchCollectionsPage).mockImplementation(async (url: string) =>
        url === secondPageUrl
          ? { collections: makeCollections(25, 25), numberReturned: 25 }
          : { collections: makeCollections(0, 25), numberReturned: 25, nextUrl: secondPageUrl }
      );
    });

    const runSearch = async () => {
      const user = userEvent.setup();
      renderComponent();
      await user.type(screen.getByPlaceholderText(/Search by title/i), 'test');
      await user.click(screen.getByRole('button', { name: /Search Collections/i }));
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
      return user;
    };

    it('should only request the next server page when Next is clicked', async () => {
      const user = await runSearch();

      expect(collectionSearch.fetchCollectionsPage).toHaveBeenCalledTimes(1);
      expect(collectionSearch.fetchCollectionsPage).toHaveBeenCalledWith(firstPageUrl);
      expect(screen.getAllByText('Page 1').length).toBeGreaterThan(0);

      await user.click(screen.getAllByRole('button', { name: /Next →/ })[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Page 2').length).toBeGreaterThan(0);
      });
      expect(collectionSearch.fetchCollectionsPage).toHaveBeenLastCalledWith(secondPageUrl);
      expect(screen.getByText('Collection 25')).toBeInTheDocument();
    });

    it('should disable Previous on the first page and Next on the last page', async () => {
      const user = await runSearch();

      screen.getAllByRole('button', { name: /← Previous/ }).forEach((btn) => expect(btn).toBeDisabled());
      expect(screen.getAllByRole('button', { name: /Next →/ })[0]).toBeEnabled();

      await user.click(screen.getAllByRole('button', { name: /Next →/ })[1]);

      await waitFor(() => {
        expect(screen.getAllByText('Page 2').length).toBeGreaterThan(0);
      });
      screen.getAllByRole('button', { name: /Next →/ }).forEach((btn) => expect(btn).toBeDisabled());
    });

    it('should return to a page already loaded without requesting it again', async () => {
      const user = await runSearch();

      await user.click(screen.getAllByRole('button', { name: /Next →/ })[0]);
      await waitFor(() => {
        expect(screen.getAllByText('Page 2').length).toBeGreaterThan(0);
      });

      await user.click(screen.getAllByRole('button', { name: /← Previous/ })[1]);

      await waitFor(() => {
        expect(screen.getAllByText('Page 1').length).toBeGreaterThan(0);
      });
      expect(screen.getByText('Collection 0')).toBeInTheDocument();
      expect(collectionSearch.fetchCollectionsPage).toHaveBeenCalledTimes(2);
    });
  });
});
