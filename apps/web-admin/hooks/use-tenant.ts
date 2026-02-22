import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface TenantConfig {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  config: TenantConfig | null;
}

interface TenantResponse {
  tenant: TenantInfo | null;
}

export function useTenant() {
  const tenantQuery = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => apiClient<TenantResponse>('/tenants/me'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (tenant info rarely changes)
    refetchOnWindowFocus: false,
  });

  return {
    tenant: tenantQuery.data?.tenant ?? null,
    isLoading: tenantQuery.isLoading,
    isError: tenantQuery.isError,
    refetch: tenantQuery.refetch,
  };
}
