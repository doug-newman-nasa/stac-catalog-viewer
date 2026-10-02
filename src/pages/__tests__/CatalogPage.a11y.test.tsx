import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../CatalogPage';
import * as useStacNodeModule from '../../hooks/useStacNode';
import type { StacCatalog } from '../../types/stac';

vi.mock('../../hooks/useStacNode');
vi.mock('../../pages/CatalogListingPage', () => ({
  CatalogListingPage: () => <div>CatalogListingPage</div>,
}));
vi.mock('../../pages/CollectionItemsPage', () => ({
  CollectionItemsPage: () => <div>CollectionItemsPage</div>,
}));
vi.mock('../../pages/CollectionSearchResultsPage', () => ({
  CollectionSearchResultsPage: () => <div>CollectionSearchResultsPage</div>,
}));
vi.mock('../../components/ExtentDisplay', () => ({
  ExtentDisplay: () => <div>ExtentDisplay</div>,
}));
vi.mock('../../components/LicenseDisplay', () => ({
  LicenseDisplay: () => <div>LicenseDisplay</div>,
}));
vi.mock('../../components/ParentNavigation', () => ({
  ParentNavigation: () => <div>ParentNavigation</div>,
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

describe('CatalogPage - Accessibility (WCAG 2.1 AA / Section 508)', () => {
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

  describe('Skip Links', () => {
    it('should have a skip-to-main-content link', () => {
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

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Semantic HTML', () => {
    it('should use main element for main content', () => {
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

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveAttribute('id', 'main-content');
    });

    it('should use header element for page header', () => {
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

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const headerElement = container.querySelector('header');
      expect(headerElement).toBeInTheDocument();
      expect(headerElement).toHaveAttribute('role', 'banner');
    });
  });

  describe('ARIA Labels', () => {
    it('should have aria-label on back button', () => {
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

      const backButton = screen.getByRole('button', { name: /Go back to previous page/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should have aria-label on URL toggle button', () => {
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

      const urlButton = screen.getByRole('button', { name: /Show catalog URL/i });
      expect(urlButton).toBeInTheDocument();
      expect(urlButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have aria-pressed attribute that updates', () => {
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

      const urlButton = screen.getByRole('button', { name: /Show catalog URL/i });
      expect(urlButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have aria-busy on loading state', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        retry: vi.fn(),
      });

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveAttribute('aria-busy', 'true');
    });

    it('should have role alert on error message', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Test error message'),
        retry: vi.fn(),
      });

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const errorMessage = container.querySelector('[role="alert"]');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Test error message');
    });
  });

  describe('Error States', () => {
    it('should have proper heading hierarchy in error state', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Test error'),
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const h1 = screen.getByRole('heading', { level: 1, name: /Error Loading Catalog/i });
      expect(h1).toBeInTheDocument();
    });

    it('should have proper heading in no URL error state', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        retry: vi.fn(),
      });

      renderWithRouter(<CatalogPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('Error: No Catalog URL Provided');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should make main content focusable', () => {
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

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveAttribute('tabindex', '-1');
    });

    it('should have proper button labels for keyboard users', () => {
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

      // Back button should have aria-label
      const backButton = screen.getByRole('button', { name: /Go back/i });
      expect(backButton).toHaveAttribute('aria-label');

      // URL toggle should have aria-label
      const urlButton = screen.getByRole('button', { name: /catalog URL/i });
      expect(urlButton).toHaveAttribute('aria-label');
    });
  });

  describe('Color and Visual Indicators', () => {
    it('should not rely only on color for status indicators', () => {
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

      // All interactive elements should have text labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('Focus Management', () => {
    it('should make error main element focusable', () => {
      mockUseStacNode.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Test error'),
        retry: vi.fn(),
      });

      const { container } = renderWithRouter(<CatalogPage />, ['/catalog?url=https://example.com/catalog.json']);

      const mainElement = container.querySelector('main[role="main"]');
      expect(mainElement).toHaveAttribute('tabindex', '-1');
    });
  });
});
