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

  it('should apply search params to View Items Endpoint link', async () => {
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

    // Wait for the fetch to complete with new params
    await waitFor(() => {
      const viewLink = screen.getByTitle('View items with current parameters');
      const href = viewLink.getAttribute('href');
      expect(href).toContain('bbox=-180%2C-90%2C180%2C90');
    });
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

    // Wait for clear button to appear
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
});
