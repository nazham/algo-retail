import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  PaginatedProductResponse,
  ProductQueryFilters,
  UpdateProductRequest,
  ProductWithCategoryDto,
} from '@algo/types';
import { toast } from 'sonner';

export function useProducts(filters: ProductQueryFilters) {
  const queryClient = useQueryClient();

  // Fetch paginated products
  const productsQuery = useQuery({
    queryKey: ['products', filters],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (filters.page) searchParams.append('page', filters.page.toString());
      if (filters.limit) searchParams.append('limit', filters.limit.toString());
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.categoryId) searchParams.append('categoryId', filters.categoryId);

      return apiClient<PaginatedProductResponse>(`/products?${searchParams.toString()}`);
    },
  });

  // Mutation for updating a product
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      apiClient<ProductWithCategoryDto[]>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: ['products', filters] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<PaginatedProductResponse>([
        'products',
        filters,
      ]);

      // Optimistically update
      if (previousProducts) {
        queryClient.setQueryData<PaginatedProductResponse>(['products', filters], {
          ...previousProducts,
          items: previousProducts.items.map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        });
      }

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', filters], context.previousProducts);
      }
      toast.error('Failed to update product');
    },
    onSuccess: () => {
      toast.success('Product updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products', filters] });
    },
  });

  return {
    products: productsQuery.data?.items ?? [],
    total: productsQuery.data?.total ?? 0,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    updateProduct: updateProductMutation.mutate,
    isUpdating: updateProductMutation.isPending,
  };
}

export function useProductBatches(parentId: string | null) {
  return useQuery({
    queryKey: ['products', parentId, 'batches'],
    queryFn: () => {
      if (!parentId || parentId === 'undefined') return [];
      return apiClient<ProductWithCategoryDto[]>(`/products/${parentId}/batches`);
    },
    enabled: !!parentId,
  });
}
