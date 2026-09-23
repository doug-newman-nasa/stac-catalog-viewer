import { CatalogNode } from './CatalogNode';
import '../styles/CatalogTree.css';

interface CatalogTreeProps {
  rootUrl: string;
}

export function CatalogTree({ rootUrl }: CatalogTreeProps) {
  return (
    <div className="catalog-tree">
      <CatalogNode url={rootUrl} depth={0} isRoot={true} />
    </div>
  );
}
