import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group flex flex-col justify-between h-32"
                onClick={() => console.log('Add to cart:', product.name)} // TODO: Connect to Store
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
      <div className="w-[400px] flex flex-col bg-white shadow-xl z-20">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-lg text-gray-700">Current Order</h2>
          <div className="text-xs text-gray-400">#INV-NEW</div>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* TODO: Map Cart Items Here */}
          <div className="text-center text-gray-400 mt-10">Cart is empty</div>
        </div>

        {/* Footer: Totals & Pay Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>Rs. 0.00</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-xl text-gray-800 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>Rs. 0.00</span>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg flex items-center justify-center gap-2">
            <span>CHARGE</span>
            <span>Rs. 0.00</span>
          </button>
        </div>
      </div>
    </div>
  );
}
