import { Button } from '@repo/ui/components/ui/button';
import { PauseCircle, RotateCcw, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CartItemRow } from '../features/pos/components/CartItemRow';
import { CheckoutModal } from '../features/pos/components/CheckoutModal';
import RecallOrderModal from '../features/pos/components/RecallOrderModal';
import { useCategories, useProducts } from '../features/pos/hooks/use-pos-data';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';
import { useNumericInput } from '../hooks/use-numeric-input';
import { formatCurrency } from '../lib/utils';
import { useCartStore, type CartItem } from '../stores/cart.store';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Editable Quantity - using generic numeric input hook
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const quantityInput = useNumericInput({
    min: 0.01,
    max: 100000,
    decimalPlaces: 2,
    onValidChange: (value) => {
      if (editingItemId) {
        setQuantity(editingItemId, value);
      }
    },
  });

  // New State for Held Orders Modal
  const [isRecallOpen, setIsRecallOpen] = useState(false);

  const { products, isLoading, refreshProducts } = useProducts();
  const { categories } = useCategories();

  // Updated Store destructuring
  const {
    items,
    heldOrders, // <--- Get held orders list
    addToCart,
    removeFromCart,
    updateQuantity,
    setQuantity,
    setDiscount,
    getTotals,
    clearCart,
    holdOrder,
    restoreOrder,
    discardHeldOrder,
  } = useCartStore();

  const totals = getTotals();

  // Memoized map of cart item quantities for O(1) lookups during product rendering
  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      map.set(item.productId, item.quantity);
    });
    return map;
  }, [items]);

  // Combined filtering: category + search
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Category filter (if a category is selected)
      const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;

      // Early return: if category doesn't match, skip search checks
      if (!matchesCategory) return false;

      // Early return: if no search query, avoid string operations
      if (!query) return true;

      // Search filter
      return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Barcode Scanner
  useBarcodeScanner((scannedSku) => {
    const product = products.find((p) => p.sku === scannedSku);
    if (product) {
      addToCart(product);
      toast.success(`Added: ${product.name}`);
    } else {
      toast.error(`Product not found: ${scannedSku}`);
    }
  });

  // Spacebar Checkout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        items.length > 0 &&
        !isCheckoutOpen &&
        !isRecallOpen && // Don't trigger if modal is open
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, isCheckoutOpen, isRecallOpen]);

  // --- Handlers ---

  const handleHoldOrder = () => {
    if (items.length === 0) return;
    holdOrder(); // Call store action
    toast.info('Order placed on hold');
  };

  const handleRestore = (orderId: string) => {
    if (items.length > 0) {
      toast.warning('Please clear current cart before restoring.');
      return;
    }
    restoreOrder(orderId);
    setIsRecallOpen(false);
    toast.success('Order restored!');
  };

  // -------------- Quantity Editing Handlers --------------------

  const handleQuantityClick = (item: CartItem) => {
    setEditingItemId(item.productId);
    quantityInput.startEditing(item.quantity);
  };

  const handleQuantityBlur = () => {
    quantityInput.handleBlur();
    setEditingItemId(null);
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantityBlur();
    } else if (e.key === 'Escape') {
      quantityInput.cancelEditing();
      setEditingItemId(null);
    }
  };

  if (isLoading)
    return <div className="flex h-full items-center justify-center">Loading Products...</div>;

  return (
    <div className="flex h-full bg-secondary/50">
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden relative no-scrollbar">
        {/* Category Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
          <Button
            variant={selectedCategoryId === null ? 'default' : 'outline'}
            className="whitespace-nowrap snap-start"
            onClick={() => setSelectedCategoryId(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? 'default' : 'outline'}
              className="whitespace-nowrap snap-start"
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

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
          <div className="grid grid-cols-auto-fill-pos gap-4">
            {filteredProducts.map((product) => {
              const inCartQty = cartQuantities.get(product.id) || 0;
              const availableStock = (product.stock ?? 0) - inCartQty;
              const formattedStock = Number(availableStock.toFixed(2));

              let badgeClasses = '';
              let badgeText = '';
              if (availableStock <= 0) {
                badgeClasses = 'bg-destructive/10 text-destructive border-destructive/20';
                badgeText = 'Out of stock';
              } else if (availableStock <= 5) {
                badgeClasses =
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                badgeText = `${formattedStock} left`;
              } else {
                badgeClasses = 'bg-secondary text-secondary-foreground border-border';
                badgeText = `${formattedStock} in stock`;
              }

              return (
                <Button
                  key={product.id}
                  variant="outline"
                  className="h-32 flex-col items-start justify-between whitespace-normal p-3 relative overflow-hidden group hover:border-primary/50 transition-all duration-200"
                  onClick={() => addToCart(product)}
                >
                  <div className="text-left w-full">
                    <h3 className="font-bold text-card-foreground line-clamp-2 leading-tight text-sm">
                      {product.name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                      {product.sku}
                    </span>
                  </div>
                  <div className="w-full flex flex-wrap justify-between items-center mt-auto pt-2 border-t border-border/50 gap-1.5">
                    <div className="font-bold text-primary text-sm sm:text-base">
                      {formatCurrency(product.price)}
                    </div>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${badgeClasses}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* --- RECALL MODAL (Overlay) --- */}
        {isRecallOpen && (
          <RecallOrderModal
            isOpen={isRecallOpen}
            setIsRecallOpen={setIsRecallOpen}
            heldOrders={heldOrders}
            handleRestore={handleRestore}
            discardHeldOrder={discardHeldOrder}
          />
        )}
      </div>

      {/* RIGHT: Cart Sidebar */}
      <div className="w-96 bg-card/50 border-l border-input flex flex-col shadow-xl z-10">
        <div className="px-4 py-2 border-b border-border bg-secondary/50/50 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Current Sale
          </h2>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2">
            {/* If cart is empty, show RECALL button, otherwise show HOLD button */}
            {items.length === 0 && heldOrders.length > 0 ? (
              <Button variant="outline" className="w-full" onClick={() => setIsRecallOpen(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />({heldOrders.length})
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={handleHoldOrder}
                disabled={items.length === 0}
              >
                <PauseCircle className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="destructive"
              className="w-full"
              onClick={clearCart}
              disabled={items.length === 0}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground mt-20">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                isEditingQuantity={editingItemId === item.productId}
                quantityDisplayValue={quantityInput.displayValue}
                onQuantityChange={quantityInput.handleChange}
                onQuantityBlur={handleQuantityBlur}
                onQuantityKeyDown={handleQuantityKeyDown}
                onStartEditQuantity={() => handleQuantityClick(item)}
                onUpdateQuantity={(delta) => updateQuantity(item.productId, delta)}
                onSetDiscount={(discount) => setDiscount(item.productId, discount)}
                onRemove={() => removeFromCart(item.productId)}
              />
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="px-3 py-2 bg-secondary/50 border-t border-input space-y-2">
          <div className="space-y-2 text-sm text-muted-foreground pt-1">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
            )}
            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>- {formatCurrency(totals.discount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between font-bold text-xl text-foreground py-1 border-t border-input">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(totals.total)}</span>
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-11 font-bold mb-2"
            onClick={() => setIsCheckoutOpen(true)}
            disabled={items.length === 0}
          >
            Checkout (Space)
          </Button>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onComplete={() => {
          setIsCheckoutOpen(false);
          refreshProducts();
        }}
      />
    </div>
  );
}
