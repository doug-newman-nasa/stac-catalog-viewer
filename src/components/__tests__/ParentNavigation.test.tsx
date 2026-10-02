import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParentNavigation } from '../ParentNavigation';
import type { StacLink } from '../../types/stac';

describe('ParentNavigation', () => {
  const mockParentLink: StacLink = {
    rel: 'parent',
    href: 'https://example.com/parent',
    title: 'Parent Catalog',
  };

  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  it('renders parent link with title', () => {
    render(
      <ParentNavigation
        parentLink={mockParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Parent Catalog')).toBeInTheDocument();
    expect(screen.getByText('Parent:', { selector: '.parent-navigation-label' })).toBeInTheDocument();
  });

  it('renders unnamed parent when title is not provided', () => {
    const parentLinkWithoutTitle: StacLink = {
      rel: 'parent',
      href: 'https://example.com/parent',
    };

    render(
      <ParentNavigation
        parentLink={parentLinkWithoutTitle}
        onNavigate={mockOnNavigate}
      />
    );

    expect(screen.getByText('Unnamed Parent')).toBeInTheDocument();
  });

  it('calls onNavigate with parent href when button is clicked', () => {
    render(
      <ParentNavigation
        parentLink={mockParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnNavigate).toHaveBeenCalledWith('https://example.com/parent');
    expect(mockOnNavigate).toHaveBeenCalledTimes(1);
  });

  it('displays up arrow icon', () => {
    render(
      <ParentNavigation
        parentLink={mockParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    const icon = screen.getByText('↑');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('parent-navigation-icon');
  });

  it('has proper button styling and attributes', () => {
    render(
      <ParentNavigation
        parentLink={mockParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('parent-navigation-button');
    const title = button.getAttribute('title');
    expect(title).toContain('Navigate to parent catalog: Parent Catalog');
    expect(title).toContain('Note: Some parent URLs may not be STAC catalogs');
  });

  it('handles relative parent hrefs', () => {
    const parentLinkWithRelativeHref: StacLink = {
      rel: 'parent',
      href: '../parent',
      title: 'Parent Catalog',
    };

    render(
      <ParentNavigation
        parentLink={parentLinkWithRelativeHref}
        onNavigate={mockOnNavigate}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnNavigate).toHaveBeenCalledWith('../parent');
  });

  it('updates title attribute when parent link title changes', () => {
    const { rerender } = render(
      <ParentNavigation
        parentLink={mockParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    const newParentLink: StacLink = {
      rel: 'parent',
      href: 'https://example.com/new-parent',
      title: 'New Parent Catalog',
    };

    rerender(
      <ParentNavigation
        parentLink={newParentLink}
        onNavigate={mockOnNavigate}
      />
    );

    const button = screen.getByRole('button');
    const title = button.getAttribute('title');
    expect(title).toContain('Navigate to parent catalog: New Parent Catalog');
    expect(screen.getByText('New Parent Catalog')).toBeInTheDocument();
  });
});
