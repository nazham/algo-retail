import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SalesReportDto, ProfitLossReportDto, InventoryReportDto } from '@algo/types';

function buildDateParams(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useSalesReport(from?: string, to?: string) {
  const query = useQuery({
    queryKey: ['reports', 'sales', from, to],
    queryFn: () => apiClient<SalesReportDto>(`/reports/sales${buildDateParams(from, to)}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useProfitLossReport(from?: string, to?: string) {
  const query = useQuery({
    queryKey: ['reports', 'profit-loss', from, to],
    queryFn: () =>
      apiClient<ProfitLossReportDto>(`/reports/profit-loss${buildDateParams(from, to)}`),
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useInventoryReport(
  lowStockPage?: number,
  lowStockLimit?: number,
  movementsPage?: number,
  movementsLimit?: number,
  from?: string,
  to?: string,
) {
  const query = useQuery({
    queryKey: [
      'reports',
      'inventory',
      lowStockPage,
      lowStockLimit,
      movementsPage,
      movementsLimit,
      from,
      to,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (lowStockPage) params.append('lowStockPage', String(lowStockPage));
      if (lowStockLimit) params.append('lowStockLimit', String(lowStockLimit));
      if (movementsPage) params.append('movementsPage', String(movementsPage));
      if (movementsLimit) params.append('movementsLimit', String(movementsLimit));
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const qs = params.toString() ? `?${params.toString()}` : '';
      return apiClient<InventoryReportDto>(`/reports/inventory${qs}`);
    },
    staleTime: 2 * 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
