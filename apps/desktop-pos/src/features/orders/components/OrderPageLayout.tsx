import { Wallet, ArrowUpRight, CreditCard, RefreshCcw, Search, Filter } from 'lucide-react';
import { StatCard, FilterButton } from './ui';
import { OrderTable } from './OrderTable';
import type { OrderDto } from '@algo/types';
import { formatCurrency } from '../../../../electron/utils/common.utils';

type OrderPageLayoutProps = {
  orders: OrderDto[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // date: Date | undefined;
  setDate: (date: Date | undefined) => void;
};

export function OrderPageLayout({
  orders,
  searchTerm,
  setSearchTerm,
  // date,
  setDate,
}: OrderPageLayoutProps) {
  // 2. THE FIX: Divide by 100 because your DB sends "cents" (integers)
  // Example: 125000 becomes 1250.00
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.grandTotal) || 0), 0);

  // Avg Ticket also needs the division (implicitly handled since totalRevenue is divided)
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  // TODO: Fetch totalRevenue & other stat-info from a backend API instead of FE processing

  const handleClearFilters = () => {
    setSearchTerm('');
    setDate(undefined);
  };

  return (
    <div className="flex flex-col h-full bg-muted/40 p-6 space-y-6 overflow-y-auto">
      {/* --- Header --- */}
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <div className="text-sm text-muted-foreground">
          Current Session: <span className="font-mono font-medium text-foreground">POS-01</span>
        </div>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={Wallet}
          trend="+12%"
          variant="blue"
        />
        <StatCard
          title="Transactions"
          value={orders.length.toString()}
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
            placeholder="Search by Order #..."
            className="w-full pl-10 pr-4 py-2 bg-muted border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/*<DatePicker
            date={date}
            setDate={setDate}
            className="w-60"
            placeholder="Filter by Date..."
          />*/}
          <FilterButton icon={Filter} label="All Status" />
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
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
