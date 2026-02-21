import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { OrderDto, OrderFilters, PaginatedOrderResponse } from '@algo/types';

export function useOrders(filters: OrderFilters = {}) {
  const query = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (filters.page) searchParams.append('page', filters.page.toString());
      if (filters.limit) searchParams.append('limit', filters.limit.toString());
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.status) searchParams.append('status', filters.status);
      if (filters.from) searchParams.append('from', filters.from);
      if (filters.to) searchParams.append('to', filters.to);

      return apiClient<PaginatedOrderResponse>(`/orders?${searchParams.toString()}`);
    },
    placeholderData: (previousData) => previousData, // keepPreviousData logic
  });

  return {
    orders: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => {
      if (!id) return null;
      return apiClient<OrderDto>(`/orders/${id}`);
    },
    enabled: !!id,
  });
}
