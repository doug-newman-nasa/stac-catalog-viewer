import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionSearch } from '../../src/components/CollectionSearch';

vi.mock('../../src/hooks/useCollectionSearch', () => ({
  useCollectionSearch: () => ({
    results: [],
    loading: false,
    error: null,
    numberMatched: undefined,
    search: vi.fn(),
    clearResults: vi.fn(),
  }),
}));

describe('CollectionSearch Component', () => {
  const mockOnCollectionSelect = vi.fn();
  const baseUrl = 'https://example.com/stac';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search form', () => {
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    expect(searchInput).toBeInTheDocument();

    const searchButton = screen.getByRole('button', { name: /Search Collections/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should show clear button when form has values', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i);

    // Initially, clear button should not be visible
    let clearButton = screen.queryByRole('button', { name: /Clear Results/i });
    expect(clearButton).not.toBeInTheDocument();

    // Type in search input
    await user.type(searchInput, 'sentinel');

    // Now clear button should be visible
    clearButton = screen.getByRole('button', { name: /Clear Results/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear form and results when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    const searchInput = screen.getByPlaceholderText(/Search by title/i) as HTMLInputElement;

    // Type in search input
    await user.type(searchInput, 'sentinel');
    expect(searchInput.value).toBe('sentinel');

    // Get clear button and click it
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    // Verify form input is cleared
    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });

    // Verify clear button is no longer visible (since form is empty)
    const clearButtonAfter = screen.queryByRole('button', { name: /Clear Results/i });
    expect(clearButtonAfter).not.toBeInTheDocument();
  });

  it('should clear bbox when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    // Open advanced filters
    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    // Fill in search to enable clear button
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    // Fill in bbox
    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    await user.type(bboxInput, '-10,-10,10,10');

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    // Verify bbox is cleared
    await waitFor(() => {
      expect(bboxInput.value).toBe('');
    });
  });

  it('should clear datetime when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    // Open advanced filters
    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    // Fill in datetime
    const datetimeInput = screen.getByPlaceholderText(
      /2020-01-01\/2023-12-31/i
    ) as HTMLInputElement;
    await user.type(datetimeInput, '2020-01-01/2023-12-31');
    expect(datetimeInput.value).toBe('2020-01-01/2023-12-31');

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    // Verify datetime is cleared
    await waitFor(() => {
      expect(datetimeInput.value).toBe('');
    });
  });

  it('should reset limit to 25 when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    // Fill in search to show clear button
    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    await user.type(searchInput, 'test');

    // Open advanced filters
    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    // Change limit using fireEvent for more reliable input value change
    const limitInput = screen.getByDisplayValue('25') as HTMLInputElement;
    fireEvent.change(limitInput, { target: { value: '50' } });
    expect(limitInput.value).toBe('50');

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    // Verify limit is reset to 25
    await waitFor(() => {
      expect(limitInput.value).toBe('25');
    });
  });

  it('should clear all form fields when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollectionSearch baseUrl={baseUrl} onCollectionSelect={mockOnCollectionSelect} />
    );

    // Open advanced filters
    const advancedToggle = screen.getByRole('button', { name: /Advanced Filters/i });
    await user.click(advancedToggle);

    // Fill in all form fields
    const searchInput = screen.getByPlaceholderText(/Search by title/i) as HTMLInputElement;
    const bboxInput = screen.getByPlaceholderText(/-180, -90, 180, 90/i) as HTMLInputElement;
    const datetimeInput = screen.getByPlaceholderText(/2020-01-01\/2023-12-31/i) as HTMLInputElement;

    await user.type(searchInput, 'sentinel');
    await user.type(bboxInput, '-10, -10, 10, 10');
    await user.type(datetimeInput, '2020-01-01/2023-12-31');

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Results/i });
    await user.click(clearButton);

    // Verify all fields are cleared
    await waitFor(() => {
      expect(searchInput.value).toBe('');
      expect(bboxInput.value).toBe('');
      expect(datetimeInput.value).toBe('');
    });
  });
});
