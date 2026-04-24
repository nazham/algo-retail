import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, ShoppingCart, Plus, Minus, PauseCircle, RotateCcw } from 'lucide-react';
import { useCartStore, type CartItem } from '../stores/cart.store';
import { Button } from '@repo/ui/components/ui/button';
import { useProducts, useCategories } from '../features/pos/hooks/use-pos-data';
import { toast } from 'sonner';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';
import { CheckoutModal } from '../features/pos/components/CheckoutModal';
import RecallOrderModal from '../features/pos/components/RecallOrderModal';
import { CartItemDiscount } from '../features/pos/components/CartItemDiscount';
import { formatCurrency } from '../lib/utils';
import { useNumericInput } from '../hooks/use-numeric-input';

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

  const { products, isLoading } = useProducts();
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

  // Combined filtering: category + search
  const filteredProducts = useMemo(() => {
    // ⚡ Bolt Optimization: Cache the lowercase search query outside the loop
    // to prevent redundant string lowercasing on every product iteration
    const lowerSearchQuery = searchQuery.toLowerCase();

    return products.filter((p) => {
      // Category filter (if a category is selected)
      const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;

      // ⚡ Bolt Optimization: Early return for category mismatch to avoid string operations
      if (!matchesCategory) return false;

      // ⚡ Bolt Optimization: Early return if search query is empty
      if (!lowerSearchQuery) return true;

      // Search filter
      const matchesSearch =
        p.name.toLowerCase().includes(lowerSearchQuery) ||
        p.sku.toLowerCase().includes(lowerSearchQuery);

      return matchesSearch;
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
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-32 flex-col items-start justify-between whitespace-normal"
                onClick={() => addToCart(product)}
              >
                <div className="text-left">
                  <h3 className="font-bold text-card-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono mt-1 block">
                    {product.sku}
                  </span>
                </div>
                <div className="font-bold text-primary">{formatCurrency(product.price)}</div>
              </Button>
            ))}
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
              <div
                key={item.productId}
                className="bg-card border border-border p-3 rounded-lg shadow-sm flex flex-col gap-2"
              >
                {/* ROW 1: Name & Total Price */}
                <div className="flex justify-between items-start gap-2">
                  <div
                    className="font-medium text-sm text-card-foreground truncate leading-tight flex-1"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="font-bold text-base text-foreground whitespace-nowrap">
                    <span className="text-primary">
                      {formatCurrency(item.price * item.quantity - (item.discount || 0))}
                    </span>
                  </div>
                </div>

                {/* ROW 2: Price Breakdown & Discount Value */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {formatCurrency(item.price)} x {item.quantity}
                  </span>
                  {(item.discount || 0) > 0 && (
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(item.discount || 0)}
                    </span>
                  )}
                </div>

                {/* ROW 3: Quantity Controls & Actions */}
                <div className="flex justify-between items-center mt-1">
                  {/* Quantity Controls Pill */}
                  <div className="flex items-center bg-secondary/50 rounded-md h-7 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-transparent shrink-0"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus size={14} />
                    </Button>

                    {editingItemId === item.productId ? (
                      <input
                        autoFocus
                        type="text"
                        className="w-12 text-center text-sm font-bold bg-transparent border-none focus:outline-none p-0 mx-1"
                        value={quantityInput.displayValue}
                        onChange={quantityInput.handleChange}
                        onBlur={handleQuantityBlur}
                        onKeyDown={handleQuantityKeyDown}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="min-w-6 max-w-24 px-1 text-center text-sm font-bold cursor-pointer select-none truncate"
                        onClick={() => handleQuantityClick(item)}
                        title={item.quantity.toString()}
                      >
                        {item.quantity}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-transparent shrink-0"
                      onClick={() => updateQuantity(item.productId, +1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>

                  {/* Actions (Discount & Trash) */}
                  <div className="flex items-center gap-1">
                    <CartItemDiscount
                      currentDiscount={item.discount || 0}
                      onUpdate={(val) => setDiscount(item.productId, val)}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-transparent"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
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
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount</span>
              {/*<span>Rs. {(totals.discount / 100).toFixed(2)}</span>*/}
              <span> {formatCurrency(totals.discount)}</span>
            </div>
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
        onComplete={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
