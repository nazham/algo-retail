import { useState, useEffect } from 'react';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.api
      .invoke('products:get-all')
      .then(setProducts)
      .catch((err) => console.error('Failed to fetch products', err))
      .finally(() => setIsLoading(false));
  }, []);

  return { products, isLoading };
}

export { useCategories } from './use-categories';
