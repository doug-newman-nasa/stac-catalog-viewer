import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinksDisplay } from '../../src/components/LinksDisplay';
import type { StacLink } from '../../src/types/stac';

describe('LinksDisplay', () => {
  it('should render nothing when links is empty', () => {
    const { container } = render(<LinksDisplay links={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when links is undefined', () => {
    const { container } = render(<LinksDisplay links={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render toggle button with link count', () => {
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
        title: 'Source',
      },
      {
        rel: 'alternate',
        href: 'https://example.com/alternate',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button', { name: /Links \(2\)/ });
    expect(toggle).toBeInTheDocument();
  });

  it('should expand and collapse links on toggle click', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
        title: 'Source Data',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button', { name: /Links/ });

    // Initially collapsed
    expect(screen.queryByText('Source Data')).not.toBeInTheDocument();

    // Click to expand
    await user.click(toggle);
    expect(screen.getByText('Source Data')).toBeInTheDocument();

    // Click to collapse
    await user.click(toggle);
    expect(screen.queryByText('Source Data')).not.toBeInTheDocument();
  });

  it('should display link rel, type, title, and href', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
        type: 'application/json',
        title: 'Source Metadata',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button', { name: /Links/ });
    await user.click(toggle);

    expect(screen.getByText('via')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('Source Metadata')).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/example.com\/source/)).toBeInTheDocument();
  });

  it('should display link title when available', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'derived_from',
        href: 'https://example.com/original',
        title: 'Original Dataset',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Original Dataset')).toBeInTheDocument();
  });

  it('should display link type when available', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'alternate',
        href: 'https://example.com/alt',
        type: 'text/html',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('text/html')).toBeInTheDocument();
  });

  it('should display multiple links correctly', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source1',
        title: 'Source 1',
      },
      {
        rel: 'derived_from',
        href: 'https://example.com/original',
        title: 'Original Data',
      },
      {
        rel: 'alternate',
        href: 'https://example.com/alt',
        type: 'text/html',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button', { name: /Links \(3\)/ });
    await user.click(toggle);

    expect(screen.getByText('via')).toBeInTheDocument();
    expect(screen.getByText('derived_from')).toBeInTheDocument();
    expect(screen.getByText('alternate')).toBeInTheDocument();
  });

  it('should create external links with correct attributes', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/source');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should handle links without title', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('via')).toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('should handle links without type', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
        title: 'Source',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('via')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    // Type should not be rendered if not present
    expect(screen.queryByText(/application\//)).not.toBeInTheDocument();
  });

  it('should update aria-expanded attribute when toggled', async () => {
    const user = userEvent.setup();
    const links: StacLink[] = [
      {
        rel: 'via',
        href: 'https://example.com/source',
      },
    ];

    render(<LinksDisplay links={links} />);

    const toggle = screen.getByRole('button');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
