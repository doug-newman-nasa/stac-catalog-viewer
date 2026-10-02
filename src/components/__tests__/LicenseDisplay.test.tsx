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

  it('renders CC-BY-SA-4.0 license', () => {
    render(<LicenseDisplay license="CC-BY-SA-4.0" />);
    expect(screen.getByText('Creative Commons Attribution ShareAlike 4.0 International')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
  });

  it('renders CC-BY-NC-4.0 license', () => {
    render(<LicenseDisplay license="CC-BY-NC-4.0" />);
    expect(screen.getByText('Creative Commons Attribution NonCommercial 4.0 International')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-nc/4.0/');
  });

  it('renders GPL-3.0 license', () => {
    render(<LicenseDisplay license="GPL-3.0" />);
    expect(screen.getByText('GNU General Public License v3.0')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.gnu.org/licenses/gpl-3.0.html');
  });

  it('renders PDDL-1.0 license', () => {
    render(<LicenseDisplay license="PDDL-1.0" />);
    expect(screen.getByText('Open Data Commons Public Domain Dedication and License')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://opendatacommons.org/licenses/pddl/');
  });

  it('renders http:// URL license as link', () => {
    const httpUrl = 'http://example.com/license';
    render(<LicenseDisplay license={httpUrl} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', httpUrl);
  });

  it('renders license name when URL is not available', () => {
    render(<LicenseDisplay license="GPL-3.0" />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('GNU General Public License v3.0');
    expect(link).not.toHaveTextContent('GPL-3.0');
  });

  it('renders with proper structure and classes', () => {
    const { container } = render(<LicenseDisplay license="MIT" />);
    const licenseDisplay = container.querySelector('.license-display');
    expect(licenseDisplay).toBeInTheDocument();

    const label = container.querySelector('.license-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('📜 License:');
  });

  it('renders license link with proper attributes', () => {
    render(<LicenseDisplay license="CC-BY-4.0" />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('license-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders unknown license with license-text class', () => {
    const { container } = render(<LicenseDisplay license="CUSTOM-LICENSE-ID" />);
    const licenseText = container.querySelector('.license-text');
    expect(licenseText).toBeInTheDocument();
    expect(licenseText).toHaveTextContent('CUSTOM-LICENSE-ID');
  });

  it('displays full SPDX name for all mapped licenses', () => {
    const licenses = [
      { id: 'CC-BY-4.0', name: 'Creative Commons Attribution 4.0 International' },
      { id: 'CC0-1.0', name: 'Creative Commons Zero 1.0 Universal (Public Domain)' },
      { id: 'Apache-2.0', name: 'Apache License 2.0' },
      { id: 'MIT', name: 'MIT License' },
    ];

    licenses.forEach(({ id, name }) => {
      const { unmount } = render(<LicenseDisplay license={id} />);
      expect(screen.getByText(name)).toBeInTheDocument();
      unmount();
    });
  });

  it('uses correct URL for https custom license', () => {
    const httpsUrl = 'https://example.com/custom-license.html';
    render(<LicenseDisplay license={httpsUrl} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', httpsUrl);
    expect(link).toHaveTextContent(httpsUrl);
  });

  it('renders icon with license label', () => {
    const { container } = render(<LicenseDisplay license="MIT" />);
    const label = container.querySelector('.license-label');
    expect(label?.textContent).toMatch(/📜/);
  });

  it('handles license with no URL mapping and no SPDX name', () => {
    render(<LicenseDisplay license="UnknownLicenseFormat" />);
    const licenseText = screen.getByText('UnknownLicenseFormat');
    expect(licenseText).toBeInTheDocument();
    expect(licenseText).toHaveClass('license-text');
  });
});
