import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollectionItemsPage } from '../../src/pages/CollectionItemsPage';
import { useStacItemsSearch } from '../../src/hooks/useStacItemsSearch';
import type { StacItem, StacLink } from '../../src/types/stac';
import type { ItemSearchParams } from '../../src/lib/itemSearch';
import type { CollectionSearchParams } from '../../src/lib/collectionSearch';

vi.mock('../../src/hooks/useStacItemsSearch', () => ({
  useStacItemsSearch: vi.fn(),
}));

type HookState = ReturnType<typeof useStacItemsSearch>;

function mockHookState(overrides: Partial<HookState> = {}): HookState {
  const state: HookState = {
    items: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 25,
    setPageSize: vi.fn(),
    hasNext: false,
    hasPrevious: false,
    numberMatched: undefined,
    supportsSearch: false,
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
  vi.mocked(useStacItemsSearch).mockReturnValue(state);
  return state;
}

function lastSearchParams(): ItemSearchParams {
  const calls = vi.mocked(useStacItemsSearch).mock.calls;
  return calls[calls.length - 1][2] as ItemSearchParams;
}

function firstSearchParams(): ItemSearchParams {
  return vi.mocked(useStacItemsSearch).mock.calls[0][2] as ItemSearchParams;
}

function itemsLink(href: string): StacLink {
  return { rel: 'items', href, type: 'application/geo+json' };
}

const baseUrl = 'https://example.com/collections/test';

describe('CollectionItemsPage search params initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState();
  });

  it('should extract bbox, datetime, and ids from the rel=items URL', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink(
          'https://example.com/collections/test/items?bbox=-10,-20,30,40&datetime=2020-01-01T00:00:00Z/2020-12-31T23:59:59Z&ids=a,b,c'
        )}
      />
    );

    expect(firstSearchParams()).toEqual({
      bbox: [-10, -20, 30, 40],
      datetime: '2020-01-01T00:00:00Z/2020-12-31T23:59:59Z',
      ids: ['a', 'b', 'c'],
    });
  });

  it('should ignore a bbox in the rel=items URL that does not have four parts', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=1,2,3')}
      />
    );

    expect(firstSearchParams().bbox).toBeUndefined();
  });

  it('should ignore a bbox in the rel=items URL with non-numeric values', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=1,2,foo,4')}
      />
    );

    expect(firstSearchParams().bbox).toBeUndefined();
  });

  it('should leave params empty when the rel=items URL has no query parameters', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items')}
      />
    );

    expect(firstSearchParams()).toEqual({});
  });

  it('should prefer collection search params over rel=items URL params', () => {
    const collectionSearchParams: CollectionSearchParams = {
      bbox: [1, 2, 3, 4],
      bboxString: '1,2,3,4',
      datetime: '2021-01-01T00:00:00Z/..',
    };

    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink(
          'https://example.com/collections/test/items?bbox=-10,-20,30,40&datetime=2020-01-01T00:00:00Z&ids=x'
        )}
        collectionSearchParams={collectionSearchParams}
      />
    );

    const initial = firstSearchParams();
    expect(initial.bbox).toEqual([1, 2, 3, 4]);
    expect(initial.datetime).toBe('2021-01-01T00:00:00Z/..');
    // ids are not part of collection search params, so they come from the URL
    expect(initial.ids).toEqual(['x']);
  });

  it('should not fail when the rel=items href cannot be parsed as a URL', () => {
    render(
      <CollectionItemsPage
        url="not a valid url"
        itemLinks={[]}
        itemsSearchLink={itemsLink('relative/items?bbox=1,2,3,4')}
      />
    );

    expect(firstSearchParams()).toEqual({});
    expect(screen.getByText('Items')).toBeInTheDocument();
  });
});

describe('CollectionItemsPage collection search params sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState();
  });

  it('should merge the rel=items URL bbox when collection search params lack a bbox', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=5,6,7,8')}
        collectionSearchParams={{ datetime: '2022-01-01T00:00:00Z' }}
      />
    );

    expect(lastSearchParams().bbox).toEqual([5, 6, 7, 8]);
    expect(lastSearchParams().datetime).toBe('2022-01-01T00:00:00Z');
  });

  it('should not merge an invalid rel=items URL bbox', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=5,6,bar,8')}
        collectionSearchParams={{ datetime: '2022-01-01T00:00:00Z' }}
      />
    );

    expect(lastSearchParams().bbox).toBeUndefined();
  });

  it('should not merge a rel=items URL bbox with the wrong number of parts', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=5,6')}
        collectionSearchParams={{ datetime: '2022-01-01T00:00:00Z' }}
      />
    );

    expect(lastSearchParams().bbox).toBeUndefined();
  });

  it('should leave bbox unset when the rel=items URL has no bbox', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items')}
        collectionSearchParams={{ datetime: '2022-01-01T00:00:00Z' }}
      />
    );

    expect(lastSearchParams().bbox).toBeUndefined();
  });

  it('should keep the collection bbox when collection search params include one', () => {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items?bbox=5,6,7,8')}
        collectionSearchParams={{ bbox: [1, 2, 3, 4] }}
      />
    );

    expect(lastSearchParams().bbox).toEqual([1, 2, 3, 4]);
  });

  it('should update params when collection search params change', () => {
    const { rerender } = render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items')}
        collectionSearchParams={{ datetime: '2022-01-01T00:00:00Z' }}
      />
    );

    rerender(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items')}
        collectionSearchParams={{ datetime: '2023-01-01T00:00:00Z', bbox: [0, 0, 1, 1] }}
      />
    );

    expect(lastSearchParams().datetime).toBe('2023-01-01T00:00:00Z');
    expect(lastSearchParams().bbox).toEqual([0, 0, 1, 1]);
  });
});

describe('CollectionItemsPage API pagination controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const item: StacItem = {
    type: 'Feature',
    stac_version: '1.0.0',
    id: 'item-1',
    geometry: null,
    properties: { datetime: '2020-01-01T00:00:00Z' },
    links: [],
    assets: {},
  } as StacItem;

  function renderAndSearch() {
    render(
      <CollectionItemsPage
        url={baseUrl}
        itemLinks={[]}
        itemsSearchLink={itemsLink('https://example.com/collections/test/items')}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search Items' }));
  }

  it('should call goNext and goPrevious from the top and bottom pagination controls', () => {
    const state = mockHookState({
      items: [item],
      page: 2,
      hasNext: true,
      hasPrevious: true,
      numberMatched: 100,
    });

    renderAndSearch();

    const previousButtons = screen.getAllByRole('button', { name: '← Previous' });
    const nextButtons = screen.getAllByRole('button', { name: 'Next →' });
    expect(previousButtons).toHaveLength(2);
    expect(nextButtons).toHaveLength(2);

    fireEvent.click(previousButtons[0]);
    fireEvent.click(nextButtons[0]);
    fireEvent.click(previousButtons[1]);
    fireEvent.click(nextButtons[1]);

    expect(state.goPrevious).toHaveBeenCalledTimes(2);
    expect(state.goNext).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(/of ~100 items/)).toHaveLength(2);
  });

  it('should show pagination when the page is empty but numberMatched is positive', () => {
    mockHookState({ items: [], page: 3, hasPrevious: true, numberMatched: 50 });

    renderAndSearch();

    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    expect(screen.getAllByText(/of ~50 items/)).toHaveLength(2);
  });

  it('should pass hasAppliedFilters=true to the hook after searching', () => {
    mockHookState();

    renderAndSearch();

    const calls = vi.mocked(useStacItemsSearch).mock.calls;
    expect(calls[0][3]).toBe(false);
    expect(calls[calls.length - 1][3]).toBe(true);
  });
});

describe('CollectionItemsPage static item links pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState();
  });

  const manyLinks: StacLink[] = Array.from({ length: 30 }, (_, i) => ({
    rel: 'item',
    href: `https://example.com/items/item${i + 1}`,
    title: `Item ${i + 1}`,
  }));

  it('should navigate using the bottom pagination controls', () => {
    render(<CollectionItemsPage url={baseUrl} itemLinks={manyLinks} itemsSearchLink={undefined} />);

    const bottomNext = screen.getAllByRole('button', { name: 'Next →' })[1];
    fireEvent.click(bottomNext);

    expect(screen.getAllByText('Page 2 of 2')).toHaveLength(2);
    expect(screen.getByText('Item 26')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

    const bottomPrevious = screen.getAllByRole('button', { name: '← Previous' })[1];
    fireEvent.click(bottomPrevious);

    expect(screen.getAllByText('Page 1 of 2')).toHaveLength(2);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
