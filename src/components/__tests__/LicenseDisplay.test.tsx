import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LicenseDisplay } from '../LicenseDisplay';

describe('LicenseDisplay', () => {
  it('renders SPDX license with full name', () => {
    render(<LicenseDisplay license="CC-BY-4.0" />);
    expect(screen.getByText('Creative Commons Attribution 4.0 International')).toBeInTheDocument();
  });

  it('renders SPDX license as a link', () => {
    render(<LicenseDisplay license="CC-BY-4.0" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders MIT license with correct URL', () => {
    render(<LicenseDisplay license="MIT" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://opensource.org/licenses/MIT');
    expect(screen.getByText('MIT License')).toBeInTheDocument();
  });

  it('renders CC0 license', () => {
    render(<LicenseDisplay license="CC0-1.0" />);
    expect(
      screen.getByText('Creative Commons Zero 1.0 Universal (Public Domain)')
    ).toBeInTheDocument();
  });

  it('renders Apache 2.0 license', () => {
    render(<LicenseDisplay license="Apache-2.0" />);
    expect(screen.getByText('Apache License 2.0')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://opensource.org/licenses/Apache-2.0');
  });

  it('renders custom URL license as link', () => {
    const customUrl = 'https://example.com/custom-license';
    render(<LicenseDisplay license={customUrl} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', customUrl);
    expect(link).toHaveTextContent(customUrl);
  });

  it('renders unknown license as text without link', () => {
    render(<LicenseDisplay license="UNKNOWN-LICENSE" />);
    expect(screen.getByText('UNKNOWN-LICENSE')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders "other" license as text', () => {
    render(<LicenseDisplay license="other" />);
    expect(screen.getByText('Other (Custom)')).toBeInTheDocument();
  });
});
