import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CatalogListingPage } from '../../src/pages/CatalogListingPage';
import type { StacLink } from '../../src/types/stac';

describe('CatalogListingPage', () => {
  const mockUrl = 'https://example.com/catalog';
  const mockChildLinks: StacLink[] = [
    { rel: 'child', href: 'child1', title: 'Child Catalog 1', type: 'application/json' },
    { rel: 'child', href: 'child2', title: 'Child Catalog 2', type: 'application/json' },
    { rel: 'child', href: 'child3', title: 'Child Catalog 3', type: 'application/json' },
  ];

  const renderComponent = (childLinks = mockChildLinks) => {
    return render(
      <BrowserRouter>
        <CatalogListingPage url={mockUrl} childLinks={childLinks} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render section title', () => {
    renderComponent();
    expect(screen.getByText('Child Catalogs')).toBeInTheDocument();
  });

  it('should render all child links', () => {
    renderComponent();
    expect(screen.getByText('Child Catalog 1')).toBeInTheDocument();
    expect(screen.getByText('Child Catalog 2')).toBeInTheDocument();
    expect(screen.getByText('Child Catalog 3')).toBeInTheDocument();
  });

  it('should render child link with type', () => {
    renderComponent();
    const typeElements = screen.getAllByText('application/json');
    expect(typeElements.length).toBeGreaterThan(0);
  });

  it('should render page size select', () => {
    renderComponent();
    const select = screen.getByDisplayValue('25');
    expect(select).toBeInTheDocument();
  });

  it('should have pagination controls when there are multiple pages', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const pageInfo = screen.queryAllByText(/Page \d+ of \d+/);
    expect(pageInfo.length).toBeGreaterThan(0);
  });

  it('should disable previous button on first page', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    prevButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('should enable next button when not on last page', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    expect(nextButtons[0]).not.toBeDisabled();
  });

  it('should handle pagination page size change', () => {
    renderComponent();
    const select = screen.getByDisplayValue('25');
    fireEvent.change(select, { target: { value: '10' } });
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('should navigate to correct URL for child links', () => {
    renderComponent();
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/catalog?url=https%3A%2F%2Fexample.com%2Fchild1');
  });

  it('should not render pagination when all items fit on one page', () => {
    const singleChild: StacLink[] = [{ rel: 'child', href: 'child', title: 'Child' }];
    renderComponent(singleChild);
    const paginationElements = screen.queryAllByText(/Page \d+ of \d+/);
    expect(paginationElements).toHaveLength(0);
  });

  it('should show untitled for child without title', () => {
    const childWithoutTitle: StacLink[] = [{ rel: 'child', href: 'child' }];
    renderComponent(childWithoutTitle);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('should change page when next button is clicked', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    const pageInfoElements = screen.getAllByText('Page 2 of 2');
    expect(pageInfoElements.length).toBeGreaterThan(0);
  });

  it('should display correct page info', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const pageInfoElements = screen.getAllByText('Page 1 of 2');
    expect(pageInfoElements.length).toBeGreaterThan(0); // pagination-top and pagination-bottom
  });
});
