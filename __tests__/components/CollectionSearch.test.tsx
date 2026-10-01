import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionSearch } from '../../src/components/CollectionSearch';
import type { CollectionSearchParams } from '../../src/lib/collectionSearch';

describe('CollectionSearch Component', () => {
  const mockOnSearchParamsChange = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnClearSearch = vi.fn();
  const defaultSearchParams: CollectionSearchParams = { limit: 25 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search form', () => {
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    expect(searchInput).toBeInTheDocument();

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should show clear button when form has values', async () => {
    const user = userEvent.setup();
    const searchParams: CollectionSearchParams = { q: 'sentinel', limit: 25 };

    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    // Clear button should be visible since q is set
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should hide clear button when form is empty', () => {
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const clearButton = screen.queryByRole('button', { name: /Clear Results/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should call onSearchParamsChange when text search input changes', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'sentinel');

    expect(mockOnSearchParamsChange).toHaveBeenCalled();
  });

  it('should call onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const searchParams: CollectionSearchParams = { q: 'sentinel', limit: 25 };

    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith(searchParams);
  });

  it('should call onClearSearch when clear button is clicked', async () => {
    const user = userEvent.setup();
    const searchParams: CollectionSearchParams = { q: 'sentinel', limit: 25 };

    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    expect(mockOnClearSearch).toHaveBeenCalled();
  });

  it('should display bbox input when advanced filters are expanded', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i);
    expect(bboxInput).toBeInTheDocument();
  });

  it('should update searchParams when bbox input changes with valid coordinates', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    // Use fireEvent to set value directly with valid bbox coordinates
    fireEvent.change(bboxInput, { target: { value: '-10, -10, 10, 10' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [-10, -10, 10, 10],
      })
    );
  });

  it('should show error message when error prop is provided', () => {
    const error = new Error('Search failed');
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
        error={error}
      />
    );

    const errorMessage = screen.getByText(/Search failed/);
    expect(errorMessage).toBeInTheDocument();
  });

  it('should disable search button when loading', () => {
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
        loading={true}
      />
    );

    const searchButton = screen.getByRole('button', { name: /Searching/i });
    expect(searchButton).toBeDisabled();
  });
});
