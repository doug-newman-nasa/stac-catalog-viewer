import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ItemSearch } from '../../src/components/ItemSearch';
import type { ItemSearchParams } from '../../src/lib/itemSearch';

// Wrapper component to manage state for testing
function ItemSearchWrapper({
  initialParams = {},
  onSearchCalled,
}: {
  initialParams?: ItemSearchParams;
  onSearchCalled?: (params: ItemSearchParams) => void;
}) {
  const [searchParams, setSearchParams] = useState<ItemSearchParams>(initialParams);

  return (
    <ItemSearch
      searchParams={searchParams}
      onSearchParamsChange={setSearchParams}
      onSearch={(params) => {
        setSearchParams(params);
        onSearchCalled?.(params);
      }}
      onClearSearch={() => setSearchParams({})}
    />
  );
}

describe('ItemSearch', () => {
  const mockOnSearchParamsChange = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnClearSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the search form with toggle', () => {
    const searchParams: ItemSearchParams = {};
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should show advanced filters when toggle is clicked', async () => {
    const searchParams: ItemSearchParams = {};
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    expect(screen.queryByPlaceholderText('-180, -90, 180, 90')).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(screen.getByPlaceholderText('-180, -90, 180, 90')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('2020-01-01/2023-12-31')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('id1, id2, id3')).toBeInTheDocument();
  });

  it('should allow typing in bbox input when wrapped with state management', async () => {
    const user = userEvent.setup();
    render(<ItemSearchWrapper />);

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const bboxInput = screen.getByPlaceholderText('-180, -90, 180, 90') as HTMLInputElement;
    await user.type(bboxInput, '-180,-90,180,90');

    await waitFor(() => {
      expect(bboxInput.value).toBe('-180,-90,180,90');
    });
  });

  it('should allow typing in datetime input when wrapped with state management', async () => {
    const user = userEvent.setup();
    render(<ItemSearchWrapper />);

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const datetimeInput = screen.getByPlaceholderText('2020-01-01/2023-12-31') as HTMLInputElement;
    await user.type(datetimeInput, '2021-01-01/2021-12-31');

    await waitFor(() => {
      expect(datetimeInput.value).toBe('2021-01-01/2021-12-31');
    });
  });

  it('should allow typing in ids input when wrapped with state management', async () => {
    const user = userEvent.setup();
    render(<ItemSearchWrapper />);

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const idsInput = screen.getByPlaceholderText('id1, id2, id3') as HTMLInputElement;
    await user.type(idsInput, 'item-1,item-2');

    await waitFor(() => {
      expect(idsInput.value).toBe('item-1,item-2');
    });
  });

  it('should parse bbox on form submission', async () => {
    const searchParams: ItemSearchParams = {
      bboxString: '-180,-90,180,90',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: 'Search' });
    await user.click(submitButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        bbox: [-180, -90, 180, 90],
      })
    );
  });

  it('should not submit with invalid bbox', async () => {
    const searchParams: ItemSearchParams = {
      bboxString: 'invalid,bbox',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: 'Search' });
    await user.click(submitButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });


  it('should show error message for invalid bbox', async () => {
    const searchParams: ItemSearchParams = {
      bboxString: 'invalid,bbox',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    expect(screen.getByText(/Invalid bounding box/)).toBeInTheDocument();
  });

  it('should parse comma-separated ids on form submission', async () => {
    const searchParams: ItemSearchParams = {
      idsString: 'item-a, item-b, item-c',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: 'Search' });
    await user.click(submitButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: ['item-a', 'item-b', 'item-c'],
      })
    );
  });

  it('should clear filters when clear button is clicked', async () => {
    const searchParams: ItemSearchParams = {
      bbox: [-180, -90, 180, 90],
      datetime: '2020-01-01/2023-12-31',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const clearButton = screen.getByRole('button', { name: /Clear Filters/ });
    await user.click(clearButton);

    expect(mockOnClearSearch).toHaveBeenCalled();
  });

  it('should disable submit button when loading', () => {
    const searchParams: ItemSearchParams = {};
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
        loading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Searching/ });
    expect(submitButton).toBeDisabled();
  });

  it('should display error message', () => {
    const searchParams: ItemSearchParams = {};
    const error = new Error('Network error');
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
        error={error}
      />
    );

    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('should not show clear button when no filters are active', () => {
    const searchParams: ItemSearchParams = {};
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    expect(screen.queryByRole('button', { name: /Clear Filters/ })).not.toBeInTheDocument();
  });


  it('should trim whitespace from ids when parsing', async () => {
    const searchParams: ItemSearchParams = {
      idsString: ' item-a , item-b , item-c ',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: 'Search' });
    await user.click(submitButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: ['item-a', 'item-b', 'item-c'],
      })
    );
  });

  it('should handle empty string ids on submission', async () => {
    const searchParams: ItemSearchParams = {
      idsString: '',
    };
    const user = userEvent.setup();
    render(
      <ItemSearch
        searchParams={searchParams}
        onSearchParamsChange={mockOnSearchParamsChange}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggleButton);

    const submitButton = screen.getByRole('button', { name: 'Search' });
    await user.click(submitButton);

    expect(mockOnSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        ids: undefined,
      })
    );
  });
});
