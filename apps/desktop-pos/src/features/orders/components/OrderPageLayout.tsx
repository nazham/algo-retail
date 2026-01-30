import { Wallet, ArrowUpRight, CreditCard, RefreshCcw, Search } from 'lucide-react';
import { StatCard } from './ui';
import { OrderTable } from './OrderTable';
import type { OrderDto } from '@algo/types';
import { formatCurrency } from '../../../lib/utils';
import { DatePicker } from '@repo/ui/components/ui/datepicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';

type OrderPageLayoutProps = {
  orders: OrderDto[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  status: string;
  setStatus: (status: string) => void;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
};

export function OrderPageLayout({
  orders,
  searchTerm,
  setSearchTerm,
  date,
  setDate,
  status,
  setStatus,
  currentPage,
  totalPages,
  total,
  onPageChange,
  isLoading,
}: OrderPageLayoutProps) {
  const totalSales = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const avgTicket = orders.length > 0 ? totalSales / total : 0;
  // TODO: Fetch totalRevenue & other stat-info from a backend API instead of FE processing
  const handleClearFilters = () => {
    setSearchTerm('');
    setDate(undefined);
    setStatus('all');
  };

  return (
    <div className="flex flex-col h-full bg-muted/40 py-3 px-5 space-y-2 overflow-y-auto no-scrollbar">
      {/* --- Header --- */}
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
      </div>
      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard title="Sales" value={formatCurrency(totalSales)} icon={Wallet} variant="blue" />
        <StatCard
          title="Transactions"
          value={total.toString()}
          icon={ArrowUpRight}
          variant="purple"
        />
        <StatCard
          title="Avg. Ticket"
          value={formatCurrency(avgTicket)}
          icon={CreditCard}
          variant="indigo"
        />
        <StatCard title="Refunds" value={formatCurrency(0)} icon={RefreshCcw} variant="orange" />
      </div>

      {/* --- Filter Bar --- */}
      <div className="bg-card p-4 rounded-xl shadow-sm border flex flex-wrap gap-3 items-center justify-between shrink-0">
        <div className="relative flex-1 min-w-62.5">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Order # or Product..."
            className="w-full pl-10 pr-4 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <DatePicker date={date} setDate={setDate} placeholder="Filter by Date..." />

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* --- Data Table Container --- */}
      <div className="flex flex-col">
        <OrderTable
          orders={orders}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
