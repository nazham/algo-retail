import { useState, useEffect } from 'react';
import { Search, Trash2, ShoppingCart, Plus, Minus, PauseCircle, RotateCcw } from 'lucide-react';
import { useCartStore } from '../stores/cart.store';
import { Button } from '@repo/ui/components/ui/button';
import { useProducts, useCategories } from '../features/pos/hooks/use-pos-data';
import { toast } from 'sonner';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';
import { CheckoutModal } from '../features/pos/components/CheckoutModal';
import RecallOrderModal from '../features/pos/components/RecallOrderModal';

export default function PosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Editable Quantity State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');

  // Editable Discount State
  const [discountingItemId, setDiscountingItemId] = useState<string | null>(null);
  const [tempDiscount, setTempDiscount] = useState<string>('');

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
  const filteredProducts = products.filter((p) => {
    // Category filter (if a category is selected)
    const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;

    // Search filter
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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

  // -------------- Let the quantity to editiable --------------------

  const handleQuantityClick = (item: any) => {
    setEditingItemId(item.productId);
    setTempQuantity(item.quantity.toString());
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow digits and only one decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setTempQuantity(value);
    }
  };

  const handleQuantitySave = () => {
    if (editingItemId) {
      const parsedQty = parseFloat(tempQuantity);
      if (!isNaN(parsedQty)) {
        setQuantity(editingItemId, parsedQty);
      }
      setEditingItemId(null);
      setTempQuantity('');
    }
  };

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantitySave();
    }
  };

  // -------------- Let the discount be editable --------------------

  const handleDiscountClick = (item: any) => {
    setDiscountingItemId(item.productId);
    // Show current discount or empty
    setTempDiscount(item.discount ? (item.discount / 100).toString() : '');
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setTempDiscount(value);
    }
  };

  const handleDiscountSave = () => {
    if (discountingItemId) {
      const parsedDiscount = parseFloat(tempDiscount);
      if (!isNaN(parsedDiscount)) {
        // defined as cents in store
        setDiscount(discountingItemId, parsedDiscount * 100);
      } else {
        setDiscount(discountingItemId, 0);
      }
      setDiscountingItemId(null);
      setTempDiscount('');
    }
  };

  const handleDiscountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDiscountSave();
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
                <div className="font-bold text-primary">Rs. {(product.price / 100).toFixed(2)}</div>
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
      <div className="w-96 bg-card border-l border-input flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-border bg-secondary/50/50 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart size={20} /> Current Sale
          </h2>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* If cart is empty, show RECALL button, otherwise show HOLD button */}
            {items.length === 0 && heldOrders.length > 0 ? (
              <Button
                variant="outline"
                className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={() => setIsRecallOpen(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />({heldOrders.length})
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed border-gray-400 hover:border-gray-500 hover:bg-gray-100"
                onClick={handleHoldOrder}
                disabled={items.length === 0}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
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
                className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-2"
              >
                {/* ROW 1: Name & Total Price */}
                <div className="flex justify-between items-start">
                  <div className="font-medium text-card-foreground line-clamp-2 leading-tight">
                    {item.name}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">
                      Rs. {((item.price * item.quantity - (item.discount || 0)) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* ROW 2: Discount Button in the middle */}
                <div className="pt-1 pb-1">
                  {/* Discount Button */}
                  {discountingItemId === item.productId ? (
                    <div className="relative mr-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="0.00"
                        className="w-20 text-left text-sm border rounded px-1 h-8"
                        value={tempDiscount}
                        onChange={handleDiscountChange}
                        onBlur={handleDiscountSave}
                        onKeyDown={handleDiscountKeyDown}
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-0 hover:bg-transparent justify-start ${item.discount ? 'text-green-600' : 'text-muted-foreground'}`}
                      onClick={() => handleDiscountClick(item)}
                    >
                      {item.discount ? `Rs. -${(item.discount / 100).toFixed(2)}` : 'Discount'}
                    </Button>
                  )}
                </div>

                {/* ROW 3: Controls */}
                <div className="flex justify-between items-center pt-1">
                  {/* Quantity Controls Pill */}
                  <div className="flex items-center bg-secondary rounded-md h-9">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 data-[state=open]:bg-transparent hover:bg-transparent"
                      onClick={() => updateQuantity(item.productId, -1)}
                    >
                      <Minus size={16} />
                    </Button>

                    {editingItemId === item.productId ? (
                      <input
                        autoFocus
                        type="text"
                        className="w-12 text-center text-sm font-bold bg-transparent border-none focus:outline-none"
                        value={tempQuantity}
                        onChange={handleQuantityChange}
                        onBlur={handleQuantitySave}
                        onKeyDown={handleQuantityKeyDown}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="w-10 text-center text-sm font-bold cursor-pointer"
                        onClick={() => handleQuantityClick(item)}
                      >
                        {item.quantity}
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 hover:bg-transparent"
                      onClick={() => updateQuantity(item.productId, +1)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-transparent"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="p-3 pt-2 bg-secondary/50 border-t border-input space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground pt-1">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {(totals.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount</span>
              <span>Rs. {(totals.discount / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-xl text-foreground pt-2 pb-1 border-t border-input">
            <span>Total</span>
            <span className="text-primary">Rs. {(totals.total / 100).toFixed(2)}</span>
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-11 font-bold pt-0"
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
