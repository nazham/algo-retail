import { useState, useEffect, useCallback } from 'react';
import type { OrderDto, OrderFilters, PaginatedOrderResponse } from '@algo/types';

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

export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // This calls the handler we made in Step 3
      const response: PaginatedOrderResponse = await window.api.invoke('orders:get-all', filters);
      setOrders(response.data);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
