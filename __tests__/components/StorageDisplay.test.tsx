import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageDisplay } from '../../src/components/StorageDisplay';
import type { StacCatalog } from '../../src/types/stac';

describe('StorageDisplay', () => {
  it('should render nothing when catalog has no storage property', () => {
    const catalog: StacCatalog = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
    };

    const { container } = render(<StorageDisplay catalog={catalog} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when storage property is empty', () => {
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {},
    };

    const { container } = render(<StorageDisplay catalog={catalog} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render toggle button when storage property exists', () => {
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button', { name: /💾 Storage Information/ });
    expect(toggle).toBeInTheDocument();
  });

  it('should expand and collapse storage information on toggle click', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');

    // Initially collapsed
    expect(screen.queryByText('s3://my-bucket')).not.toBeInTheDocument();

    // Click to expand
    await user.click(toggle);
    expect(screen.getByText('s3://my-bucket')).toBeInTheDocument();

    // Click to collapse
    await user.click(toggle);
    expect(screen.queryByText('s3://my-bucket')).not.toBeInTheDocument();
  });

  it('should display platform and location information', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'Azure Blob Storage',
        location: 'https://myaccount.blob.core.windows.net/mycontainer',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('Azure Blob Storage')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('https://myaccount.blob.core.windows.net/mycontainer')).toBeInTheDocument();
  });

  it('should display requester pays information when true', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
        requesterPays: true,
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should display requester pays information when false', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'GCS',
        location: 'gs://my-bucket',
        requesterPays: false,
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should display credentials information', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://private-bucket',
        credentials: 'AWS IAM Role',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Credentials Required:')).toBeInTheDocument();
    expect(screen.getByText('AWS IAM Role')).toBeInTheDocument();
  });

  it('should display all storage properties', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
        requesterPays: true,
        credentials: 'AWS IAM Role',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('Credentials Required:')).toBeInTheDocument();
  });

  it('should display custom storage properties', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
        customProperty: 'custom value',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('customProperty:')).toBeInTheDocument();
    expect(screen.getByText('custom value')).toBeInTheDocument();
  });

  it('should handle object-type storage properties', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
        metadata: { key: 'value', nested: { prop: 'data' } },
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('metadata:')).toBeInTheDocument();
    const preElement = screen.getByText(/key.*value/);
    expect(preElement).toBeInTheDocument();
  });

  it('should update aria-expanded attribute when toggled', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not display null or undefined storage properties', async () => {
    const user = userEvent.setup();
    const catalog: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
        location: 's3://my-bucket',
        nullProperty: null,
        undefinedProperty: undefined,
      },
    };

    render(<StorageDisplay catalog={catalog} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.queryByText('nullProperty')).not.toBeInTheDocument();
    expect(screen.queryByText('undefinedProperty')).not.toBeInTheDocument();
  });
});
