import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface OrderSummary {
  id: string;
  orderNumber: string;
  grandTotal: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeProducts: number;
  lowStockItems: number;
  recentOrders: OrderSummary[];
}

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiClient<DashboardStats>('/dashboard/stats'),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
