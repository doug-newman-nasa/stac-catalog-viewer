import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStacNode } from '../hooks/useStacNode';
import { getChildLinks, getItemLinks, getItemsLink, getBrowseLinks, getBrowseAssets, getKeywords, resolveHref } from '../lib/stac';
import { collectionSearchParamsToItemSearchParams } from '../lib/itemSearch';
import { ExtentDisplay } from '../components/ExtentDisplay';
import { BrowseImagesDisplay } from '../components/BrowseImagesDisplay';
import { KeywordsDisplay } from '../components/KeywordsDisplay';
import { CatalogListingPage } from './CatalogListingPage';
import { CollectionItemsPage } from './CollectionItemsPage';
import { CollectionSearchResultsPage } from './CollectionSearchResultsPage';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import '../styles/CatalogPage.css';

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showUrl, setShowUrl] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [hasCollectionSearchResults, setHasCollectionSearchResults] = useState(false);
  const [collectionSearchParams, setCollectionSearchParams] = useState<CollectionSearchParams>({ limit: 25 });


  const url = searchParams.get('url');

  const { data, loading, error, retry } = useStacNode(url || '');

  const itemsSearchLink = data ? getItemsLink(data) : undefined;

  const copyUrlToClipboard = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const handleNavigateToCollection = (targetUrl: string, params?: CollectionSearchParams) => {
    if (params) {
      setCollectionSearchParams(params);
    }
    navigate(`/catalog?url=${encodeURIComponent(targetUrl)}`);
  };


  if (!url) {
    return (
      <div className="catalog-page-error">
        <p>No catalog URL provided</p>
        <button onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="catalog-page loading">
        <span className="spinner">⏳</span> Loading catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-page error">
        <div className="error-content">
          <p className="error-message">{error.message}</p>
          <div className="error-actions">
            <button onClick={retry} className="retry-button">
              Retry
            </button>
            <button onClick={() => navigate(-1)} className="back-button">
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const childLinks = getChildLinks(data);
  const itemLinks = getItemLinks(data);
  const browseLinks = getBrowseLinks(data);
  const browseAssets = getBrowseAssets(data);
  const keywords = getKeywords(data);
  const browseImages = [
    ...browseLinks,
    ...browseAssets.map((asset) => ({
      rel: 'browse',
      href: asset.href,
      title: asset.title,
      type: asset.type,
    })),
  ];

  return (
    <div className="catalog-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button-header">
          ← Back
        </button>
        <button
          onClick={() => setShowUrl(!showUrl)}
          className="url-toggle-button"
          title={showUrl ? 'Hide URL' : 'Show URL'}
        >
          {showUrl ? '🔗 Hide URL' : '🔗 Show URL'}
        </button>
      </div>

      {showUrl && (
        <div className="url-display">
          <div className="url-content">
            <span className="url-label">Catalog URL:</span>
            <code className="url-value">{url}</code>
            <button
              onClick={copyUrlToClipboard}
              className="copy-button"
              title="Copy URL to clipboard"
            >
              {urlCopied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="catalog-card">
        <div className="catalog-header">
          <div className="catalog-info">
            <h2 className="catalog-title">
              {data.title || data.id}
              {data.id && data.id !== data.title && (
                <code className="catalog-id">{data.id}</code>
              )}
            </h2>
            {data.description && (
              <p className="catalog-description">{data.description}</p>
            )}
            {(childLinks.length > 0 || itemLinks.length > 0) && (
              <div className="catalog-stats">
                {childLinks.length > 0 && (
                  <span className="stat">
                    📁 {childLinks.length} child{childLinks.length !== 1 ? 'ren' : ''}
                  </span>
                )}
                {itemLinks.length > 0 && (
                  <span className="stat">
                    📄 {itemLinks.length} item{itemLinks.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {data.extent && <ExtentDisplay extent={data.extent} />}
        {browseImages.length > 0 && <BrowseImagesDisplay images={browseImages} baseUrl={url} />}
        {keywords.length > 0 && <KeywordsDisplay keywords={keywords} />}
      </div>

      {!itemsSearchLink && itemLinks.length === 0 && (
        <CollectionSearchResultsPage
          url={url}
          onNavigateToCollection={handleNavigateToCollection}
          onResultsChange={setHasCollectionSearchResults}
        />
      )}

      {!hasCollectionSearchResults && childLinks.length > 0 && (
        <CatalogListingPage url={url} childLinks={childLinks} />
      )}

      {(itemLinks.length > 0 || itemsSearchLink) && (
        <CollectionItemsPage url={url} itemLinks={itemLinks} itemsSearchLink={itemsSearchLink} collectionSearchParams={collectionSearchParams} />
      )}
    </div>
  );
}
