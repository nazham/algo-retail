import { useEffect, useState } from 'react';
import { Search, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../stores/cart.store'; // <--- Import Store
import { Button } from '@repo/ui/components/ui/button';
import { useOrderStore } from '../stores/order.store';

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Hook into the Cart Store
  const { items, addToCart, removeFromCart, updateQuantity, getTotals, clearCart } = useCartStore();

  // 2. Hook into the Order Store (To save history)
  const addOrder = useOrderStore((state) => state.addOrder);

  const totals = getTotals(); // Recalculate whenever items change

  // Load products on mount
  useEffect(() => {
    window.api.getProducts().then(setProducts);
  }, []);

  // Filter Logic
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCharge = async () => {
    if (items.length === 0) return;

    const currentTotals = getTotals();

    try {
      // A. Send data to Electron (Backend)
      const result = await window.api.createOrder({
        subtotal: currentTotals.subtotal,
        taxTotal: currentTotals.tax,
        discountTotal: 0,
        grandTotal: currentTotals.total,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });

      // B. SAVE TO ORDER PAGE (Dynamic Update)
      addOrder({
        id: result.orderNumber,
        date: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }),
        customer: 'Walk-in', // Default for now
        amount: currentTotals.total,
        payment: 'Cash', // Defaulting to Cash for now
        status: 'Completed',
        items: [...items],
      });

      // C. Success Feedback
      alert(`Order Successful! Invoice: ${result.orderNumber}`);
      clearCart();
    } catch (error) {
      console.error(error);
      alert('Failed to process order.');
    }
  };

  return (
    <div className="flex h-full">
      {/* LEFT: Product Grid Area */}
      <div className="flex-1 flex flex-col bg-gray-50 border-r border-gray-200">
        {/* Search Bar Header */}
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
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
                  <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono mt-1 block">{product.sku}</span>
                </div>
                <div className="font-bold text-blue-600">
                  Rs. {(product.price / 100).toFixed(2)}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart Sidebar Area */}
      <div className="w-100 flex flex-col bg-white shadow-xl z-20 h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg text-gray-700">Current Order</h2>
            <div className="text-xs text-gray-400">#INV-NEW</div>
          </div>
          <Button onClick={clearCart} variant="destructive" size="sm">
            Clear
          </Button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <span className="text-4xl">🛒</span>
              <span>Cart is empty</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-800 line-clamp-1">{item.name}</div>
                  <div className="text-blue-600 font-mono text-sm">
                    Rs. {((item.price * item.quantity) / 100).toFixed(2)}
                  </div>
                </div>

                {/* Qty Controls */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <Button
                    onClick={() => updateQuantity(item.productId, -1)}
                    variant="ghost"
                    size="icon"
                    className="h-auto w-auto p-1"
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                  <Button
                    onClick={() => updateQuantity(item.productId, 1)}
                    variant="ghost"
                    size="icon"
                    className="h-auto w-auto p-1"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => removeFromCart(item.productId)}
                  variant="ghost"
                  size="icon"
                  className="ml-3 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer: Totals & Pay Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {(totals.subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax (0%)</span>
              <span>Rs. {(totals.tax / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-xl text-gray-800 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-blue-600">Rs. {(totals.total / 100).toFixed(2)}</span>
          </div>

          <Button
            onClick={handleCharge}
            disabled={items.length === 0}
            className="w-full h-16 text-lg"
          >
            <span>CHARGE</span>
            <span>Rs. {(totals.total / 100).toFixed(2)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
