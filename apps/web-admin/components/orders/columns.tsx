'use client';

import { ColumnDef } from '@tanstack/react-table';
import { OrderDto } from '@algo/types';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpDown, Eye } from 'lucide-react';

export const columns: ColumnDef<OrderDto>[] = [
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Order #
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
          {row.getValue('orderNumber')}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      const isToday = new Date().toDateString() === date.toDateString();
      return <div>{isToday ? format(date, 'hh:mm a') : format(date, 'dd MMM, hh:mm a')}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'COMPLETED' ? 'success' : status === 'REFUNDED' ? 'destructive' : 'secondary'
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment',
    cell: ({ row }) => {
      const method = (row.getValue('paymentMethod') as string) || 'N/A';
      return (
        <div className="flex items-center gap-2">
          {method === 'CASH' && <span>💵</span>}
          {method === 'CARD' && <span>💳</span>}
          {method === 'BANK_TRANSFER' && <span>🏦</span>}
          <span className="capitalize">{method.replace('_', ' ')}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'grandTotal',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grandTotal'));
      return <div className="text-right font-bold">{formatCurrency(amount)}</div>;
    },
  },
  {
    id: 'cashier',
    header: 'Cashier',
    cell: () => {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
            S
          </div>
          <span className="text-sm text-muted-foreground">System</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="icon" title="View Details">
          <Eye className="h-4 w-4" />
        </Button>
      );
    },
  },
];
