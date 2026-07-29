'use client';

import { DashboardContainer } from '@/components/dashboard-container';
import { columns } from '@/components/orders/columns';
import { DataTable } from '@/components/orders/data-table';
import { DataTableToolbar } from '@/components/orders/data-table-toolbar';
import { OrderDetailsSheet } from '@/components/orders/order-details-sheet';
import { useOrders } from '@/hooks/use-orders';

import { OrderStatusType } from '@algo/types';
import { Button } from '@repo/ui/components/ui/button';
import { format } from 'date-fns';
import { FileText, RefreshCw } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper to update URL
  function updateUrl(updates: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`);
  }

  // --- STATE ---
  // 1. URL State (Source of Truth)
  const page = Number(searchParams.get('page')) || 1;
  const status = (searchParams.get('status') || undefined) as OrderStatusType | undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // 2. Local State (Debounced or Controlled)
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [date, setDate] = React.useState<DateRange | undefined>(
    from && to ? { from: new Date(from), to: new Date(to) } : undefined,
  );

  // 3. UI State
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const isFirstSearchRender = React.useRef(true);

  // --- SYNC ---
  // Debounce search update to URL
  React.useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateUrl({ search: search, page: 1 }); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (from && to) {
      setDate({ from: new Date(from), to: new Date(to) });
    } else if (!from && !to) {
      setDate(undefined);
    }
  }, [from, to]);

  // Sync Date to URL
  React.useEffect(() => {
    if (date?.from && date?.to) {
      const newFrom = format(date.from, 'yyyy-MM-dd');
      const newTo = date.to ? format(date.to, 'yyyy-MM-dd') : undefined;
      if (newFrom !== from || newTo !== to) {
        updateUrl({ from: newFrom, to: newTo, page: 1 });
      }
    } else if (!date && (from || to)) {
      updateUrl({ from: undefined, to: undefined, page: 1 });
    }
  }, [date]);

  // --- DATA FETCHING ---
  const { orders, total, totalPages, isLoading, isError, refetch } = useOrders({
    page,
    limit: 20,
    search: searchParams.get('search') || undefined,
    status,
    from: from || undefined,
    to: to || undefined,
  });

  // Modify columns to add click handler
  const clickableColumns = React.useMemo<typeof columns>(() => {
    return columns.map((col) => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: ({ row }) => (
            <Button
              variant="ghost"
              size="icon"
              title="View Details"
              onClick={() => setSelectedOrderId(row.original.id)}
            >
              <FileText className="h-4 w-4" />
            </Button>
          ),
        };
      }
      if ('accessorKey' in col && col.accessorKey === 'orderNumber') {
        return {
          ...col,
          cell: ({ row }) => (
            <div
              className="font-medium text-blue-600 hover:underline cursor-pointer"
              onClick={() => setSelectedOrderId(row.original.id)}
            >
              {row.getValue('orderNumber')}
            </div>
          ),
        };
      }
      return col;
    });
  }, [columns]);

  return (
    <DashboardContainer size="wide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage sales orders and transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        date={date}
        onDateChange={setDate}
        status={status}
        onStatusChange={(val) => updateUrl({ status: val, page: 1 })}
        onReset={() => {
          setSearch('');
          setDate(undefined);
          router.replace(pathname);
        }}
      />

      <div className="mt-4">
        <DataTable
          columns={clickableColumns}
          data={orders}
          page={page}
          pageCount={totalPages}
          onPageChange={(p) => updateUrl({ page: p })}
          isLoading={isLoading}
        />
      </div>

      <OrderDetailsSheet orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </DashboardContainer>
  );
}
