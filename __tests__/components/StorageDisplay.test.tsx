import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageDisplay } from '../../src/components/StorageDisplay';
import type { StacCatalog } from '../../src/types/stac';

describe('StorageDisplay', () => {
  it('should render nothing when data has no storage property', () => {
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
    };

    const { container } = render(<StorageDisplay data={data} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when storage property is empty', () => {
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {},
    };

    const { container } = render(<StorageDisplay data={data} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render toggle button when storage property exists', () => {
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button', { name: /💾 Storage Information/ });
    expect(toggle).toBeInTheDocument();
  });

  it('should expand and collapse storage information on toggle click', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

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
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('Azure Blob Storage')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('https://myaccount.blob.core.windows.net/mycontainer')).toBeInTheDocument();
  });

  it('should display requester pays information when true', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should display requester pays information when false', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should display credentials information', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Credentials Required:')).toBeInTheDocument();
    expect(screen.getByText('AWS IAM Role')).toBeInTheDocument();
  });

  it('should display all storage properties', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('Requester Pays:')).toBeInTheDocument();
    expect(screen.getByText('Credentials Required:')).toBeInTheDocument();
  });

  it('should display custom storage properties', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('customProperty:')).toBeInTheDocument();
    expect(screen.getByText('custom value')).toBeInTheDocument();
  });

  it('should handle object-type storage properties', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('metadata:')).toBeInTheDocument();
    const preElement = screen.getByText(/key.*value/);
    expect(preElement).toBeInTheDocument();
  });

  it('should update aria-expanded attribute when toggled', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not display null or undefined storage properties', async () => {
    const user = userEvent.setup();
    const data: any = {
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

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.queryByText('nullProperty')).not.toBeInTheDocument();
    expect(screen.queryByText('undefinedProperty')).not.toBeInTheDocument();
  });

  it('should render nothing when only empty storage:schemes property exists', () => {
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      'storage:schemes': {},
    };

    const { container } = render(<StorageDisplay data={data} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display storage:schemes information when present', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          platform: 'https://{bucket}.s3.{region}.amazonaws.com',
          bucket: 'prod-lads',
          region: 'us-west-2',
        },
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('prod-lads')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
  });

  it('should display multiple storage schemes', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'prod-data',
          region: 'us-west-2',
        },
        azure: {
          type: 'azure-blob',
          bucket: 'prod-data-azure',
          endpoint: 'https://myaccount.blob.core.windows.net',
        },
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('azure')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('azure-blob')).toBeInTheDocument();
    expect(screen.getByText('prod-data')).toBeInTheDocument();
    expect(screen.getByText('prod-data-azure')).toBeInTheDocument();
  });

  it('should display storage:schemes with all possible properties', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          platform: 'https://{bucket}.s3.{region}.amazonaws.com',
          bucket: 'data-bucket',
          region: 'us-east-1',
          endpoint: 'https://s3.us-east-1.amazonaws.com',
        },
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('Bucket:')).toBeInTheDocument();
    expect(screen.getByText('data-bucket')).toBeInTheDocument();
    expect(screen.getByText('Region:')).toBeInTheDocument();
    expect(screen.getByText('us-east-1')).toBeInTheDocument();
    expect(screen.getByText('Endpoint:')).toBeInTheDocument();
    expect(screen.getByText('https://s3.us-east-1.amazonaws.com')).toBeInTheDocument();
  });

  it('should handle both storage and storage:schemes properties', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      storage: {
        platform: 'S3',
      },
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'data-bucket',
        },
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Platform:')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('data-bucket')).toBeInTheDocument();
  });

  it('should display custom properties in storage:schemes', async () => {
    const user = userEvent.setup();
    const data: any = {
      type: 'Catalog',
      stac_version: '1.0.0',
      id: 'test-catalog',
      description: 'Test catalog',
      links: [],
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'data-bucket',
          customProperty: 'custom-value',
        },
      },
    };

    render(<StorageDisplay data={data} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('customProperty:')).toBeInTheDocument();
    expect(screen.getByText('custom-value')).toBeInTheDocument();
  });

  it('should display storage:schemes when item has the property', async () => {
    const user = userEvent.setup();
    const item: any = {
      type: 'Feature',
      stac_version: '1.0.0',
      stac_extensions: ['storage'],
      id: 'MOD02QKM_7.A2024001.0000.061',
      geometry: null,
      bbox: null,
      links: [],
      assets: {},
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          platform: 'https://{bucket}.s3.{region}.amazonaws.com',
          bucket: 'prod-lads',
          region: 'us-west-2',
        },
      },
    };

    render(<StorageDisplay data={item} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('prod-lads')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
  });

  it('should display storage:schemes from item features with multiple schemes', async () => {
    const user = userEvent.setup();
    const item: any = {
      type: 'Feature',
      id: 'item-1',
      geometry: null,
      links: [],
      assets: {},
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'data-bucket',
          region: 'us-west-2',
        },
        azure: {
          type: 'azure-blob',
          bucket: 'data-bucket-azure',
          endpoint: 'https://myaccount.blob.core.windows.net',
        },
      },
    };

    render(<StorageDisplay data={item} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('azure')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('azure-blob')).toBeInTheDocument();
    expect(screen.getByText('data-bucket')).toBeInTheDocument();
    expect(screen.getByText('data-bucket-azure')).toBeInTheDocument();
  });

  it('should display storage:schemes from properties object (STAC item structure)', async () => {
    const user = userEvent.setup();
    const item: any = {
      type: 'Feature',
      id: 'MOD02QKM_7.A2024001.0000.061',
      geometry: null,
      links: [],
      assets: {},
      properties: {
        'storage:schemes': {
          aws: {
            type: 'aws-s3',
            platform: 'https://{bucket}.s3.{region}.amazonaws.com',
            bucket: 'prod-lads',
            region: 'us-west-2',
          },
        },
      },
    };

    render(<StorageDisplay data={item} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('aws-s3')).toBeInTheDocument();
    expect(screen.getByText('prod-lads')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
  });

  it('should display storage from properties object and storage:schemes from top level', async () => {
    const user = userEvent.setup();
    const item: any = {
      type: 'Feature',
      id: 'item-1',
      geometry: null,
      links: [],
      assets: {},
      properties: {
        storage: {
          platform: 'Azure Blob Storage',
          location: 'https://myaccount.blob.core.windows.net/mycontainer',
        },
      },
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'data-bucket',
        },
      },
    };

    render(<StorageDisplay data={item} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('Azure Blob Storage')).toBeInTheDocument();
    expect(screen.getByText('https://myaccount.blob.core.windows.net/mycontainer')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('data-bucket')).toBeInTheDocument();
  });

  it('should prioritize top-level storage:schemes over properties storage:schemes', async () => {
    const user = userEvent.setup();
    const item: any = {
      type: 'Feature',
      id: 'item-1',
      geometry: null,
      links: [],
      assets: {},
      properties: {
        'storage:schemes': {
          azure: {
            type: 'azure-blob',
            bucket: 'from-properties',
          },
        },
      },
      'storage:schemes': {
        aws: {
          type: 'aws-s3',
          bucket: 'from-top-level',
        },
      },
    };

    render(<StorageDisplay data={item} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(screen.getByText('aws')).toBeInTheDocument();
    expect(screen.getByText('from-top-level')).toBeInTheDocument();
    expect(screen.queryByText('azure')).not.toBeInTheDocument();
  });
});
