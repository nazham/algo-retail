import { useState, useEffect } from 'react';
import type { CreateOrderDto, OrderResultDto } from '@algo/types';

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

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processOrder = async (orderData: CreateOrderDto): Promise<OrderResultDto | null> => {
    setIsProcessing(true);
    try {
      const result = await window.api.invoke('orders:create', orderData);
      return result;
    } catch (error) {
      console.error('Checkout failed', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processOrder, isProcessing };
}
