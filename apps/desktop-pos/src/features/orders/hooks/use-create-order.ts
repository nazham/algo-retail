import { useState } from 'react';
import type { CreateOrderDto } from '@algo/types';

export function useCreateOrder() {
  const [isCreating, setIsCreating] = useState(false);

  const createOrder = async (orderData: CreateOrderDto) => {
    setIsCreating(true);
    try {
      const result = await window.api.invoke('orders:create', orderData);

      if (!result || !result.orderNumber) {
        throw new Error('Failed to create order');
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Order creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsCreating(false);
    }
  };

  return { createOrder, isCreating };
}
