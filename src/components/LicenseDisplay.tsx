import '../styles/LicenseDisplay.css';

interface LicenseDisplayProps {
  license: string;
}

export function LicenseDisplay({ license }: LicenseDisplayProps) {
  const isLicenseUrl = license.startsWith('http://') || license.startsWith('https://');
  const isSpdxId = /^[A-Za-z0-9\-\.]+(\s+OR\s+[A-Za-z0-9\-\.]+)*$/.test(license);

  // Map common SPDX license IDs to full names
  const spdxNames: Record<string, string> = {
    'CC-BY-4.0': 'Creative Commons Attribution 4.0 International',
    'CC-BY-SA-4.0': 'Creative Commons Attribution ShareAlike 4.0 International',
    'CC0-1.0': 'Creative Commons Zero 1.0 Universal (Public Domain)',
    'CC-BY-NC-4.0': 'Creative Commons Attribution NonCommercial 4.0 International',
    'Apache-2.0': 'Apache License 2.0',
    'MIT': 'MIT License',
    'GPL-3.0': 'GNU General Public License v3.0',
    'PDDL-1.0': 'Open Data Commons Public Domain Dedication and License',
    'other': 'Other (Custom)',
  };

  const getLicenseName = (license: string): string | null => {
    return spdxNames[license] || null;
  };

  const licenseUrl = (() => {
    if (isLicenseUrl) return license;
    if (license === 'CC-BY-4.0') return 'https://creativecommons.org/licenses/by/4.0/';
    if (license === 'CC-BY-SA-4.0') return 'https://creativecommons.org/licenses/by-sa/4.0/';
    if (license === 'CC0-1.0') return 'https://creativecommons.org/publicdomain/zero/1.0/';
    if (license === 'CC-BY-NC-4.0') return 'https://creativecommons.org/licenses/by-nc/4.0/';
    if (license === 'Apache-2.0') return 'https://opensource.org/licenses/Apache-2.0';
    if (license === 'MIT') return 'https://opensource.org/licenses/MIT';
    if (license === 'GPL-3.0') return 'https://www.gnu.org/licenses/gpl-3.0.html';
    if (license === 'PDDL-1.0') return 'https://opendatacommons.org/licenses/pddl/';
    return null;
  })();

  const fullName = getLicenseName(license);

  return (
    <div className="license-display">
      <span className="license-label">📜 License:</span>
      {licenseUrl ? (
        <a href={licenseUrl} target="_blank" rel="noopener noreferrer" className="license-link">
          {fullName || license}
        </a>
      ) : (
        <span className="license-text">{fullName || license}</span>
      )}
    </div>
  );
}
