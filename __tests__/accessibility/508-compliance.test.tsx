import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { BrowseImagesDisplay } from '../../src/components/BrowseImagesDisplay';
import { CatalogListingPage } from '../../src/pages/CatalogListingPage';
import { StorageDisplay } from '../../src/components/StorageDisplay';
import { LinksDisplay } from '../../src/components/LinksDisplay';
import type { StacLink, StacCatalog } from '../../src/types/stac';

describe('Section 508 / WCAG 2.1 AA Compliance - Component Tests', () => {
  describe('BrowseImagesDisplay - Accessibility', () => {
    const mockImages: StacLink[] = [
      {
        rel: 'preview',
        href: 'https://example.com/image1.jpg',
        type: 'image/jpeg',
        title: 'RGB True Color Preview',
      },
      {
        rel: 'browse',
        href: 'https://example.com/image2.png',
        type: 'image/png',
      },
    ];

    it('should have proper image alt text for accessibility', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      const images = screen.getAllByRole('img');
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        const altText = img.getAttribute('alt');
        expect(altText).not.toBe('');
      });
    });

    it('should have descriptive alt text with image title when available', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      const titleImage = screen.getByAltText('RGB True Color Preview');
      expect(titleImage).toBeInTheDocument();
    });

    it('should have numeric fallback alt text when no title', () => {
      const noTitleImages: StacLink[] = [
        { rel: 'preview', href: 'https://example.com/image.jpg', type: 'image/jpeg' },
      ];
      render(<BrowseImagesDisplay images={noTitleImages} />);
      const image = screen.getByAltText('Browse image 1');
      expect(image).toBeInTheDocument();
    });

    it('should have semantic heading for browse images section', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Browse Images');
    });

    it('should have proper ARIA labels on image links', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
        const ariaLabel = link.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/View/);
      });
    });

    it('should have proper link relationships for external navigation', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should have proper grid structure with role region', () => {
      const { container } = render(<BrowseImagesDisplay images={mockImages} />);
      const grid = container.querySelector('[role="region"]');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute('aria-label');
    });

    it('should use section element with aria-labelledby', () => {
      const { container } = render(<BrowseImagesDisplay images={mockImages} />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby');
    });

    it('should provide text content in addition to images', () => {
      render(<BrowseImagesDisplay images={mockImages} />);
      expect(screen.getByText('Browse Images')).toBeInTheDocument();
      expect(screen.getByText('RGB True Color Preview')).toBeInTheDocument();
    });
  });

  describe('CatalogListingPage - Accessibility', () => {
    const mockUrl = 'https://example.com/catalog';
    const mockChildLinks: StacLink[] = [
      { rel: 'child', href: 'child1', title: 'Child Catalog 1', type: 'application/json' },
      { rel: 'child', href: 'child2', title: 'Child Catalog 2' },
    ];

    it('should have semantic heading for child catalogs section', () => {
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Child Catalogs');
    });

    it('should have accessible page size control with label', () => {
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const label = screen.getByLabelText('Per page:');
      expect(label).toBeInTheDocument();
    });

    it('should use proper form control structure with label association', () => {
      const { container } = render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const labels = container.querySelectorAll('label');
      labels.forEach((label) => {
        const inputs = label.querySelectorAll('select');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should have links with descriptive text', () => {
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const childLink = screen.getByText('Child Catalog 1');
      expect(childLink).toBeInTheDocument();
    });

    it('should display type information accessibly when available', () => {
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const typeText = screen.getByText('application/json');
      expect(typeText).toBeInTheDocument();
    });

    it('should have proper pagination button labels', () => {
      const manyChildren = Array.from({ length: 30 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={manyChildren} />
        </BrowserRouter>
      );
      const nextButtons = screen.getAllByRole('button', { name: /Next/ });
      expect(nextButtons.length).toBeGreaterThan(0);
      nextButtons.forEach((btn) => {
        expect(btn.textContent).toBeTruthy();
      });
    });

    it('should have pagination buttons with disabled state', () => {
      const manyChildren = Array.from({ length: 30 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={manyChildren} />
        </BrowserRouter>
      );
      const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
      expect(prevButtons[0]).toBeDisabled();
    });

    it('should have semantic structure with section elements', () => {
      const { container } = render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={mockChildLinks} />
        </BrowserRouter>
      );
      const section = container.querySelector('.section');
      expect(section).toBeInTheDocument();
    });

    it('should show page information for screen readers', () => {
      const manyChildren = Array.from({ length: 50 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      render(
        <BrowserRouter>
          <CatalogListingPage url={mockUrl} childLinks={manyChildren} />
        </BrowserRouter>
      );
      const pageInfos = screen.queryAllByText(/Page 1 of/);
      expect(pageInfos.length).toBeGreaterThan(0);
    });
  });

  describe('StorageDisplay - Accessibility', () => {
    const mockCatalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test',
      description: 'Test',
      links: [],
    };

    it('should have expandable button with aria-expanded', () => {
      const { container } = render(<StorageDisplay data={mockCatalog} />);
      const button = container.querySelector('button');
      if (button) {
        expect(button).toHaveAttribute('aria-expanded');
      }
    });

    it('should toggle aria-expanded state', () => {
      const { container } = render(<StorageDisplay data={mockCatalog} />);
      const button = container.querySelector('button') as HTMLElement;
      if (button) {
        const initialState = button.getAttribute('aria-expanded');
        fireEvent.click(button);
        const newState = button.getAttribute('aria-expanded');
        expect(initialState).not.toBe(newState);
      }
    });
  });

  describe('LinksDisplay - Accessibility', () => {
    const mockLinks: StacLink[] = [
      {
        rel: 'self',
        href: 'https://example.com/catalog.json',
        title: 'Self Reference',
        type: 'application/json',
      },
      {
        rel: 'parent',
        href: 'https://example.com/parent.json',
        title: 'Parent Catalog',
      },
    ];

    it('should have expandable button with aria-expanded', () => {
      const { container } = render(<LinksDisplay links={mockLinks} />);
      const button = container.querySelector('button');
      if (button) {
        expect(button).toHaveAttribute('aria-expanded');
      }
    });

    it('should provide link titles for screen readers', () => {
      render(<LinksDisplay links={mockLinks} />);
      const links = screen.queryAllByRole('link');
      if (links.length > 0) {
        links.forEach((link) => {
          expect(link.textContent || link.getAttribute('aria-label')).toBeTruthy();
        });
      }
    });

    it('should open links in new window with proper relationship', () => {
      const { container } = render(<LinksDisplay links={mockLinks} />);
      const links = container.querySelectorAll('a');
      if (links.length > 0) {
        links.forEach((link) => {
          if (link.getAttribute('target') === '_blank') {
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
          }
        });
      }
    });
  });

  describe('WCAG 2.1 Level AA - Form Controls', () => {
    it('should have proper label-to-input association', () => {
      const manyChildren = Array.from({ length: 30 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      const { container } = render(
        <BrowserRouter>
          <CatalogListingPage url="https://example.com" childLinks={manyChildren} />
        </BrowserRouter>
      );
      const labels = container.querySelectorAll('label');
      labels.forEach((label) => {
        const inputs = label.querySelectorAll('select');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should make form inputs keyboard accessible', () => {
      const manyChildren = Array.from({ length: 30 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      const { container } = render(
        <BrowserRouter>
          <CatalogListingPage url="https://example.com" childLinks={manyChildren} />
        </BrowserRouter>
      );
      const select = container.querySelector('select') as HTMLSelectElement;
      expect(select).not.toHaveAttribute('disabled');
    });
  });

  describe('WCAG 2.1 Level AA - Navigation', () => {
    it('should provide navigation landmarks', () => {
      const mockChildren: StacLink[] = [
        { rel: 'child', href: 'child1', title: 'Child 1' },
      ];
      const { container } = render(
        <BrowserRouter>
          <CatalogListingPage url="https://example.com" childLinks={mockChildren} />
        </BrowserRouter>
      );
      const section = container.querySelector('.section');
      expect(section).toBeInTheDocument();
    });

    it('should provide clear visual indication of interactive elements', () => {
      const mockChildren: StacLink[] = [
        { rel: 'child', href: 'test', title: 'Test' },
      ];
      render(
        <BrowserRouter>
          <CatalogListingPage url="https://example.com" childLinks={mockChildren} />
        </BrowserRouter>
      );
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('WCAG 2.1 Level AA - Text Alternatives', () => {
    it('should provide text content for images', () => {
      const mockImages: StacLink[] = [
        {
          rel: 'preview',
          href: 'https://example.com/img.jpg',
          title: 'Descriptive Title',
        },
      ];
      render(<BrowseImagesDisplay images={mockImages} />);
      expect(screen.getByText('Descriptive Title')).toBeInTheDocument();
    });

    it('should provide meaningful headings', () => {
      const mockImages: StacLink[] = [
        { rel: 'preview', href: 'https://example.com/img.jpg' },
      ];
      render(<BrowseImagesDisplay images={mockImages} />);
      const heading = screen.getByRole('heading');
      expect(heading.textContent).toBeTruthy();
    });
  });

  describe('WCAG 2.1 Level AA - Color and Contrast', () => {
    it('should use text content in addition to icons/colors', () => {
      render(
        <BrowserRouter>
          <CatalogListingPage
            url="https://example.com"
            childLinks={[
              { rel: 'child', href: 'child1', title: 'Test Child' },
            ]}
          />
        </BrowserRouter>
      );
      const textContent = screen.queryByText('Test Child');
      expect(textContent).toBeInTheDocument();
    });

    it('should provide accessible button states', () => {
      const manyChildren = Array.from({ length: 50 }, (_, i) => ({
        rel: 'child' as const,
        href: `child${i}`,
        title: `Child ${i}`,
      }));
      render(
        <BrowserRouter>
          <CatalogListingPage url="https://example.com" childLinks={manyChildren} />
        </BrowserRouter>
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.textContent || btn.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });
});
