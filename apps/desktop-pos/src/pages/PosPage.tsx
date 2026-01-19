import { useState, useEffect } from 'react';
import { Search, Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../stores/cart.store';
import { Button } from '@repo/ui/components/ui/button'; // Shadcn
import { useProducts } from '../features/pos/hooks/use-pos-data'; // New Hooks
import { toast } from 'sonner';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';
import { CheckoutModal } from '../features/pos/components/CheckoutModal';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 1. Use the new Hooks (Trainee-proof)
  const { products, isLoading } = useProducts();

  // 2. Zustand Store
  const { items, addToCart, removeFromCart, updateQuantity, getTotals, clearCart } = useCartStore();
  const totals = getTotals();

  // 3. Logic
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Barcode Scanner Hook
  useBarcodeScanner((scannedSku) => {
    console.log('🔫 Scanned:', scannedSku);

    // 1. Find the product
    const product = products.find((p) => p.sku === scannedSku);

    if (product) {
      // 2. Add to Cart
      addToCart(product);
      toast.success(`Added: ${product.name}`);
    } else {
      // 3. Error (Sound/Alert)
      toast.error(`Product not found: ${scannedSku}`);
      // Optional: Play a "beep" sound here
    }
  });

  // Spacebar to Open Checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input and cart has items
      if (
        e.code === 'Space' &&
        items.length > 0 &&
        !isCheckoutOpen &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, isCheckoutOpen]);

  const handleCheckoutComplete = () => {
    setIsCheckoutOpen(false);
  };

  if (isLoading)
    return <div className="flex h-full items-center justify-center">Loading Products...</div>;

  return (
    <div className="flex h-full bg-secondary/50">
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-32 flex-col items-start justify-between whitespace-normal"
                onClick={() => addToCart(product)} // <--- CONNECTED
              >
                <div className="text-left">
                  <h3 className="font-bold text-card-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono mt-1 block">
                    {product.sku}
                  </span>
                </div>
                <div className="font-bold text-primary">Rs. {(product.price / 100).toFixed(2)}</div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart Sidebar */}
      <div className="w-96 bg-card border-l border-input flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-border bg-secondary/50/50 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Current Sale
          </h2>
          <Button
            onClick={clearCart}
            variant="destructive"
            size="sm"
            disabled={!(items.length > 0)}
          >
            Clear
          </Button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center bg-card border border-border p-3 rounded-lg shadow-sm"
              >
                <div className="flex-1">
                  <div className="font-medium text-card-foreground line-clamp-1">{item.name}</div>
                  <div className="text-xs text-primary font-bold">
                    Rs. {((item.price * item.quantity) / 100).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, -1)}
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, +1)}
                  >
                    <Plus size={12} />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.productId)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-secondary/50 border-t border-input space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {(totals.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (0%)</span>
              <span>Rs. {(totals.tax / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-2xl text-foreground pt-2 border-t border-input">
            <span>Total</span>
            <span className="text-primary">Rs. {(totals.total / 100).toFixed(2)}</span>
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-14 font-bold"
            onClick={() => setIsCheckoutOpen(true)}
            disabled={items.length === 0}
          >
            Checkout (Space)
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onComplete={handleCheckoutComplete}
      />
    </div>
  );
}
