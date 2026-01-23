import { useState, useEffect } from 'react';
import type { OrderDto } from '@algo/types';

export interface Order {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // This calls the handler we made in Step 3
        const data = await window.api.invoke('orders:get-all');
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
}
