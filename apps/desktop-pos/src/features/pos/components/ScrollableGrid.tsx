// features/pos/components/ScrollableGrid.tsx
import { Button } from '@repo/ui/components/ui/button';

// Define the shape of the product based on your usage
interface Product {
  id: string | number;
  name: string;
  sku: string;
  stock: number;
  price: number;
}

interface ScrollableGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const ScrollableGrid = ({ products, onAddToCart }: ScrollableGridProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Button
            key={product.id}
            variant="outline"
            className="h-32 flex-col items-start justify-between whitespace-normal"
            onClick={() => onAddToCart(product)}
          >
            <div className="text-left">
              <h3 className="font-bold text-card-foreground line-clamp-2 leading-tight">
                {product.name}
              </h3>
              <span className="text-xs text-muted-foreground font-mono mt-1 block">
                {product.sku}
              </span>
              <span className="text-xs text-muted-foreground font-mono mt-1 block">
                Stock: {product.stock}
              </span>
            </div>
            <div className="font-bold text-primary">Rs. {(product.price / 100).toFixed(2)}</div>
          </Button>
        ))}
      </div>
    </div>
  );
};
