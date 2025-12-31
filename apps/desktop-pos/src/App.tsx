import { useState, useEffect } from 'react';

// Extend the window object type to include our API
declare global {
  interface Window {
    api: {
      getProducts: () => Promise<any[]>;
    };
  }
}

function App() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Call the Electron Backend
    window.api.getProducts().then((data) => {
      setProducts(data);
    });
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Algo Retail - POS</h1>
      <p className="mb-4 text-gray-600">Connected to Local SQLite</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border p-4 rounded shadow bg-white">
            <h3 className="font-bold text-lg">{p.name}</h3>
            <div className="flex justify-between mt-2">
              <span className="text-gray-500">SKU: {p.sku}</span>
              <span className="font-mono font-bold text-green-600">
                Rs. {(p.price / 100).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;