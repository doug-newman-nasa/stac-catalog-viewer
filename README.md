# STAC Catalog Viewer

A React-based web application for exploring and browsing Spatiotemporal Asset Catalogs (STAC). This tool allows users to visually navigate STAC catalogs, view catalog metadata, and explore child catalogs and items in a hierarchical tree structure.

## What It Does

STAC Catalog Viewer provides an interactive interface to:
- **Connect to STAC endpoints** — Enter a STAC catalog API endpoint URL
- **Browse catalog hierarchies** — Navigate parent and child catalogs in a collapsible tree view
- **View catalog metadata** — Display catalog titles, descriptions, and statistics
- **Track items and children** — See counts of child catalogs and items at each level
- **Persistent endpoints** — Save your last used endpoint in browser storage

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
- Statements: 100%
- Lines: 100%
- Functions: 100%
- Branches: 95.83%

### Interactive Test UI

Launch the Vitest interactive dashboard:
```bash
npm test:ui
```

## Project Structure

```
stac-catalog-viewer/
├── src/
│   ├── components/          # React components
│   │   ├── CatalogNode.tsx      # Individual catalog node in tree
│   │   ├── CatalogTree.tsx      # Tree container
│   │   └── EndpointForm.tsx     # URL input form
│   ├── hooks/
│   │   └── useStacNode.ts       # Hook for fetching STAC data
│   ├── lib/
│   │   └── stac.ts              # STAC utility functions
│   ├── types/
│   │   └── stac.ts              # TypeScript types
│   ├── styles/                  # CSS modules
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
├── __tests__/                 # Test files
│   ├── components/              # Component tests
│   ├── hooks/                   # Hook tests
│   └── lib/                     # Utility tests
├── vitest.config.ts           # Test configuration
├── package.json               # Dependencies and scripts
└── vite.config.ts             # Vite configuration
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
2. Enter a STAC catalog endpoint (e.g., `https://planetarycomputer.microsoft.com/api/stac/v1`)
3. Click "Load Catalog" to fetch and display the catalog
4. Click the expand arrow (▶) to view child catalogs
5. View metadata including titles, descriptions, and item/child counts

## Contributing

When making changes:
- Run tests: `npm test`
- Check code quality: `npm run lint`
- Generate coverage: `npm run test:coverage`
- Ensure all tests pass before committing

## License

MIT
