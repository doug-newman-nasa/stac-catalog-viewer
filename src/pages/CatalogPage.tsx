import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStacNode } from '../hooks/useStacNode';
import { getChildLinks, getItemLinks, getItemsLink, getBrowseLinks, getBrowseAssets, getKeywords, getOtherLinks, getParentLink, resolveHref, isCatalog } from '../lib/stac';
import { ExtentDisplay } from '../components/ExtentDisplay';
import { LicenseDisplay } from '../components/LicenseDisplay';
import { ParentNavigation } from '../components/ParentNavigation';
import { BrowseImagesDisplay } from '../components/BrowseImagesDisplay';
import { KeywordsDisplay } from '../components/KeywordsDisplay';
import { AssetLinks } from '../components/AssetLinks';
import { StorageDisplay } from '../components/StorageDisplay';
import { LinksDisplay } from '../components/LinksDisplay';
import { CatalogListingPage } from './CatalogListingPage';
import { CollectionItemsPage } from './CollectionItemsPage';
import { CollectionSearchResultsPage } from './CollectionSearchResultsPage';
import type { CollectionSearchParams } from '../lib/collectionSearch';
import type { StacItemCollection } from '../types/stac';
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

  const parentLink = data && isCatalog(data) ? getParentLink(data) : undefined;

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

  const handleNavigateToParent = (parentHref: string) => {
    const resolvedParentUrl = resolveHref(url!, parentHref);
    navigate(`/catalog?url=${encodeURIComponent(resolvedParentUrl)}`);
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

  const isCollectionsEndpoint = !isCatalog(data);
  const catalog = isCatalog(data) ? data : null;
  const childLinks = catalog ? getChildLinks(catalog) : [];
  const itemLinks = catalog ? getItemLinks(catalog) : [];
  const itemsSearchLink = catalog ? getItemsLink(catalog) : undefined;
  const browseLinks = catalog ? getBrowseLinks(catalog) : [];
  const browseAssets = catalog ? getBrowseAssets(catalog) : [];
  const keywords = catalog ? getKeywords(catalog) : [];
  const otherLinks = catalog ? getOtherLinks(catalog) : (data as StacItemCollection).links.filter((link) => !['self', 'root', 'parent', 'items', 'child', 'next', 'prev', 'data'].includes(link.rel));
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

      {parentLink && data && (
        <ParentNavigation
          parentLink={parentLink}
          onNavigate={handleNavigateToParent}
        />
      )}

      {isCollectionsEndpoint ? (
        <div className="collections-container">
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Collections</h3>
            </div>
            <div className="collection-list">
              {(data as StacItemCollection).features.map((collection: any) => {
                const collectionLinks = Array.isArray(collection.links) ? collection.links : [];
                const collectionSelfLink = collectionLinks.find((link: any) => link.rel === 'self' || link.rel === 'alternate');
                const collectionUrl = collectionSelfLink ? resolveHref(url!, collectionSelfLink.href) : url!;

                return (
                  <div key={collection.id} className="collection-card">
                    <div className="collection-header">
                      <h4 className="collection-title">
                        {collection.title || collection.id}
                      </h4>
                      {collection.id && collection.id !== collection.title && (
                        <code className="collection-id">{collection.id}</code>
                      )}
                    </div>
                    {collection.description && (
                      <p className="collection-description">{collection.description}</p>
                    )}
                    <button
                      onClick={() => handleNavigateToCollection(collectionUrl)}
                      className="view-collection-button"
                    >
                      View Collection
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {otherLinks.length > 0 && <LinksDisplay links={otherLinks} />}
        </div>
      ) : (
        <>
          <div className="catalog-card">
            <div className="catalog-header">
              <div className="catalog-info">
                <h2 className="catalog-title">
                  {catalog?.title || catalog?.id}
                  {catalog?.id && catalog?.id !== catalog?.title && (
                    <code className="catalog-id">{catalog?.id}</code>
                  )}
                </h2>
                {catalog?.description && (
                  <p className="catalog-description">{catalog?.description}</p>
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
            {catalog?.license && <LicenseDisplay license={catalog.license} />}
            {catalog?.extent && <ExtentDisplay extent={catalog.extent} />}
            {browseImages.length > 0 && <BrowseImagesDisplay images={browseImages} baseUrl={url} />}
            {keywords.length > 0 && <KeywordsDisplay keywords={keywords} />}
            {catalog?.assets && <AssetLinks assets={catalog.assets} />}
            <StorageDisplay data={catalog!} />
            <LinksDisplay links={otherLinks} />
          </div>

          {!itemsSearchLink && itemLinks.length === 0 && catalog && (
            <CollectionSearchResultsPage
              url={url}
              catalogData={catalog}
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
        </>
      )}
    </div>
  );
}
