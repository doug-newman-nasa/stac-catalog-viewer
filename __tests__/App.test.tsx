import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

vi.mock('../src/components/EndpointForm', () => ({
  EndpointForm: ({
    onSubmit,
  }: {
    onSubmit: (url: string) => void;
  }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit('https://example.com/catalog.json');
      }}
    >
      <button type="submit">Submit</button>
    </form>
  ),
}));

vi.mock('../src/components/CatalogTree', () => ({
  CatalogTree: ({ rootUrl }: { rootUrl: string }) => (
    <div data-testid="catalog-tree">Catalog Tree: {rootUrl}</div>
  ),
}));

describe('App', () => {
  it('should render the header', () => {
    render(<App />);
    expect(screen.getByText('STAC Catalog Viewer')).toBeInTheDocument();
    expect(screen.getByText('Explore Spatiotemporal Asset Catalogs')).toBeInTheDocument();
  });

  it('should render the endpoint form', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should not render catalog tree initially', () => {
    render(<App />);
    expect(screen.queryByTestId('catalog-tree')).not.toBeInTheDocument();
  });

  it('should render catalog tree after submitting form', () => {
    render(<App />);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    expect(screen.getByTestId('catalog-tree')).toBeInTheDocument();
    expect(screen.getByText(/Catalog Tree: https:\/\/example.com\/catalog.json/)).toBeInTheDocument();
  });
});
