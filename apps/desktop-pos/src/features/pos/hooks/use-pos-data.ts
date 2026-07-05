import { useCallback, useEffect, useState } from 'react';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(() => {
    setIsLoading(true);
    window.api
      .invoke('products:get-all')
      .then(setProducts)
      .catch((err) => console.error('Failed to fetch products', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // Initial Fetch
    fetchProducts();

    // Listen for Sync Updates
    const removeListener = window.api.on('sync:updates-available', (stats: any) => {
      console.log('📦 Products Updated via Sync:', stats);

      // OPTIMIZATION: Incremental Update (Memory Efficient)
      // If we received the actual changed items, merge them directly into state
      // instead of re-fetching the entire database.
      if (stats.changedProducts && stats.changedProducts.length > 0) {
        setProducts((prev) => {
          const productMap = new Map(prev.map((p) => [p.id, p]));
          stats.changedProducts.forEach((p: any) => {
            // Only update if active, if inactive remove/ignore
            if (p.isActive === false || p.isActive === 0) {
              productMap.delete(p.id);
            } else {
              productMap.set(p.id, p);
            }
          });
          return Array.from(productMap.values());
        });
        // Also toast
        // toast.success(`Synced ${stats.products} updated products`);
      } else if (stats.products > 0 || stats.categories > 0) {
        // Fallback or Category update: Full Refresh
        fetchProducts();
      }
    });

    return () => {
      removeListener();
    };
  }, [fetchProducts]);

  return { products, isLoading, refreshProducts: fetchProducts };
}

export { useCategories } from './use-categories';
