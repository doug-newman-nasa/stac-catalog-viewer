import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

vi.mock('../src/pages/CatalogPage', () => ({
  CatalogPage: () => (
    <div data-testid="catalog-page">Catalog Page</div>
  ),
}));

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
};

describe('App', () => {
  it('should render the header', () => {
    renderWithRouter();
    expect(screen.getByText('STAC Catalog Viewer')).toBeInTheDocument();
    expect(screen.getByText('Explore Spatiotemporal Asset Catalogs')).toBeInTheDocument();
  });

  it('should render the endpoint form', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should initially show the form', () => {
    renderWithRouter();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.queryByTestId('catalog-page')).not.toBeInTheDocument();
  });

  it('should navigate to catalog page after submitting form', async () => {
    renderWithRouter();
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
  });
});
