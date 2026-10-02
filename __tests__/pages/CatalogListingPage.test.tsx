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

  it('should navigate to next page using bottom pagination', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    const bottomNextButton = nextButtons[nextButtons.length - 1];
    fireEvent.click(bottomNextButton);
    const pageInfoElements = screen.getAllByText('Page 2 of 2');
    expect(pageInfoElements.length).toBeGreaterThan(0);
  });

  it('should navigate to previous page using bottom pagination', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    expect(screen.getAllByText('Page 2 of 2').length).toBeGreaterThan(0);
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    const bottomPrevButton = prevButtons[prevButtons.length - 1];
    fireEvent.click(bottomPrevButton);
    expect(screen.getAllByText('Page 1 of 2').length).toBeGreaterThan(0);
  });

  it('should disable previous button on bottom pagination when on first page', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    const bottomPrevButton = prevButtons[prevButtons.length - 1];
    expect(bottomPrevButton).toBeDisabled();
  });

  it('should enable previous button on bottom pagination when not on first page', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    const bottomPrevButton = prevButtons[prevButtons.length - 1];
    expect(bottomPrevButton).not.toBeDisabled();
  });

  it('should disable next button on bottom pagination when on last page', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    const bottomNextButton = nextButtons[nextButtons.length - 1];
    expect(bottomNextButton).toBeDisabled();
  });

  it('should enable next button on bottom pagination when not on last page', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    const bottomNextButton = nextButtons[nextButtons.length - 1];
    expect(bottomNextButton).not.toBeDisabled();
  });

  it('should reset to first page when page size changes', () => {
    const manyChildren = Array.from({ length: 60 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    expect(screen.getByText('Child 25')).toBeInTheDocument();
    const select = screen.getByDisplayValue('25');
    fireEvent.change(select, { target: { value: '10' } });
    expect(screen.getByText('Child 0')).toBeInTheDocument();
    expect(screen.getByText('Child 9')).toBeInTheDocument();
  });

  it('should render all child links on first page correctly', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    expect(screen.getByText('Child 0')).toBeInTheDocument();
    expect(screen.getByText('Child 24')).toBeInTheDocument();
    expect(screen.queryByText('Child 25')).not.toBeInTheDocument();
  });

  it('should render correct child links on second page', () => {
    const manyChildren = Array.from({ length: 30 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    expect(screen.queryByText('Child 0')).not.toBeInTheDocument();
    expect(screen.getByText('Child 25')).toBeInTheDocument();
    expect(screen.getByText('Child 29')).toBeInTheDocument();
  });

  it('should handle exactly one page of children with pagination', () => {
    const twentyFiveChildren = Array.from({ length: 25 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(twentyFiveChildren);
    const pageInfo = screen.queryAllByText(/Page \d+ of \d+/);
    expect(pageInfo).toHaveLength(0);
    expect(screen.getByText('Child 0')).toBeInTheDocument();
    expect(screen.getByText('Child 24')).toBeInTheDocument();
  });

  it('should handle child links without type attribute', () => {
    const childWithoutType: StacLink[] = [
      { rel: 'child', href: 'child1', title: 'Child 1' },
      { rel: 'child', href: 'child2', title: 'Child 2', type: 'application/json' },
    ];
    renderComponent(childWithoutType);
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    const typeElements = screen.queryAllByText('application/json');
    expect(typeElements).toHaveLength(1);
  });

  it('should handle relative URLs correctly', () => {
    const childLinks: StacLink[] = [
      { rel: 'child', href: './child1', title: 'Child 1' },
      { rel: 'child', href: '../sibling/child2', title: 'Child 2' },
    ];
    renderComponent(childLinks);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/catalog?url=https%3A%2F%2Fexample.com%2Fchild1');
  });

  it('should work with three pages of data', () => {
    const manyChildren = Array.from({ length: 75 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const pageInfoElements = screen.getAllByText('Page 1 of 3');
    expect(pageInfoElements.length).toBeGreaterThan(0);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    expect(screen.getAllByText('Page 2 of 3').length).toBeGreaterThan(0);
    fireEvent.click(nextButtons[0]);
    expect(screen.getAllByText('Page 3 of 3').length).toBeGreaterThan(0);
  });

  it('should properly disable next button on last page with three pages', () => {
    const manyChildren = Array.from({ length: 75 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    fireEvent.click(nextButtons[0]);
    fireEvent.click(nextButtons[0]);
    expect(screen.getAllByText('Page 3 of 3').length).toBeGreaterThan(0);
    const finalNextButtons = screen.getAllByRole('button', { name: /Next →/ });
    finalNextButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('should change page size option values', () => {
    renderComponent();
    const select = screen.getByDisplayValue('25') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '50' } });
    expect((screen.getByDisplayValue('50') as HTMLSelectElement).value).toBe('50');
  });

  it('should render correct number of links after page size change', () => {
    const fiftyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(fiftyChildren);
    const select = screen.getByDisplayValue('25');
    fireEvent.change(select, { target: { value: '10' } });
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(10);
  });

  it('should navigate between multiple pages after changing page size', () => {
    const sixtyChildren = Array.from({ length: 60 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(sixtyChildren);
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    const select = screen.getByDisplayValue('25') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '10' } });
    expect((screen.getByDisplayValue('10') as HTMLSelectElement).value).toBe('10');
  });

  it('should have section controls with label', () => {
    renderComponent();
    const label = screen.getByLabelText('Per page:');
    expect(label).toBeInTheDocument();
  });

  it('should render multiple pages correctly with 51 items', () => {
    const fiftyOneChildren = Array.from({ length: 51 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(fiftyOneChildren);
    const pageInfo = screen.getAllByText('Page 1 of 3');
    expect(pageInfo.length).toBeGreaterThan(0);
  });

  it('should display correct links on page 2 after clicking next from top pagination', () => {
    const manyChildren = Array.from({ length: 75 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    const topNextButton = nextButtons[0];
    fireEvent.click(topNextButton);
    expect(screen.getByText('Child 25')).toBeInTheDocument();
    expect(screen.getByText('Child 49')).toBeInTheDocument();
    expect(screen.queryByText('Child 50')).not.toBeInTheDocument();
  });

  it('should handle click on next button then previous button on top pagination', () => {
    const manyChildren = Array.from({ length: 75 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const nextButtons = screen.getAllByRole('button', { name: /Next →/ });
    const topNextButton = nextButtons[0];
    fireEvent.click(topNextButton);
    const prevButtons = screen.getAllByRole('button', { name: /← Previous/ });
    const topPrevButton = prevButtons[0];
    fireEvent.click(topPrevButton);
    expect(screen.getByText('Child 0')).toBeInTheDocument();
  });

  it('should have all pagination buttons visible on multiple pages', () => {
    const manyChildren = Array.from({ length: 75 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    renderComponent(manyChildren);
    const allButtons = screen.getAllByRole('button', { name: /Next →|← Previous/ });
    expect(allButtons.length).toBe(4); // 2 next buttons, 2 previous buttons
  });

  it('should render correct child link href with absolute URL', () => {
    const childLinks: StacLink[] = [
      { rel: 'child', href: 'https://example.com/child', title: 'Child' },
    ];
    renderComponent(childLinks);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toContain('/catalog?url=');
    expect(link.getAttribute('href')).toContain('https%3A%2F%2Fexample.com%2Fchild');
  });

  it('should display all page size options', () => {
    renderComponent();
    const select = screen.getByDisplayValue('25') as HTMLSelectElement;
    const options = Array.from(select.options).map((opt) => opt.value);
    expect(options).toEqual(['10', '25', '50', '100']);
  });

  it('should position pagination controls correctly in sections', () => {
    const manyChildren = Array.from({ length: 50 }, (_, i) => ({
      rel: 'child' as const,
      href: `child${i}`,
      title: `Child ${i}`,
    }));
    const { container } = renderComponent(manyChildren);
    const paginationDivs = container.querySelectorAll('.pagination');
    expect(paginationDivs.length).toBe(2);
  });
});
