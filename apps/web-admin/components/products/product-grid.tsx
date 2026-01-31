'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  ExpandedState,
  getExpandedRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Search,
  Plus,
  Loader2,
  Package,
} from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useProducts, useProductBatches } from '@/hooks/use-products';
import { ProductWithCategoryDto } from '@algo/types';
import { EditableCell } from './editable-cell';
import { cn } from '@repo/ui/lib/utils';

// Sub-component for batch expansion
function BatchRows({ parentId }: { parentId: string }) {
  const { data: batches, isLoading } = useProductBatches(parentId);

  if (isLoading) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={7} className="h-10 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
        </TableCell>
      </TableRow>
    );
  }

  if (!batches || batches.length === 0) {
    return null;
  }

  return (
    <>
      {batches.map((batch) => (
        <TableRow key={batch.id} className="bg-muted/20 border-l-4 border-l-primary/30">
          <TableCell className="pl-12 font-mono text-xs opacity-70">
            {batch.sku || 'No SKU'}
          </TableCell>
          <TableCell className="font-medium text-xs">
            {batch.name} <span className="text-muted-foreground ml-1">(Batch)</span>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px] h-4">
              {batch.category?.name || 'Uncategorized'}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="text-xs">
              {(batch.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </TableCell>
          <TableCell>
            <div className="text-xs font-semibold">{batch.stock}</div>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {new Date(batch.updatedAt).toLocaleDateString()}
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ProductGrid() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { products, total, isLoading, updateProduct } = useProducts({
    page,
    limit: 20,
    search: debouncedSearch,
  });

  const columns = React.useMemo<ColumnDef<ProductWithCategoryDto>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return (
            <button
              onClick={() => row.toggleExpanded()}
              className="hover:bg-muted p-1 rounded transition-colors"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          );
        },
      },
      {
        accessorKey: 'sku',
        header: 'SKU / Barcode',
        cell: ({ row }) => <div className="font-mono text-sm">{row.original.sku || '-'}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }) => (
          <EditableCell
            value={row.original.name}
            onSave={(value) => {
              const result = z.string().min(1, 'Name cannot be empty').safeParse(value);
              if (!result.success) {
                toast.error(result.error.errors[0].message);
                return;
              }
              updateProduct({ id: row.original.id, data: { name: result.data } });
            }}
            className="font-medium"
          />
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.category?.name || 'Uncategorized'}</Badge>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price (LKR)',
        cell: ({ row }) => (
          <EditableCell
            value={row.original.price}
            type="number"
            onSave={(value) => {
              const result = z.coerce.number().min(0, 'Price must be positive').safeParse(value);
              if (!result.success) {
                toast.error(result.error.errors[0].message);
                return;
              }
              updateProduct({ id: row.original.id, data: { price: result.data } });
            }}
          />
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => {
          // Disable editing if it's a parent product (has no parentId means it might have batches)
          // For MVP, if there's any batch, stock is read-only on parent.
          const isReadOnly = !row.original.parentId;

          return isReadOnly ? (
            <div className="px-2 py-1 font-semibold text-primary">{row.original.stock}</div>
          ) : (
            <EditableCell
              value={row.original.stock}
              type="number"
              onSave={(value) => {
                const result = z.coerce
                  .number()
                  .int()
                  .min(0, 'Stock must be 0 or more')
                  .safeParse(value);
                if (!result.success) {
                  toast.error(result.error.errors[0].message);
                  return;
                }
                updateProduct({ id: row.original.id, data: { stock: result.data } });
              }}
            />
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {new Date(row.original.updatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [updateProduct],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading products...</p>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && <BatchRows parentId={row.original.id} />}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{products.length}</span> of{' '}
          <span className="font-medium">{total}</span> products
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm font-medium">Page {page}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
