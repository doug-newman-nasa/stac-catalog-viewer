import { Routes, Route, useNavigate } from 'react-router-dom';
import { EndpointForm } from './components/EndpointForm';
import { CatalogPage } from './pages/CatalogPage';
import './App.css';

function App() {
  const navigate = useNavigate();

  const handleEndpointSubmit = (url: string) => {
    navigate(`/catalog?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>STAC Catalog Viewer</h1>
        <p>Explore Spatiotemporal Asset Catalogs</p>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <section className="form-section">
                <EndpointForm onSubmit={handleEndpointSubmit} />
              </section>
            }
          />
          <Route path="/catalog" element={<CatalogPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
