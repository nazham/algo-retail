import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  PaginatedProductResponse,
  ProductQueryFilters,
  UpdateProductRequest,
  ProductWithCategoryDto,
} from '@algo/types';
import { toast } from 'sonner';

export type UseProductsOptions = ProductQueryFilters & {
  enabled?: boolean;
  isLowStock?: boolean;
  isExpiringSoon?: boolean;
};

export function useProducts(options: UseProductsOptions = {}) {
  const { enabled = true, ...filters } = options;
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
      if (filters.isActive !== undefined)
        searchParams.append('isActive', filters.isActive.toString());
      if (filters.isLowStock) searchParams.append('isLowStock', 'true');
      if (filters.isExpiringSoon) searchParams.append('isExpiringSoon', 'true');
      if (filters.sortBy) searchParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) searchParams.append('sortOrder', filters.sortOrder);

      return apiClient<PaginatedProductResponse>(`/products?${searchParams.toString()}`);
    },
    enabled,
    refetchOnMount: 'always', // ensure fresh data when mounting
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
    onError: (err: any, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', filters], context.previousProducts);
      }
      toast.error(err.message || 'Failed to update product');
    },
    onSuccess: (data) => {
      toast.success('Product updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products', filters] });
    },
  });

  // Mutation: Create product
  const createProductMutation = useMutation({
    mutationFn: (data: unknown) =>
      apiClient('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });

  // Mutation: Delete product (soft delete)
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/products/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  return {
    products: productsQuery.data?.items ?? [],
    total: productsQuery.data?.total ?? 0,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    refetch: productsQuery.refetch,

    // Mutations
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isPending,

    updateProduct: updateProductMutation.mutate,
    isUpdating: updateProductMutation.isPending,

    deleteProduct: deleteProductMutation.mutate,
    isDeleting: deleteProductMutation.isPending,
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
