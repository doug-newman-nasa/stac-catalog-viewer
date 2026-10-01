import { useState } from 'react';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import '../styles/CollectionSearch.css';

interface CollectionSearchProps {
  searchParams: CollectionSearchParams;
  onSearchParamsChange: (params: CollectionSearchParams) => void;
  onSearch: (params: CollectionSearchParams) => void;
  onClearSearch: () => void;
  loading?: boolean;
  error?: Error | null;
}

export function CollectionSearch({
  searchParams,
  onSearchParamsChange,
  onSearch,
  onClearSearch,
  loading = false,
  error = null,
}: CollectionSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleBboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      onSearchParamsChange({ ...searchParams, bbox: undefined });
      return;
    }

    const parts = value.split(',').map((v) => parseFloat(v.trim()));
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      onSearchParamsChange({ ...searchParams, bbox: parts as [number, number, number, number] });
    }
  };

  const handleTextSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchParamsChange({
      ...searchParams,
      q: value || undefined,
    });
  };

  const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchParamsChange({
      ...searchParams,
      datetime: value || undefined,
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onSearchParamsChange({
      ...searchParams,
      limit: isNaN(value) ? undefined : value,
    });
  };

  const handleClearAll = () => {
    onClearSearch();
  };

  const bboxValue = searchParams.bbox ? searchParams.bbox.join(', ') : '';

  return (
    <div className="collection-search">
      <form onSubmit={handleSearch} className="collection-search-form">
        <div className="search-section">
          <div className="form-group">
            <label htmlFor="q-search">Search Collections</label>
            <input
              id="q-search"
              type="text"
              placeholder="Search by title, description, or keywords"
              value={searchParams.q || ''}
              onChange={handleTextSearch}
              className="search-input"
            />
          </div>
        </div>

        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Filters
        </button>

        {showAdvanced && (
          <div className="advanced-section">
            <div className="form-group">
              <label htmlFor="bbox-search">Bounding Box (W, S, E, N)</label>
              <input
                id="bbox-search"
                type="text"
                placeholder="-180, -90, 180, 90"
                value={bboxValue}
                onChange={handleBboxChange}
                className="search-input"
              />
              <small>Comma-separated: west, south, east, north</small>
            </div>

            <div className="form-group">
              <label htmlFor="datetime-search">Date Range (ISO 8601)</label>
              <input
                id="datetime-search"
                type="text"
                placeholder="2020-01-01/2023-12-31"
                value={searchParams.datetime || ''}
                onChange={handleDatetimeChange}
                className="search-input"
              />
              <small>Format: start/end, start/, /end, or single date</small>
            </div>

            <div className="form-group">
              <label htmlFor="limit-search">Results Per Page</label>
              <input
                id="limit-search"
                type="number"
                min="1"
                max="100"
                value={searchParams.limit || 25}
                onChange={handleLimitChange}
                className="search-input"
              />
            </div>
          </div>
        )}

        <div className="search-controls">
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Search Collections'}
          </button>
          {(searchParams.q || searchParams.bbox || searchParams.datetime) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="clear-button"
              disabled={loading}
            >
              Clear Results
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error.message}
        </div>
      )}
    </div>
  );
}
