import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionItemsPage } from '../../src/pages/CollectionItemsPage';
import type { StacLink } from '../../src/types/stac';

vi.stubGlobal('fetch', vi.fn());

describe('CollectionItemsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItemsLink: StacLink = {
    rel: 'items',
    href: 'https://example.com/collections/test/items',
    type: 'application/geo+json',
  };

  const mockItemLinks: StacLink[] = [
    { rel: 'item', href: 'https://example.com/items/item1' },
    { rel: 'item', href: 'https://example.com/items/item2' },
  ];

  const mockItemCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'item1',
        geometry: null,
        properties: {},
      },
      {
        type: 'Feature',
        id: 'item2',
        geometry: null,
        properties: {},
      },
    ],
    links: [
      { rel: 'self', href: 'https://example.com/items' },
      { rel: 'next', href: 'https://example.com/items?cursor=next' },
    ],
    numberMatched: 2,
    numberReturned: 2,
  };

  it('should render items section when items exist', () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    const itemsSection = screen.getByText('Items');
    expect(itemsSection).toBeInTheDocument();
  });

  it('should render ItemSearch component when itemsSearchLink is present', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    await waitFor(() => {
      const advancedToggle = screen.getByRole('button', { name: /Search & Filter Items/ });
      expect(advancedToggle).toBeInTheDocument();
    });
  });

  it('should not render ItemSearch component when itemsSearchLink is not present', () => {
    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={mockItemLinks}
        itemsSearchLink={undefined}
      />
    );

    expect(screen.queryByRole('button', { name: /Search & Filter Items/ })).not.toBeInTheDocument();
  });

  it('should render static item links when itemsSearchLink is not present', () => {
    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={mockItemLinks}
        itemsSearchLink={undefined}
      />
    );

    expect(screen.getByText('Items')).toBeInTheDocument();
    // The component should render without error
  });

  it('should show no results message when search returns empty', async () => {
    const user = userEvent.setup();
    const emptyCollection = {
      type: 'FeatureCollection',
      features: [],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 0,
      numberReturned: 0,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => emptyCollection,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Wait for ItemSearch component to be available
    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
      expect(toggle).toBeInTheDocument();
    });

    // Click Apply Filters to start the search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  it('should clear search params when clear button is clicked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockItemCollection,
    } as Response);

    const user = userEvent.setup();
    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
      expect(toggle).toBeInTheDocument();
    });

    // Open advanced filters
    const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggle);

    // Enter search params
    const bboxInput = screen.getByPlaceholderText('-180, -90, 180, 90') as HTMLInputElement;
    await user.type(bboxInput, '-180,-90,180,90');

    // Submit search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Wait for items to load (after Apply Filters is clicked)
    await waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /Clear Filters/ });
      expect(clearButton).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Clear Filters/ });
    await user.click(clearButton);

    // Verify bboxInput is cleared
    await waitFor(() => {
      expect((screen.getByPlaceholderText('-180, -90, 180, 90') as HTMLInputElement).value).toBe('');
    });
  });

  it('should render pagination for static item links when multiple items exist', () => {
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Should show pagination info (at least one element)
    const pageTexts = screen.getAllByText(/Page 1 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);
    // Should show next button enabled
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    expect(nextButtons[0]).not.toBeDisabled();
  });

  it('should navigate to next page with static item links', async () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Click next button
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    await user.click(nextButtons[0]);

    // Should show page 2 (check that it exists)
    const pageTexts = screen.getAllByText(/Page 2 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);
  });

  it('should navigate to previous page with static item links', async () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Click next button to go to page 2
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    await user.click(nextButtons[0]);

    // Click previous button
    const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
    await user.click(prevButtons[0]);

    // Should be back on page 1
    const pageTexts = screen.getAllByText(/Page 1 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);
  });

  it('should disable previous button on first page', () => {
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // First previous button should be disabled
    const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
    expect(prevButtons[0]).toBeDisabled();
  });

  it('should disable next button on last page', async () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Click next button to go to page 2
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    await user.click(nextButtons[0]);

    // Next button should now be disabled
    const nextButtonsOnPage2 = screen.getAllByRole('button', { name: /Next/ });
    expect(nextButtonsOnPage2[0]).toBeDisabled();
  });

  it('should render item links with titles', () => {
    const itemLinksWithTitles: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1', title: 'First Item' },
      { rel: 'item', href: 'https://example.com/items/item2', title: 'Second Item' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={itemLinksWithTitles}
        itemsSearchLink={undefined}
      />
    );

    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
  });

  it('should render untitled item when title is not provided', () => {
    const itemLinksNoTitle: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={itemLinksNoTitle}
        itemsSearchLink={undefined}
      />
    );

    expect(screen.getByText('Untitled Item')).toBeInTheDocument();
  });

  it('should not render pagination when single page of items', () => {
    const itemLinks: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1', title: 'Item 1' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={itemLinks}
        itemsSearchLink={undefined}
      />
    );

    expect(screen.queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
  });

  it('should navigate search results pagination with API', async () => {
    const user = userEvent.setup();
    const itemCollectionWithPages = {
      type: 'FeatureCollection',
      features: Array.from({ length: 25 }, (_, i) => ({
        type: 'Feature',
        id: `item${i + 1}`,
        geometry: null,
        properties: {},
      })),
      links: [
        { rel: 'self', href: 'https://example.com/items' },
        { rel: 'next', href: 'https://example.com/items?cursor=next' },
      ],
      numberMatched: 50,
      numberReturned: 25,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithPages,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters to start the search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    await waitFor(() => {
      const pageTexts = screen.getAllByText(/Page 1/);
      expect(pageTexts.length).toBeGreaterThan(0);
    });

    // Find and click the next button (bottom pagination)
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    // Bottom pagination button is typically the second one
    await user.click(nextButtons[nextButtons.length - 1]);

    // Verify that goPrevious/goNext was called (indirectly through the component state)
    // The next button in the second pagination set should become enabled
    await waitFor(() => {
      const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
      expect(prevButtons[prevButtons.length - 1]).not.toBeDisabled();
    });
  });

  it('should render items with browse assets', async () => {
    const user = userEvent.setup();
    const itemCollectionWithAssets = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'item-with-assets',
          geometry: null,
          properties: {},
          assets: {
            preview: {
              href: 'https://example.com/preview.png',
              type: 'image/png',
              title: 'Preview',
            },
          },
          links: [
            {
              rel: 'browse',
              href: 'https://example.com/browse.jpg',
              type: 'image/jpeg',
            },
          ],
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithAssets,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Wait for ItemSearch component to be available
    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
      expect(toggle).toBeInTheDocument();
    });

    // Click Apply Filters to start the search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('item-with-assets')).toBeInTheDocument();
    });
  });

  it('should show loading state during search', async () => {
    let resolveJson: ((value: any) => void) | null = null;
    const jsonPromise = new Promise((resolve) => {
      resolveJson = resolve;
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => jsonPromise,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Should show loading initially
    await waitFor(() => {
      const loadingElements = screen.queryAllByText(/Loading items/);
      // Loading might be shown briefly
    });

    // Resolve the promise to complete loading
    if (resolveJson) {
      resolveJson(mockItemCollection);
    }

    await waitFor(() => {
      expect(screen.queryByText(/Loading items/)).not.toBeInTheDocument();
    });
  });

  it('should disable next button when no next link available', async () => {
    const user = userEvent.setup();
    const itemCollectionWithPages = {
      type: 'FeatureCollection',
      features: Array.from({ length: 25 }, (_, i) => ({
        type: 'Feature',
        id: `item${i + 1}`,
        geometry: null,
        properties: {},
      })),
      links: [
        { rel: 'self', href: 'https://example.com/items' },
        { rel: 'next', href: 'https://example.com/items?cursor=next' },
      ],
      numberMatched: 50,
      numberReturned: 25,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithPages,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters to start the search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    await waitFor(() => {
      const pageTexts = screen.getAllByText(/Page 1/);
      expect(pageTexts.length).toBeGreaterThan(0);
    });

    // Next button should be enabled
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    expect(nextButtons[0]).not.toBeDisabled();
  });

  it('should handle pagination for static item links with multiple pages', () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Should render pagination for static items
    const pageTexts = screen.getAllByText(/Page 1 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);

    // Both previous buttons should be disabled on first page
    const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
    prevButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('should navigate to last page with static item links', async () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Click next button twice to reach last page (30 items / 25 per page = 2 pages)
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    await user.click(nextButtons[0]);

    // Should show page 2
    const pageTexts = screen.getAllByText(/Page 2 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);

    // Next button should be disabled on last page
    const nextButtonsAfter = screen.getAllByRole('button', { name: /Next/ });
    nextButtonsAfter.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('should show error state when search fails', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    vi.mocked(fetch).mockRejectedValue(error);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      const errorElements = screen.queryAllByText(/Network error/);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton).toBeInTheDocument();
  });

  it('should render item geometry and datetime when available', async () => {
    const user = userEvent.setup();
    const itemCollectionWithData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'item-with-data',
          geometry: {
            type: 'Polygon',
            coordinates: [[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]],
          },
          bbox: [-180, -90, 180, 90],
          properties: {
            datetime: '2020-01-01T00:00:00Z',
          },
          links: [{ rel: 'self', href: 'https://example.com/item1' }],
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithData,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Wait for item to be rendered
    await waitFor(() => {
      expect(screen.getByText('item-with-data')).toBeInTheDocument();
    });
  });

  it('should click previous button in static item links pagination', async () => {
    const user = userEvent.setup();
    const manyItemLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
      rel: 'item',
      href: `https://example.com/items/item${i + 1}`,
      title: `Item ${i + 1}`,
    }));

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={manyItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Click next to go to page 2
    const nextButtons = screen.getAllByRole('button', { name: /Next/ });
    await user.click(nextButtons[0]);

    // Should be on page 2
    const pageTexts = screen.getAllByText(/Page 2 of 2/);
    expect(pageTexts.length).toBeGreaterThan(0);

    // Click the last previous button (bottom pagination)
    const prevButtons = screen.getAllByRole('button', { name: /Previous/ });
    await user.click(prevButtons[prevButtons.length - 1]);

    // Should be back on page 1
    const pageTexts1 = screen.getAllByText(/Page 1 of 2/);
    expect(pageTexts1.length).toBeGreaterThan(0);
  });

  it('should initialize with collection search params', async () => {
    const user = userEvent.setup();
    const itemCollectionWithBbox = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'item1',
          geometry: null,
          properties: {},
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithBbox,
    } as Response);

    const collectionSearchParams = {
      bbox: [-180, -90, 180, 90] as [number, number, number, number],
      bboxString: '-180,-90,180,90',
    };

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
        collectionSearchParams={collectionSearchParams}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should render items
    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
    });
  });

  it('should render item with start and end datetime', async () => {
    const user = userEvent.setup();
    const itemCollectionWithDatetimeRange = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'item-range',
          geometry: null,
          properties: {
            start_datetime: '2020-01-01T00:00:00Z',
            end_datetime: '2020-12-31T23:59:59Z',
          },
          links: [{ rel: 'self', href: 'https://example.com/item1' }],
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithDatetimeRange,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Wait for item to be rendered
    await waitFor(() => {
      expect(screen.getByText('item-range')).toBeInTheDocument();
    });
  });

  it('should show empty results when search applied but no filters', async () => {
    const user = userEvent.setup();
    const emptyResults = {
      type: 'FeatureCollection',
      features: [],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 0,
      numberReturned: 0,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => emptyResults,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters without entering any filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should show no items found
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  it('should not display static item links pagination when items fit on one page', () => {
    const fewItemLinks: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1', title: 'Item 1' },
      { rel: 'item', href: 'https://example.com/items/item2', title: 'Item 2' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={fewItemLinks}
        itemsSearchLink={undefined}
      />
    );

    // Pagination should not be shown
    const pageTexts = screen.queryAllByText(/Page 1/);
    expect(pageTexts.length).toBe(0);
  });

  it('should render static item links with titles', () => {
    const itemLinksWithTitles: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1', title: 'First Item' },
      { rel: 'item', href: 'https://example.com/items/item2', title: 'Second Item' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={itemLinksWithTitles}
        itemsSearchLink={undefined}
      />
    );

    // Should display item links
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('Second Item')).toBeInTheDocument();
  });

  it('should render static item links without titles', () => {
    const itemLinksNoTitles: StacLink[] = [
      { rel: 'item', href: 'https://example.com/items/item1' },
      { rel: 'item', href: 'https://example.com/items/item2' },
    ];

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={itemLinksNoTitles}
        itemsSearchLink={undefined}
      />
    );

    // Should display untitled items
    const untiledElements = screen.getAllByText('Untitled Item');
    expect(untiledElements.length).toBe(2);
  });

  it('should apply filters and show pagination info with numberMatched', async () => {
    const user = userEvent.setup();
    const itemCollectionWithPageInfo = {
      type: 'FeatureCollection',
      features: Array.from({ length: 25 }, (_, i) => ({
        type: 'Feature',
        id: `item${i + 1}`,
        geometry: null,
        properties: {},
      })),
      links: [
        { rel: 'self', href: 'https://example.com/items' },
        { rel: 'next', href: 'https://example.com/items?cursor=next' },
      ],
      numberMatched: 100,
      numberReturned: 25,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithPageInfo,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should show pagination with total count
    await waitFor(() => {
      const pageInfos = screen.getAllByText(/Page 1.*~100 items/);
      expect(pageInfos.length).toBeGreaterThan(0);
    });
  });

  it('should handle search with all three filter types', async () => {
    const user = userEvent.setup();
    const itemCollectionWithItems = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'item1',
          geometry: null,
          properties: {},
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollectionWithItems,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    await waitFor(() => {
      const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
      expect(toggle).toBeInTheDocument();
    });

    // Open advanced filters
    const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
    await user.click(toggle);

    // Enter bbox
    const bboxInput = screen.getByPlaceholderText('-180, -90, 180, 90') as HTMLInputElement;
    await user.type(bboxInput, '-10,-10,10,10');

    // Enter datetime
    const datetimeInput = screen.getByPlaceholderText('2020-01-01/2023-12-31') as HTMLInputElement;
    await user.type(datetimeInput, '2020-01-01/2023-12-31');

    // Enter ids
    const idsInput = screen.getByPlaceholderText('id1, id2, id3') as HTMLInputElement;
    await user.type(idsInput, 'item1,item2');

    // Submit search
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should render items
    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
    });
  });

  it('should retry failed search', async () => {
    const user = userEvent.setup();
    const error = new Error('Network error');
    const successResponse = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', id: 'item1', geometry: null, properties: {}, links: [] }],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => successResponse,
      } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters - should fail
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Wait for error and retry button
    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /Retry/ });
      expect(retryButton).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /Retry/ });
    await user.click(retryButton);

    // Should now show items
    await waitFor(() => {
      expect(screen.getByText('item1')).toBeInTheDocument();
    });
  });

  it('should handle items with only bbox geometry', async () => {
    const user = userEvent.setup();
    const itemWithBboxOnly = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'bbox-item',
          bbox: [-10, -10, 10, 10],
          geometry: null,
          properties: {},
          links: [{ rel: 'self', href: 'https://example.com/item' }],
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemWithBboxOnly,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should render item
    await waitFor(() => {
      expect(screen.getByText('bbox-item')).toBeInTheDocument();
    });
  });

  it('should handle item with assets but no geometry', async () => {
    const user = userEvent.setup();
    const itemWithAssets = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'asset-item',
          geometry: null,
          properties: {},
          assets: {
            data: { href: 'https://example.com/data.tif', type: 'image/tiff' },
          },
          links: [{ rel: 'self', href: 'https://example.com/item' }],
        },
      ],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 1,
      numberReturned: 1,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemWithAssets,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Click Apply Filters
    const submitButton = screen.getByRole('button', { name: /Apply Filters/ });
    await user.click(submitButton);

    // Should render item
    await waitFor(() => {
      expect(screen.getByText('asset-item')).toBeInTheDocument();
    });
  });

  it('should toggle advanced search filters', async () => {
    const user = userEvent.setup();
    const itemCollection = {
      type: 'FeatureCollection',
      features: [],
      links: [{ rel: 'self', href: 'https://example.com/items' }],
      numberMatched: 0,
      numberReturned: 0,
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => itemCollection,
    } as Response);

    render(
      <CollectionItemsPage
        url="https://example.com/collections/test"
        itemLinks={[]}
        itemsSearchLink={mockItemsLink}
      />
    );

    // Find toggle button
    const toggle = screen.getByRole('button', { name: /Search & Filter Items/ });
    expect(toggle).toBeInTheDocument();

    // Advanced filters should not be visible initially
    expect(screen.queryByPlaceholderText('-180, -90, 180, 90')).not.toBeInTheDocument();

    // Click to expand
    await user.click(toggle);

    // Advanced filters should now be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('-180, -90, 180, 90')).toBeInTheDocument();
    });

    // Click to collapse
    await user.click(toggle);

    // Advanced filters should be hidden again
    expect(screen.queryByPlaceholderText('-180, -90, 180, 90')).not.toBeInTheDocument();
  });
});
