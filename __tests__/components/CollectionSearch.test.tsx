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

  it('should display bbox input with placeholder', async () => {
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
    expect((bboxInput as HTMLInputElement).placeholder).toContain('180');
  });

  it('should display datetime input with ISO format placeholder', async () => {
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

    const datetimeInput = screen.getByPlaceholderText(/2020-01-01\/2023-12-31/i);
    expect(datetimeInput).toBeInTheDocument();
  });

  it('should handle invalid limit input (NaN)', () => {
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    fireEvent.click(advancedToggle);

    const limitInput = screen.getByDisplayValue('25');
    fireEvent.change(limitInput, { target: { value: 'invalid' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: undefined,
      })
    );
  });

  it('should update limit when valid number is entered', () => {
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    fireEvent.click(advancedToggle);

    const limitInput = screen.getByDisplayValue('25');
    fireEvent.change(limitInput, { target: { value: '50' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
      })
    );
  });

  it('should allow toggling advanced filters open and closed', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch
        searchParams={defaultSearchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    // Initially hidden
    let advancedSection = document.querySelector('.advanced-section');
    expect(advancedSection).not.toBeInTheDocument();

    // Open
    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);
    advancedSection = document.querySelector('.advanced-section');
    expect(advancedSection).toBeInTheDocument();

    // Close
    await user.click(advancedToggle);
    advancedSection = document.querySelector('.advanced-section');
    expect(advancedSection).not.toBeInTheDocument();
  });

  it('should disable clear button when loading', () => {
    const searchParams: CollectionSearchParams = { q: 'sentinel', limit: 25 };
    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
        loading={true}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    expect(clearButton).toBeDisabled();
  });

  it('should clear bbox when input is emptied', async () => {
    const user = userEvent.setup();
    const searchParams: CollectionSearchParams = { bbox: [-10, -10, 10, 10], limit: 25 };

    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    fireEvent.change(bboxInput, { target: { value: '' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: undefined,
      })
    );
  });

  it('should clear datetime when input is emptied', async () => {
    const user = userEvent.setup();
    const searchParams: CollectionSearchParams = { datetime: '2020-01-01/2023-12-31', limit: 25 };

    render(
      <CollectionSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    const datetimeInput = screen.getByPlaceholderText(/2020-01-01\/2023-12-31/i) as HTMLInputElement;
    fireEvent.change(datetimeInput, { target: { value: '' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        datetime: undefined,
      })
    );
  });

  it('should not update bbox when input has invalid format', () => {
    render(
      <CollectionSearch
        searchParams={{ limit: 25 }}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    fireEvent.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    fireEvent.change(bboxInput, { target: { value: 'invalid,bbox,format' } });

    // Should not call onSearchParamsChange since format is invalid
    const callsWithBbox = mockOnSearchParamsChange.mock.calls.filter(call =>
      call[0].bbox !== undefined
    );
    expect(callsWithBbox).toHaveLength(0);
  });

  it('should not update bbox when input has less than 4 coordinates', () => {
    render(
      <CollectionSearch
        searchParams={{ limit: 25 }}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    fireEvent.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    fireEvent.change(bboxInput, { target: { value: '-10, -10, 10' } });

    // Should not call onSearchParamsChange with bbox since it doesn't have 4 values
    const callsWithBbox = mockOnSearchParamsChange.mock.calls.filter(call =>
      call[0].bbox !== undefined
    );
    expect(callsWithBbox).toHaveLength(0);
  });

  it('should update bbox with valid coordinates with extra whitespace', () => {
    render(
      <CollectionSearch
        searchParams={{ limit: 25 }}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    fireEvent.click(advancedToggle);

    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    fireEvent.change(bboxInput, { target: { value: ' -10 , -10 , 10 , 10 ' } });

    expect(mockOnSearchParamsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [-10, -10, 10, 10],
      })
    );
  });
});
