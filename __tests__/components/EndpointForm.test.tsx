import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndpointForm } from '../../src/components/EndpointForm';

describe('EndpointForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render form with label and input', () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText('STAC Catalog Endpoint:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load catalog/i })).toBeInTheDocument();
  });

  it('should display default endpoint on first load', () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('https://planetarycomputer.microsoft.com/api/stac/v1');
  });

  it('should load endpoint from localStorage if present', () => {
    const customUrl = 'https://custom.example.com/stac';
    localStorage.setItem('stac_endpoint_url', customUrl);

    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe(customUrl);
  });

  it('should update input value on change', async () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'https://new-url.com/stac');

    expect(input.value).toBe('https://new-url.com/stac');
  });

  it('should save URL to localStorage on form submit', async () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'https://save-test.com/stac');

    const button = screen.getByRole('button', { name: /load catalog/i });
    fireEvent.click(button);

    expect(localStorage.getItem('stac_endpoint_url')).toBe('https://save-test.com/stac');
  });

  it('should call onSubmit with URL on form submit', async () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'https://submit-test.com/stac');

    const button = screen.getByRole('button', { name: /load catalog/i });
    fireEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith('https://submit-test.com/stac');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should submit on input field enter', async () => {
    const onSubmit = vi.fn();
    render(<EndpointForm onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, 'https://enter-test.com/stac{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('https://enter-test.com/stac');
  });
});
