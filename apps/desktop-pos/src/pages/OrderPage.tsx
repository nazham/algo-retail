import { useState } from 'react';
import { useOrderStore } from '../stores/order.store'; // <--- Using Real Store
import type { PaymentMethod, OrderStatus } from '../stores/order.store';
import {
  Search,
  Calendar,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  Wallet,
  CreditCard,
  RefreshCcw,
  Printer,
  Eye,
} from 'lucide-react';
import { clsx } from 'clsx';

export default function OrderPage() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // FETCH ORDERS FROM STORE
  const orders = useOrderStore((state) => state.orders);

  // Toggle action menu for a specific row
  const toggleMenu = (id: string) => {
    if (activeMenu === id) setActiveMenu(null);
    else setActiveMenu(id);
  };

  // Calculations for Stats
  const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0);
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 space-y-6 overflow-y-auto">
      {/* --- Header & Title --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="text-sm text-gray-500">
          Current Session: <span className="font-mono font-medium text-gray-700">POS-01</span>
        </div>
      </div>

      {/* --- Stats Cards Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${(totalRevenue / 100).toFixed(2)}`}
          icon={Wallet}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Transactions"
          value={orders.length.toString()}
          icon={ArrowUpRight}
          color="purple"
        />
        <StatCard
          title="Avg. Ticket"
          value={`Rs. ${(avgTicket / 100).toFixed(2)}`}
          icon={CreditCard}
          color="indigo"
        />
        <StatCard title="Refunds" value="Rs. 0.00" icon={RefreshCcw} color="orange" />
      </div>

      {/* --- Filter Bar Section --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-62.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID or customer..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <FilterButton icon={Calendar} label="All Dates" />
          <FilterButton icon={Filter} label="All Status" />
          <FilterButton icon={CreditCard} label="All Methods" />
          <button className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* --- Data Table Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-gray-400 flex flex-col items-center gap-2"
                  >
                    <Wallet size={40} className="text-gray-300" />
                    <span>No transactions recorded yet.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <span className="font-mono text-blue-600 font-medium text-sm">
                        {order.id}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{order.date}</td>
                    <td className="p-4 text-sm text-gray-700 font-medium">{order.customer}</td>
                    <td className="p-4 text-sm font-bold text-gray-800">
                      Rs. {(order.amount / 100).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <PaymentBadge type={order.payment} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-right relative">
                      <button
                        onClick={() => toggleMenu(order.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === order.id && (
                        <div className="absolute right-10 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <div className="p-1">
                            <MenuItem icon={Eye} label="View Receipt" />
                            <MenuItem icon={Printer} label="Reprint" />
                            <div className="h-px bg-gray-100 my-1"></div>
                            <MenuItem icon={RefreshCcw} label="Refund" variant="danger" />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components (Included for Copy-Paste Vibe) ---

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-sm font-medium mb-1">{title}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
      <div className={clsx('p-3 rounded-xl', colorStyles[color])}>
        <Icon size={24} strokeWidth={2} />
      </div>
    </div>
  );
}

function FilterButton({ icon: Icon, label }: any) {
  return (
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all">
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

function PaymentBadge({ type }: { type: PaymentMethod }) {
  const styles = {
    Card: 'bg-blue-100 text-blue-700 border-blue-200',
    Cash: 'bg-green-100 text-green-700 border-green-200',
    Qr: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return (
    <span className={clsx('px-2.5 py-1 rounded-md text-xs font-bold border', styles[type])}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = {
    Completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    Refunded: 'bg-red-50 text-red-600 border border-red-100',
    Pending: 'bg-amber-50 text-amber-600 border border-amber-100',
  };
  return (
    <span
      className={clsx(
        'flex items-center w-fit gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        styles[status],
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          status === 'Completed'
            ? 'bg-emerald-500'
            : status === 'Refunded'
              ? 'bg-red-500'
              : 'bg-amber-500',
        )}
      ></span>
      {status}
    </span>
  );
}

function MenuItem({ icon: Icon, label, variant = 'default' }: any) {
  return (
    <button
      className={clsx(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
        variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
