import { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../features/orders/hooks/use-orders';
import { OrderPageLayout } from '../features/orders/components/OrderPageLayout';
import { AlertCircle } from 'lucide-react';
import type { OrderFilters, OrderStatusType } from '@algo/types';

export default function OrderPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build filters object for backend
  const filters: OrderFilters = useMemo(() => {
    const f: OrderFilters = {
      page: currentPage,
      limit: 10,
    };

    if (debouncedSearchTerm) {
      // Handle the case where user types "#" in the search
      const normalizedSearchTerm = debouncedSearchTerm.startsWith('#')
        ? debouncedSearchTerm.substring(1)
        : debouncedSearchTerm;
      f.search = normalizedSearchTerm;
    }

    if (date) {
      // Set start and end date to the same day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      f.from = startOfDay.toISOString();
      f.to = endOfDay.toISOString();
    }

    // Only add status filter if not "all"
    if (status && status.toLowerCase() !== 'all') {
      f.status = status as OrderStatusType;
    }

    return f;
  }, [debouncedSearchTerm, date, status, currentPage]);

  const { orders, total, page, totalPages, isLoading, error, refetch } = useOrders(filters);

  // Reset to page 1 when date or status filters change (not search - that's debounced)
  useEffect(() => {
    setCurrentPage(1);
  }, [date, status]);

  // Also reset to page 1 when debounced search actually changes
  useEffect(() => {
    if (debouncedSearchTerm !== '') {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-destructive gap-3">
        <AlertCircle size={32} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <OrderPageLayout
      orders={orders}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      date={date}
      setDate={setDate}
      status={status}
      setStatus={setStatus}
      currentPage={page}
      totalPages={totalPages}
      total={total}
      onPageChange={setCurrentPage}
      isLoading={isLoading}
      onRefresh={refetch}
    />
  );
}
