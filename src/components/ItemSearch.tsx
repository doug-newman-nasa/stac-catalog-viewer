import { useState } from 'react';
import type { ItemSearchParams } from '../lib/itemSearch';
import '../styles/CollectionSearch.css';

interface ItemSearchProps {
  searchParams: ItemSearchParams;
  onSearchParamsChange: (params: ItemSearchParams) => void;
  onSearch: (params: ItemSearchParams) => void;
  onClearSearch: () => void;
  loading?: boolean;
  error?: Error | null;
}

export function ItemSearch({
  searchParams,
  onSearchParamsChange,
  onSearch,
  onClearSearch,
  loading = false,
  error = null,
}: ItemSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const searchParamsToSend = { ...searchParams };

    // Parse bbox string if present
    if (searchParamsToSend.bboxString) {
      const parts = searchParamsToSend.bboxString.split(',').map((v) => parseFloat(v.trim()));
      if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
        searchParamsToSend.bbox = parts as [number, number, number, number];
      } else {
        // Invalid bbox format, don't search
        return;
      }
    } else {
      searchParamsToSend.bbox = undefined;
    }

    // Parse ids string if present
    if (searchParamsToSend.idsString) {
      const ids = searchParamsToSend.idsString
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      searchParamsToSend.ids = ids.length > 0 ? ids : undefined;
    } else {
      searchParamsToSend.ids = undefined;
    }

    onSearch(searchParamsToSend);
  };

  const handleBboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchParamsChange({ ...searchParams, bboxString: value || undefined });
  };

  const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchParamsChange({
      ...searchParams,
      datetime: value || undefined,
    });
  };

  const handleIdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchParamsChange({
      ...searchParams,
      idsString: value || undefined,
    });
  };


  const handleClearAll = () => {
    onClearSearch();
  };

  const isValidBbox = (bboxString: string): boolean => {
    if (!bboxString) return true;
    const parts = bboxString.split(',').map((v) => parseFloat(v.trim()));
    return parts.length === 4 && parts.every((p) => !isNaN(p));
  };

  const bboxValue = searchParams.bboxString || '';
  const idsValue = searchParams.idsString || '';

  return (
    <div className="collection-search">
      <form onSubmit={handleSearch} className="collection-search-form">
        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Search & Filter Items
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
              <label htmlFor="ids-search">Item IDs</label>
              <input
                id="ids-search"
                type="text"
                placeholder="id1, id2, id3"
                value={idsValue}
                onChange={handleIdsChange}
                className="search-input"
              />
              <small>Comma-separated item identifiers</small>
            </div>
          </div>
        )}

        <div className="search-controls">
          <button type="submit" disabled={loading} className="search-button">
            {loading ? 'Searching...' : 'Apply Filters'}
          </button>
          {(searchParams.bbox || searchParams.bboxString || searchParams.datetime || searchParams.ids || searchParams.idsString) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="clear-button"
              disabled={loading}
            >
              Clear Filters
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error.message}
        </div>
      )}

      {searchParams.bboxString && !isValidBbox(searchParams.bboxString) && (
        <div className="error-message">
          <strong>Invalid bounding box:</strong> Please enter 4 comma-separated numbers (W, S, E, N)
        </div>
      )}
    </div>
  );
}
