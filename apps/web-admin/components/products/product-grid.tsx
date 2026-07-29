'use client';

import { useProductBatches, useProducts } from '@/hooks/use-products';
import { ProductWithCategoryDto } from '@algo/types';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Switch } from '@repo/ui/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { cn } from '@repo/ui/lib/utils';
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  PackagePlus,
  Pencil,
  Scale,
  Trash2,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AddStockDialog } from '../inventory/add-stock-dialog';
import { AdjustStockDialog } from '../inventory/adjust-stock-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import { EditableCell } from './editable-cell';
import { ProductGridToolbar } from './product-grid-toolbar';
import { ProductHistoryModal } from './product-history-modal';

// Helper for sortable headers
function SortableHeader({
  column,
  title,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: string;
  title: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const isSorted = sortBy === column;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => onSort(column)}
    >
      <span>{title}</span>
      {isSorted ? (
        sortOrder === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />
      )}
    </Button>
  );
}

// Sub-component for batch expansion
function BatchRows({ parentId }: { parentId: string }) {
  const { data: batches, isLoading } = useProductBatches(parentId);

  if (isLoading) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={10} className="h-10 text-center">
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
          <TableCell></TableCell>
          <TableCell className="font-mono text-[10px] opacity-70">
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
            <div className="text-xs opacity-70">
              {batch.costPrice
                ? (batch.costPrice / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : '-'}
            </div>
          </TableCell>
          <TableCell>
            <div className="text-xs font-semibold">{batch.stock}</div>
          </TableCell>
          <TableCell>
            <div className="text-xs text-muted-foreground">
              {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '-'}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center justify-center">
              <Badge variant={batch.isActive ? 'success' : 'secondary'} className="text-[10px]">
                {batch.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      ))}
    </>
  );
}

interface ProductGridProps {
  onEdit?: (product: ProductWithCategoryDto) => void;
}

const PAGE_SIZE = 20;

export function ProductGrid({ onEdit }: ProductGridProps) {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const [isLowStock, setIsLowStock] = React.useState(false);
  const [isExpiringSoon, setIsExpiringSoon] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const [addStockProduct, setAddStockProduct] = React.useState<ProductWithCategoryDto | null>(null);
  const [adjustStockProduct, setAdjustStockProduct] = React.useState<ProductWithCategoryDto | null>(
    null,
  );
  const [historyProduct, setHistoryProduct] = React.useState<ProductWithCategoryDto | null>(null);
  const [deleteTargetProduct, setDeleteTargetProduct] =
    React.useState<ProductWithCategoryDto | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { products, total, isLoading, updateProduct } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
    isLowStock,
    isExpiringSoon,
    sortBy,
    sortOrder,
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

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
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit?.(row.original)}
              title="Edit product"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setAddStockProduct(row.original)}
              title="Add stock"
            >
              <PackagePlus className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setAdjustStockProduct(row.original)}
              title="Adjust stock"
            >
              <Scale className="h-3 w-3 text-orange-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setHistoryProduct(row.original)}
              title="View history"
            >
              <Clock className="h-3 w-3 text-blue-600" />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU / Barcode',
        cell: ({ row }) => <div className="font-mono text-[10px]">{row.original.sku || '-'}</div>,
      },
      {
        accessorKey: 'name',
        header: () => (
          <SortableHeader
            column="name"
            title="Product Name"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <EditableCell
            value={row.original.name}
            onSave={(value) => {
              const result = z.string().min(1, 'Name cannot be empty').safeParse(value);
              if (!result.success) {
                toast.error(result.error.issues[0]?.message ?? 'Invalid input');
                return;
              }
              updateProduct({ id: row.original.id, data: { name: result.data } });
            }}
            className="font-medium text-xs"
          />
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px]">
            {row.original.category?.name || 'Uncategorized'}
          </Badge>
        ),
      },
      {
        accessorKey: 'price',
        header: () => (
          <SortableHeader
            column="price"
            title="MRP"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <EditableCell
            value={row.original.price}
            type="number"
            onSave={(value) => {
              const result = z.coerce.number().min(0, 'Price must be positive').safeParse(value);
              if (!result.success) {
                toast.error(result.error.issues[0]?.message ?? 'Invalid input');
                return;
              }
              updateProduct({ id: row.original.id, data: { price: result.data } });
            }}
            className="text-xs font-semibold"
          />
        ),
      },
      {
        accessorKey: 'costPrice',
        header: () => (
          <SortableHeader
            column="costPrice"
            title="Cost"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <EditableCell
            value={row.original.costPrice || 0}
            type="number"
            onSave={(value) => {
              const result = z.coerce.number().min(0, 'Cost must be positive').safeParse(value);
              if (!result.success) {
                toast.error(result.error.issues[0]?.message ?? 'Invalid input');
                return;
              }
              updateProduct({ id: row.original.id, data: { costPrice: result.data } });
            }}
            className="text-xs text-muted-foreground"
          />
        ),
      },
      {
        accessorKey: 'stock',
        header: () => (
          <SortableHeader
            column="stock"
            title="Stock"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => {
          const isReadOnly = !row.original.parentId;
          return isReadOnly ? (
            <div className="px-2 py-1 font-semibold text-primary text-xs">{row.original.stock}</div>
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
                  toast.error(result.error.issues[0]?.message ?? 'Invalid input');
                  return;
                }
                updateProduct({ id: row.original.id, data: { stock: result.data } });
              }}
              className="text-xs"
            />
          );
        },
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry',
        cell: ({ row }) => (
          <div className="text-[10px] text-muted-foreground whitespace-nowrap">
            {row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: () => <div className="text-right pr-2">Active</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5 pr-1">
            <Switch
              checked={row.original.isActive}
              onCheckedChange={(checked) => {
                updateProduct({ id: row.original.id, data: { isActive: checked } });
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTargetProduct(row.original)}
              title="Delete product"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [updateProduct, sortBy, sortOrder, onEdit],
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
      <ProductGridToolbar
        search={search}
        onSearchChange={setSearch}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        status={status}
        onStatusChange={setStatus}
        isLowStock={isLowStock}
        onLowStockToggle={(nextValue) => {
          setIsLowStock(nextValue);
          if (nextValue) {
            setSortBy('stock');
            setSortOrder('asc');
            setIsExpiringSoon(false);
          } else {
            setSortBy('updatedAt');
            setSortOrder('desc');
          }
        }}
        isExpiringSoon={isExpiringSoon}
        onExpiringSoonToggle={(nextValue) => {
          setIsExpiringSoon(nextValue);
          if (nextValue) {
            setSortBy('expiryDate');
            setSortOrder('asc');
            setIsLowStock(false);
          } else {
            setSortBy('updatedAt');
            setSortOrder('desc');
          }
        }}
        onReset={() => {
          setSearch('');
          setCategoryId(undefined);
          setStatus(undefined);
          setIsLowStock(false);
          setIsExpiringSoon(false);
          setSortBy('updatedAt');
          setSortOrder('desc');
        }}
      />

      {/* Grid */}
      <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[11px] h-10">
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
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Fetching inventory...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center text-muted-foreground"
                >
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-medium">No products match your filters</p>
                  <p className="text-sm opacity-60">Try adjusting your search or category</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      !row.original.isActive && 'opacity-60 grayscale-[0.5] bg-muted/5',
                    )}
                  >
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
      <div className="flex items-center justify-between py-4 px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{products.length}</span> of{' '}
          <span className="font-bold text-foreground">{total}</span> products
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="h-8"
          >
            Previous
          </Button>
          <div className="flex items-center justify-center w-24 text-sm font-medium">
            Page {page}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * PAGE_SIZE >= total || isLoading}
            className="h-8"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Inventory Dialogs */}
      <AddStockDialog
        key={`add-${addStockProduct?.id}`}
        product={addStockProduct}
        open={!!addStockProduct}
        onOpenChange={(open) => !open && setAddStockProduct(null)}
      />
      <AdjustStockDialog
        key={`adjust-${adjustStockProduct?.id}`}
        product={adjustStockProduct}
        open={!!adjustStockProduct}
        onOpenChange={(open) => !open && setAdjustStockProduct(null)}
      />
      <ProductHistoryModal
        product={historyProduct}
        open={!!historyProduct}
        onOpenChange={(open) => !open && setHistoryProduct(null)}
      />
      <DeleteProductDialog
        product={deleteTargetProduct}
        open={!!deleteTargetProduct}
        onOpenChange={(open) => !open && setDeleteTargetProduct(null)}
      />
    </div>
  );
}
