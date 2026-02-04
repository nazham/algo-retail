'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, { old: any; new: any }>;
  createdAt: string;
  userName?: string;
}

export function useProductAudit(
  productId: string | null,
  options?: { page?: number; limit?: number },
) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;

  return useQuery({
    queryKey: ['audit-logs', 'PRODUCT', productId, { page, limit }],
    queryFn: async () => {
      if (!productId) return [];
      const params = new URLSearchParams({
        entityType: 'PRODUCT',
        entityId: productId,
        page: page.toString(),
        limit: limit.toString(),
      });
      return apiClient<AuditLog[]>(`/audit-logs?${params}`);
    },
    enabled: !!productId,
    placeholderData: keepPreviousData,
  });
}
