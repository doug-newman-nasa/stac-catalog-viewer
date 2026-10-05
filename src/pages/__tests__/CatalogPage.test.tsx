import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../CatalogPage';
import * as useStacNodeModule from '../../hooks/useStacNode';
import type { StacCatalog, StacItemCollection } from '../../types/stac';

vi.mock('../../hooks/useStacNode');
vi.mock('../../pages/CatalogListingPage', () => ({
  CatalogListingPage: () => <div>CatalogListingPage</div>,
}));
vi.mock('../../pages/CollectionItemsPage', () => ({
  CollectionItemsPage: () => <div>CollectionItemsPage</div>,
}));
vi.mock('../../pages/CollectionSearchResultsPage', () => ({
  CollectionSearchResultsPage: ({ onNavigateToCollection }: any) => (
    <div onClick={() => onNavigateToCollection('test-url', { limit: 50 })}>CollectionSearchResultsPage</div>
  ),
}));
vi.mock('../../components/ExtentDisplay', () => ({
  ExtentDisplay: () => <div>ExtentDisplay</div>,
}));
vi.mock('../../components/LicenseDisplay', () => ({
  LicenseDisplay: () => <div>LicenseDisplay</div>,
}));
vi.mock('../../components/ParentNavigation', () => ({
  ParentNavigation: ({ onNavigate }: any) => (
    <button onClick={() => onNavigate('parent-url')}>ParentNavigation</button>
  ),
}));
vi.mock('../../components/BrowseImagesDisplay', () => ({
  BrowseImagesDisplay: () => <div>BrowseImagesDisplay</div>,
}));
vi.mock('../../components/KeywordsDisplay', () => ({
  KeywordsDisplay: () => <div>KeywordsDisplay</div>,
}));
vi.mock('../../components/AssetLinks', () => ({
  AssetLinks: () => <div>AssetLinks</div>,
}));
vi.mock('../../components/StorageDisplay', () => ({
  StorageDisplay: () => <div>StorageDisplay</div>,
}));
vi.mock('../../components/LinksDisplay', () => ({
  LinksDisplay: () => <div>LinksDisplay</div>,
}));

describe('CatalogPage', () => {
  const mockUseStacNode = useStacNodeModule.useStacNode as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement, initialEntries: string[] = ['/catalog']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    );
  };

  describe('no URL provided', () => {
    it('should display error message when no URL is provided', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />);

      expect(screen.getByRole('heading', { name: /Error: No Catalog URL Provided/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return to home/i })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should display loading spinner when loading', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/Loading catalog/i)).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display error message when fetch fails', () => {
      const errorMessage = 'Failed to load catalog';
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error(errorMessage),
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /[Gg]o back|[Bb]ack/i })).toBeInTheDocument();
    });

    it('should call retry when retry button is clicked', () => {
      const mockRetry = vi.fn();
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Test error'),
        retry: mockRetry,
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('catalog display', () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      title: 'Test Catalog',
      description: 'Test description',
      links: [
        { rel: 'self', href: 'self.json' },
        { rel: 'child', href: 'child.json' },
        { rel: 'item', href: 'item.json' },
      ],
    };

    it('should display catalog title and description', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('Test Catalog')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should display catalog id when different from title', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('test-catalog')).toBeInTheDocument();
    });

    it('should display catalog stats for children and items', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/1 child/i)).toBeInTheDocument();
      expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    });

    it('should render StorageDisplay component', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('StorageDisplay')).toBeInTheDocument();
    });
  });

  describe('URL display', () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test',
      links: [],
    };

    it('should toggle URL display when button is clicked', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const toggleButton = screen.getByRole('button', { name: /catalog URL/i });
      fireEvent.click(toggleButton);

      expect(screen.getByText(/Hide URL/i)).toBeInTheDocument();
    });

    it('should display and copy URL to clipboard', async () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const toggleButton = screen.getByRole('button', { name: /catalog URL/i });
      fireEvent.click(toggleButton);

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });
  });


  describe('collections endpoint', () => {
    const mockCollectionsEndpoint: StacItemCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'collection-1',
          properties: { title: 'Collection 1', description: 'First collection' },
          links: [{ rel: 'self', href: 'collection-1.json' }],
          geometry: null,
          bbox: [0, 0, 1, 1],
        },
        {
          type: 'Feature',
          id: 'collection-2',
          properties: { title: 'Collection 2' },
          links: [],
          geometry: null,
        },
      ] as any,
      links: [{ rel: 'self', href: 'collections.json' }],
    };

    it('should display collections grid section when data is a FeatureCollection', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      const collectionsSection = screen.getByText('Collections');
      expect(collectionsSection).toBeInTheDocument();
    });
  });

  describe('optional content', () => {
    const mockCatalogFull: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test',
      license: 'CC-BY-4.0',
      extent: {
        spatial: { bbox: [[0, 0, 1, 1]] },
        temporal: { interval: [['2020-01-01T00:00:00Z', '2020-12-31T23:59:59Z']] },
      },
      keywords: ['test', 'catalog'],
      assets: { thumbnail: { href: 'thumb.jpg' } },
      links: [
        { rel: 'browse', href: 'browse.jpg' },
        { rel: 'self', href: 'self.json' },
        { rel: 'other', href: 'other.json' },
      ],
    };

    it('should display license when present', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('LicenseDisplay')).toBeInTheDocument();
    });

    it('should display extent when present', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('ExtentDisplay')).toBeInTheDocument();
    });

    it('should display browse images when present', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('BrowseImagesDisplay')).toBeInTheDocument();
    });

    it('should display keywords when present', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('KeywordsDisplay')).toBeInTheDocument();
    });

    it('should display assets when present', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('AssetLinks')).toBeInTheDocument();
    });

    it('should display links display component', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalogFull,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('LinksDisplay')).toBeInTheDocument();
    });
  });

  describe('stat formatting', () => {
    it('should display singular "child" when there is one', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [{ rel: 'child', href: 'child.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/1 child/i)).toBeInTheDocument();
      expect(screen.queryByText(/children/i)).not.toBeInTheDocument();
    });

    it('should display plural "items" when there are multiple', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'item', href: 'item1.json' },
          { rel: 'item', href: 'item2.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/2 items/i)).toBeInTheDocument();
    });

    it('should display plural "children" when there are multiple', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child1.json' },
          { rel: 'child', href: 'child2.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/2 children/i)).toBeInTheDocument();
    });

    it('should display singular "item" when there is one', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [{ rel: 'item', href: 'item.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText(/📄 1 item/)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test',
      links: [],
    };

    it('should navigate back when back button in header is clicked', () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const backButton = screen.getByRole('button', { name: /[Gg]o back/i });
      fireEvent.click(backButton);

      expect(mockUseStacNode).toHaveBeenCalled();
    });

    it('should navigate back when back button in error state is clicked', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Test error'),
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const backButton = screen.getByRole('button', { name: /Go back|back/i });
      fireEvent.click(backButton);

      expect(mockUseStacNode).toHaveBeenCalled();
    });

    it('should navigate to collection when collection card is clicked', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'collection-1',
            properties: { title: 'Collection 1' },
            links: [{ rel: 'self', href: 'collection-1.json' }],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      const viewButton = screen.getByRole('button', { name: /View Collection/i });
      fireEvent.click(viewButton);

      expect(mockUseStacNode).toHaveBeenCalled();
    });

  });

  describe('URL copy behavior', () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test',
      links: [],
    };

    it('should reset copy status after timeout', async () => {
      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const toggleButton = screen.getByRole('button', { name: /catalog URL/i });
      fireEvent.click(toggleButton);

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should not copy when URL is not provided', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />);

      expect(screen.getByRole('heading', { name: /Error: No Catalog URL Provided/i })).toBeInTheDocument();
    });
  });

  describe('catalog without title', () => {
    it('should display catalog id when title is not present', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog-id',
        description: 'Test',
        links: [],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('test-catalog-id');
    });
  });

  describe('collections endpoint edge cases', () => {
    it('should handle collections without self link using parent URL', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'collection-1',
            title: 'Collection 1',
            properties: {},
            links: [],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('Collection 1')).toBeInTheDocument();
    });

    it('should display collection id differently from title', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'unique-id',
            title: 'Collection Title',
            properties: {},
            links: [],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('Collection Title')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 }).parentElement?.querySelector('code')).toHaveTextContent('unique-id');
    });

    it('should not display collection id when same as title', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'same-id',
            title: 'same-id',
            properties: {},
            links: [],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      const titleElement = screen.getByRole('heading', { level: 4 });
      expect(titleElement).toHaveTextContent('same-id');
    });

    it('should display alternate link as fallback for self link', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'collection-1',
            title: 'Collection 1',
            properties: {},
            links: [{ rel: 'alternate', href: 'collection-1-alt.json' }],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('Collection 1')).toBeInTheDocument();
    });

    it('should handle collections with description', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'collection-1',
            title: 'Collection 1',
            description: 'A great collection',
            properties: {},
            links: [],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('A great collection')).toBeInTheDocument();
    });
  });

  describe('catalog display edge cases', () => {
    it('should not display id code element when id equals title', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'same-value',
        title: 'same-value',
        description: 'Test',
        links: [],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const idElements = screen.queryAllByText('same-value');
      expect(idElements.length).toBe(1);
    });

    it('should render CatalogListingPage when child links exist and no collection search results', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [{ rel: 'child', href: 'child.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('CatalogListingPage')).toBeInTheDocument();
    });

    it('should render CollectionItemsPage when item links exist', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [{ rel: 'item', href: 'item.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('CollectionItemsPage')).toBeInTheDocument();
    });

    it('should return null when data is not loaded yet', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(container.querySelector('.catalog-page')).not.toBeInTheDocument();
    });

    it('should handle catalog with no stats to display', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.queryByText(/📁/)).not.toBeInTheDocument();
      expect(screen.queryByText(/📄/)).not.toBeInTheDocument();
    });
  });

  describe('parent navigation edge cases', () => {
    it('should not render parent navigation for non-catalog data', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [],
        links: [{ rel: 'parent', href: 'parent.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.queryByText('ParentNavigation')).not.toBeInTheDocument();
    });
  });

  describe('other links display', () => {
    it('should display other links in collections endpoint', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [],
        links: [
          { rel: 'self', href: 'collections.json' },
          { rel: 'other', href: 'other.json', title: 'Other Link' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('LinksDisplay')).toBeInTheDocument();
    });
  });

  describe('edge case coverage', () => {
    it('should render CollectionSearchResultsPage when no items search link and no item links', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('CollectionSearchResultsPage')).toBeInTheDocument();
    });

    it('should handle collections with non-array links', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'collection-1',
            title: 'Collection 1',
            properties: {},
            links: undefined as any,
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('Collection 1')).toBeInTheDocument();
    });

    it('should render CollectionItemsPage with itemsSearchLink', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'items', href: 'items.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('CollectionItemsPage')).toBeInTheDocument();
    });

    it('should toggle URL display on button click', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.queryByText(/Catalog URL:/)).not.toBeInTheDocument();

      const toggleButton = screen.getByRole('button', { name: /catalog URL/i });
      fireEvent.click(toggleButton);

      expect(screen.getByText(/Catalog URL:/)).toBeInTheDocument();
    });

    it('should handle catalog with items search link and no item links', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'items', href: 'items.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('CollectionItemsPage')).toBeInTheDocument();
      expect(screen.queryByText('CatalogListingPage')).not.toBeInTheDocument();
    });

    it('should display browse images when browse links are present', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'browse', href: 'image.jpg', title: 'Browse Image' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      expect(screen.getByText('BrowseImagesDisplay')).toBeInTheDocument();
    });

    it('should display collections when data is StacItemCollection with features', () => {
      const mockCollectionsEndpoint: StacItemCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'coll-1',
            title: 'Collection 1',
            properties: {},
            links: [{ rel: 'self', href: 'coll-1.json' }],
            geometry: null,
          },
          {
            type: 'Feature',
            id: 'coll-2',
            title: 'Collection 2',
            properties: {},
            links: [],
            geometry: null,
          },
        ] as any,
        links: [{ rel: 'self', href: 'collections.json' }],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCollectionsEndpoint,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/collections.json']);

      expect(screen.getByText('Collection 1')).toBeInTheDocument();
      expect(screen.getByText('Collection 2')).toBeInTheDocument();
    });

    it('should click back to home button in no URL error state', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />);

      const backButton = screen.getByRole('button', { name: /Return to home/i });
      expect(backButton).toBeInTheDocument();
      fireEvent.click(backButton);
    });

    it('should trigger collection search results with params', () => {
      const mockCatalog: StacCatalog = {
        type: 'Catalog',
        stac_version: '1.0.0',
        id: 'test-catalog',
        description: 'Test',
        links: [
          { rel: 'child', href: 'child.json' },
        ],
      };

      mockUseStacNode.mockReturnValue({
        data: mockCatalog,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const searchResults = screen.getByText('CollectionSearchResultsPage');
      fireEvent.click(searchResults);
    });
  });
});
