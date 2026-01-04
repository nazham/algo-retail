import { useEffect, useState } from 'react';
import { Search, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../stores/cart.store'; // <--- Import Store

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Hook into the Zustand Store
  const { items, addToCart, removeFromCart, updateQuantity, getTotals, clearCart } = useCartStore();
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

    const totals = getTotals();

    try {
      // 1. Send data to Electron
      const result = await window.api.createOrder({
        subtotal: totals.subtotal,
        taxTotal: totals.tax,
        discountTotal: 0,
        grandTotal: totals.total,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      });

      // 2. Success Feedback
      alert(`Order Successful! Invoice: ${result.orderNumber}`);
      clearCart();

      // 3. Optional: Reload products to see updated stock (if we displayed stock)
      // window.api.getProducts().then(setProducts);
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
              <button
                key={product.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group flex flex-col justify-between h-32 active:scale-95"
                onClick={() => addToCart(product)} // <--- CONNECTED
              >
                <div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono mt-1 block">{product.sku}</span>
                </div>
                <div className="font-bold text-blue-600">
                  Rs. {(product.price / 100).toFixed(2)}
                </div>
              </button>
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
          <button onClick={clearCart} className="text-red-500 text-xs hover:bg-red-50 p-2 rounded">
            Clear
          </button>
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
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-gray-600 disabled:opacity-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 hover:bg-white rounded shadow-sm text-gray-600"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="ml-3 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
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

          <button
            onClick={handleCharge}
            disabled={items.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg flex items-center justify-center gap-2"
          >
            <span>CHARGE</span>
            <span>Rs. {(totals.total / 100).toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
