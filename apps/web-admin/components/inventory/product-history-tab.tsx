'use client';

import { useProductMovements, InventoryMovement } from '@/hooks/use-inventory';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Loader2, Package, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface ProductHistoryTabProps {
  productId: string;
  currentStock: number;
}

const MOVEMENT_TYPE_CONFIG = {
  PURCHASE: { label: 'Purchase', variant: 'success' as const, icon: ArrowUp },
  SALE: { label: 'Sale', variant: 'destructive' as const, icon: ArrowDown },
  RETURN: { label: 'Return', variant: 'secondary' as const, icon: ArrowUp },
  ADJUSTMENT: { label: 'Adjustment', variant: 'outline' as const, icon: null },
};

const REASON_LABELS: Record<string, string> = {
  DAMAGED: 'Damaged',
  EXPIRED: 'Expired',
  THEFT: 'Theft',
  COUNT_ERROR: 'Count Error',
  OTHER: 'Other',
};

export function ProductHistoryTab({ productId, currentStock }: ProductHistoryTabProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProductMovements(productId, { page, limit: 10 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm">No stock movements recorded yet</p>
        <p className="text-xs opacity-70">Movements will appear here after stock changes</p>
      </div>
    );
  }

  const totalPages = Math.ceil((data.total || 0) / 10);

  return (
    <div className="space-y-4">
      {/* Header Stat */}
      <div className="bg-muted/30 p-3 rounded-md border flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Current Stock Level</span>
        <span className="text-lg font-bold">{currentStock}</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">Cost Price</TableHead>
            <TableHead>Reason / Reference</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((movement) => {
            const config = MOVEMENT_TYPE_CONFIG[movement.type];
            const Icon = config.icon;

            return (
              <TableRow key={movement.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(movement.createdAt), 'MMM dd, hh:mm a')}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-semibold',
                      movement.quantity > 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {movement.quantity > 0 && '+'}
                    {movement.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs">
                  {movement.costPrice ? formatCurrency(movement.costPrice) : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {movement.type === 'ADJUSTMENT' && movement.reason ? (
                    REASON_LABELS[movement.reason] || movement.reason
                  ) : movement.type === 'SALE' && movement.referenceId ? (
                    <Link
                      href={`/dashboard/orders?search=${movement.orderNumber || ''}`}
                      className="text-primary hover:underline font-mono text-xs inline-flex items-center gap-1"
                      target="_blank"
                    >
                      {movement.orderNumber || 'View Order'}
                    </Link>
                  ) : movement.referenceId ? (
                    <span className="text-muted-foreground font-mono text-xs">
                      #{movement.referenceId.slice(0, 8)}
                    </span>
                  ) : movement.remarks ? (
                    <span className="text-muted-foreground">{movement.remarks}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {movement.userName || 'System'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-muted-foreground">
          Page {page} of {Math.max(1, totalPages)} ({data.total} total)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
