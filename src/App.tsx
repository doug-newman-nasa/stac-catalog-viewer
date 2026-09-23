import { useState } from 'react';
import { EndpointForm } from './components/EndpointForm';
import { CatalogTree } from './components/CatalogTree';
import './App.css';

function App() {
  const [rootUrl, setRootUrl] = useState<string | null>(null);

  const handleEndpointSubmit = (url: string) => {
    setRootUrl(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>STAC Catalog Viewer</h1>
        <p>Explore Spatiotemporal Asset Catalogs</p>
      </header>

      <main className="app-main">
        <EndpointForm onSubmit={handleEndpointSubmit} />

        {rootUrl && (
          <section className="catalog-section">
            <CatalogTree rootUrl={rootUrl} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
