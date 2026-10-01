import { useState } from 'react';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import { useCollectionSearch } from '../hooks/useCollectionSearch';
import '../styles/CollectionSearch.css';

interface CollectionSearchProps {
  baseUrl: string;
  onCollectionSelect: (collection: any) => void;
}

export function CollectionSearch({ baseUrl, onCollectionSelect }: CollectionSearchProps) {
  const [searchParams, setSearchParams] = useState<CollectionSearchParams>({
    limit: 25,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const { results, loading, error, numberMatched, search, clearResults } = useCollectionSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await search(baseUrl, searchParams);
  };

  const handleBboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setSearchParams((prev) => ({ ...prev, bbox: undefined }));
      return;
    }

    const parts = value.split(',').map((v) => parseFloat(v.trim()));
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      setSearchParams((prev) => ({ ...prev, bbox: parts as [number, number, number, number] }));
    }
  };

  const handleTextSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams((prev) => ({
      ...prev,
      q: value || undefined,
    }));
  };

  const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams((prev) => ({
      ...prev,
      datetime: value || undefined,
    }));
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSearchParams((prev) => ({
      ...prev,
      limit: isNaN(value) ? undefined : value,
    }));
  };

  const handleClearAll = () => {
    setSearchParams({ limit: 25 });
    clearResults();
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

      {results.length > 0 && (
        <div className="results-section">
          <h3>
            Collections
            {numberMatched && (
              <span className="result-count">
                ({results.length}
                {numberMatched > results.length ? ` of ${numberMatched}` : ''})
              </span>
            )}
          </h3>

          <div className="collections-list">
            {results.map((collection) => (
              <div
                key={collection.id}
                className="collection-item"
                onClick={() => onCollectionSelect(collection)}
              >
                <h4>{collection.title || collection.id}</h4>
                <p className="collection-description">{collection.description}</p>
                {collection.keywords && collection.keywords.length > 0 && (
                  <div className="collection-keywords">
                    {collection.keywords.slice(0, 5).map((keyword) => (
                      <span key={keyword} className="keyword-tag">
                        {keyword}
                      </span>
                    ))}
                    {collection.keywords.length > 5 && (
                      <span className="keyword-more">+{collection.keywords.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="empty-state">
          <p>Enter search criteria to find collections</p>
        </div>
      )}
    </div>
  );
}
