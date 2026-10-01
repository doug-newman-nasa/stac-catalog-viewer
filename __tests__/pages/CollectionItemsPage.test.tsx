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

  it('should handle page size changes', async () => {
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
      expect(screen.getByText('Items')).toBeInTheDocument();
    });

    const selectElement = screen.getByDisplayValue('25');
    await user.selectOptions(selectElement, '50');

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.stringContaining('limit=50')
      );
    });
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
});
