import { useState } from 'react';
import '../styles/EndpointForm.css';

const STORAGE_KEY = 'stac_endpoint_url';
const DEFAULT_ENDPOINT = 'https://planetarycomputer.microsoft.com/api/stac/v1';

interface EndpointFormProps {
  onSubmit: (url: string) => void;
}

export function EndpointForm({ onSubmit }: EndpointFormProps) {
  const [url, setUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_ENDPOINT;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, url);
    onSubmit(url);
  };

  return (
    <form className="endpoint-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="endpoint-input">STAC Catalog Endpoint:</label>
        <input
          id="endpoint-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/api/stac/v1"
        />
      </div>
      <button type="submit">Load Catalog</button>
    </form>
  );
}
