'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardContainer } from '@/components/dashboard-container';
import { StatCard, Skeleton } from '@/components/reports/stat-card';
import { useDashboard } from '@/hooks/use-dashboard';
import { DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

// Format cents to currency string
function formatCurrency(cents: number): string {
  return `Rs. ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Status badge for order table
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
    REFUNDED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status] || 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { stats, isLoading } = useDashboard();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  const userName = session.user.name || 'there';

  return (
    <DashboardContainer size="wide">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {getGreeting()}, {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Revenue"
            value={stats ? formatCurrency(stats.todayRevenue) : '—'}
            icon={DollarSign}
            description="Completed orders"
            isLoading={isLoading}
          />
          <StatCard
            title="Today's Orders"
            value={stats?.todayOrders ?? '—'}
            icon={ShoppingCart}
            description="Total transactions"
            isLoading={isLoading}
          />
          <StatCard
            title="Active Products"
            value={stats?.activeProducts ?? '—'}
            icon={Package}
            description="In your catalog"
            isLoading={isLoading}
          />
          <StatCard
            title="Low Stock"
            value={stats?.lowStockItems ?? '—'}
            icon={AlertTriangle}
            description="Below 10 units"
            variant={stats && stats.lowStockItems > 0 ? 'warning' : 'default'}
            isLoading={isLoading}
          />
        </div>

        {/* Recent Orders */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 p-5 border-b border-border">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-semibold">Recent Orders</h2>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats?.recentOrders.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Orders from the POS will appear here once synced.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium px-5 py-3">Order #</th>
                    <th className="text-left font-medium px-5 py-3">Amount</th>
                    <th className="text-left font-medium px-5 py-3">Payment</th>
                    <th className="text-left font-medium px-5 py-3">Status</th>
                    <th className="text-right font-medium px-5 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono text-xs">#{order.orderNumber}</td>
                      <td className="px-5 py-3 font-medium">{formatCurrency(order.grandTotal)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{order.paymentMethod}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
