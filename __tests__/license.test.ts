import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('License', () => {
  it('should have LICENSE.md file', () => {
    const licensePath = resolve(__dirname, '../LICENSE.md');
    const license = readFileSync(licensePath, 'utf-8');
    expect(license).toBeTruthy();
    expect(license.length).toBeGreaterThan(0);
  });

  it('should contain NASA Open Source Agreement in LICENSE.md', () => {
    const licensePath = resolve(__dirname, '../LICENSE.md');
    const license = readFileSync(licensePath, 'utf-8');
    expect(license).toContain('NASA Open Source Agreement');
    expect(license).toContain('Version 1.3');
  });

  it('should have correct license in package.json', () => {
    const packageJsonPath = resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.license).toBe('NASA-NOSA-1.3');
  });

  it('should reference NASA NOSA license in README.md', () => {
    const readmePath = resolve(__dirname, '../README.md');
    const readme = readFileSync(readmePath, 'utf-8');
    expect(readme).toContain('NASA Open Source Agreement');
    expect(readme).toContain('LICENSE.md');
  });

  it('should include NASA copyright notice in README.md', () => {
    const readmePath = resolve(__dirname, '../README.md');
    const readme = readFileSync(readmePath, 'utf-8');
    expect(readme).toContain('National Aeronautics and Space Administration');
    expect(readme).toContain('All Rights Reserved');
  });

  it('should have valid NOSA license header structure in LICENSE.md', () => {
    const licensePath = resolve(__dirname, '../LICENSE.md');
    const license = readFileSync(licensePath, 'utf-8');

    const requiredSections = [
      '## 1. DEFINITIONS',
      '## 2. GRANT OF RIGHTS',
      '## 3. ACCEPTANCE AND RESTRICTIONS',
      '## 4. INDEMNIFICATION',
      '## 5. DISCLAIMER OF WARRANTIES',
      '## 6. LIMITATION OF LIABILITY',
      '## 7. GENERAL',
      '## 8. GOVERNMENT AGENCY',
    ];

    requiredSections.forEach((section) => {
      expect(license).toContain(section);
    });
  });
});
