import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CategoryDto } from '@algo/types';

export function useCategories() {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      apiClient<{ items: CategoryDto[]; serverTime: string }>('/products/categories/sync'),
  });

  return {
    categories: categoriesQuery.data?.items ?? [],
    isLoading: categoriesQuery.isLoading,
  };
}
