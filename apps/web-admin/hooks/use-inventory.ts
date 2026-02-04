'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Types for inventory operations
export interface AddStockRequest {
  quantity: number;
  costPrice?: number;
  remarks?: string;
}

export interface AdjustStockRequest {
  actualStock: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'THEFT' | 'COUNT_ERROR' | 'OTHER';
  remarks?: string;
}

export interface InventoryMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  costPrice: number | null;
  reason: string | null;
  remarks: string | null;
  referenceId: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

interface MovementsResponse {
  items: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
}

interface AddStockResponse {
  movement: InventoryMovement;
  newStock: number;
}

interface AdjustStockResponse {
  movement: InventoryMovement | null;
  previousStock: number;
  newStock: number;
  delta: number;
}

/**
 * Hook for adding stock to a product (Quick Stock In)
 */
export function useAddStock(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddStockRequest) =>
      apiClient<AddStockResponse>(`/inventory/${productId}/add`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (response) => {
      toast.success(`Stock added. New stock: ${response.newStock}`);
      // Invalidate products to reflect new stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate movements for this product
      queryClient.invalidateQueries({ queryKey: ['inventory', productId, 'movements'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add stock');
    },
  });
}

/**
 * Hook for adjusting stock (Stock Adjustment)
 */
export function useAdjustStock(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdjustStockRequest) =>
      apiClient<AdjustStockResponse>(`/inventory/${productId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (response) => {
      if (response.delta === 0) {
        toast.info('No adjustment needed - stock matches');
      } else {
        const direction = response.delta > 0 ? 'increased' : 'decreased';
        toast.success(
          `Stock ${direction} by ${Math.abs(response.delta)}. New stock: ${response.newStock}`,
        );
      }
      // Invalidate products to reflect new stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidate movements for this product
      queryClient.invalidateQueries({ queryKey: ['inventory', productId, 'movements'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust stock');
    },
  });
}

/**
 * Hook for fetching movement history
 */
export function useProductMovements(
  productId: string,
  options?: { page?: number; limit?: number },
) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  return useQuery({
    queryKey: ['inventory', productId, 'movements', { page, limit }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      return apiClient<MovementsResponse>(`/inventory/${productId}/movements?${params}`);
    },
    enabled: !!productId,
  });
}
