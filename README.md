# STAC Catalog Viewer

A React-based web application for exploring and browsing Spatiotemporal Asset Catalogs (STAC). This tool allows users to visually navigate STAC catalogs, view comprehensive collection metadata, and explore child catalogs and items with pagination support.

## What It Does

STAC Catalog Viewer provides an interactive interface to:
- **Connect to STAC endpoints** — Enter a STAC catalog API endpoint URL
- **Browse catalog hierarchies** — Navigate parent and child catalogs with pagination controls
- **View collection metadata** — Display catalog titles, descriptions, and statistics
- **Explore temporal and spatial extents** — View temporal date ranges and spatial bounding boxes from collection metadata
- **Browse collection images** — Display preview, browse, and thumbnail images from collection links and assets
- **View collection keywords** — See topic and subject keywords associated with collections
- **Paginate results** — Efficiently browse large collections with configurable page sizes (10, 25, 50, 100 items)
- **Persistent endpoints** — Save your last used endpoint in browser storage

## Features

### Collection Metadata Display
The application displays comprehensive collection information:

- **Extent Information** — View temporal date ranges and spatial bounding boxes
  - Temporal: Shows start and end dates for data collection periods
  - Spatial: Displays geographic bounds in longitude/latitude with optional elevation data
  
- **Browse Images** — Visual preview of collection content
  - Displays images from `preview` and `browse` links in catalog metadata
  - Shows thumbnail and browse images from collection assets
  - Supports multiple image types: JPEG, PNG, GIF, WebP
  - Responsive grid layout with clickable links to full-resolution images
  
- **Keywords** — Collection topic and subject tags
  - Displays keywords associated with the collection
  - Tag-style presentation for easy scanning
  - Supports special characters and unicode text

### Pagination
- Configurable page sizes: 10, 25, 50, or 100 items per page
- Separate pagination for child catalogs and collection items
- Top and bottom pagination controls for convenience
- Support for paginated item search via the `items` link

## Prerequisites

- Node.js 18+ and npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stac-catalog-viewer
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Start the development server with hot module reloading:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## Testing

### Run Tests

Run tests in watch mode (re-runs on file changes):
```bash
npm test
```

Run tests once:
```bash
npm test -- --run
```

### Test Coverage

Generate a coverage report with HTML visualization:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view detailed coverage information.

**Current Coverage:**
- Statements: 97.35%
- Lines: 97.18%
- Functions: 92.2%
- Branches: 96.62%

**Test Statistics:**
- Total Tests: 218+
- Test Files: 10
- Key Component Coverage: 100% (BrowseImagesDisplay, KeywordsDisplay, ExtentDisplay)

### Interactive Test UI

Launch the Vitest interactive dashboard:
```bash
npm test:ui
```

## Project Structure

```
stac-catalog-viewer/
├── src/
│   ├── components/                    # React components
│   │   ├── BrowseImagesDisplay.tsx      # Browse/preview image grid display
│   │   ├── CatalogPage.tsx              # Main catalog collection view
│   │   ├── ExtentDisplay.tsx            # Temporal and spatial extent display
│   │   ├── KeywordsDisplay.tsx          # Collection keywords tag display
│   │   └── ...                          # Other components
│   ├── hooks/
│   │   ├── useStacNode.ts              # Hook for fetching STAC catalog data
│   │   └── useStacItemsSearch.ts       # Hook for paginated items search
│   ├── lib/
│   │   └── stac.ts                     # STAC utility functions
│   ├── pages/
│   │   └── CatalogPage.tsx             # Catalog collection page
│   ├── types/
│   │   └── stac.ts                     # TypeScript types
│   ├── styles/                         # CSS stylesheets
│   ├── App.tsx                         # Root component
│   └── main.tsx                        # Entry point
├── __tests__/                          # Test files
│   ├── components/                     # Component tests
│   ├── hooks/                          # Hook tests
│   ├── lib/                            # Utility tests
│   └── pages/                          # Page tests
├── vitest.config.ts                   # Test configuration
├── package.json                       # Dependencies and scripts
└── vite.config.ts                     # Vite configuration
```

## Technology Stack

- **React 19** — UI framework
- **TypeScript** — Type-safe JavaScript
- **Vite** — Fast build tool and dev server
- **Vitest** — Unit testing framework
- **React Testing Library** — Component testing utilities
- **Oxlint** — Fast JavaScript linter

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests in watch mode |
| `npm test -- --run` | Run tests once and exit |
| `npm test:ui` | Launch interactive test dashboard |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run Oxlint code quality checks |

## Example Usage

1. Start the application: `npm run dev`
2. Enter a STAC catalog endpoint (e.g., `https://cmr.earthdata.nasa.gov/stac`)
3. Click "Load Catalog" to fetch and display the root catalog
4. Browse collection information:
   - View temporal and spatial extents
   - See preview/browse images in a responsive grid
   - Review keywords for the collection
5. Click collection names to navigate child catalogs
6. Adjust page size dropdown to view different numbers of items per page
7. Use pagination controls to navigate through large collections
8. Click item links to open full STAC item details in a new tab

## Contributing

When making changes:
- Run tests: `npm test`
- Check code quality: `npm run lint`
- Generate coverage: `npm run test:coverage`
- Ensure all tests pass before committing

## License

This project is licensed under the NASA Open Source Agreement (NOSA) v1.3. See [LICENSE.md](LICENSE.md) for details.

Copyright (c) 2026 United States Government as represented by the Administrator of the National Aeronautics and Space Administration. All Rights Reserved.
