'use client';

import * as React from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  BarChart3,
  AlertTriangle,
  Percent,
  Boxes,
  PackageMinus,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  RefreshCw,
} from 'lucide-react';

import { DashboardContainer } from '@/components/dashboard-container';
import { StatCard } from '@/components/reports/stat-card';
import { ReportCard } from '@/components/reports/report-card';
import { ReportChart } from '@/components/reports/report-chart';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useSalesReport, useProfitLossReport, useInventoryReport } from '@/hooks/use-reports';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/ui/tabs';
import { Button } from '@repo/ui/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// ─── Formatting Helpers ──────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return format(d, 'MMM dd');
}

function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) {
    return qty.toString();
  }
  return parseFloat(qty.toFixed(2)).toString();
}

// ─── Sales Tab ───────────────────────────────────────────────

function SalesTab({ from, to }: { from?: string; to?: string }) {
  const { data, isLoading } = useSalesReport(from, to);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={data ? formatCurrency(data.kpis.totalRevenue) : '—'}
          icon={DollarSign}
          description="Completed orders"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={data?.kpis.totalOrders ?? '—'}
          icon={ShoppingCart}
          description="In selected period"
          isLoading={isLoading}
        />
        <StatCard
          title="Avg Order Value"
          value={data ? formatCurrency(data.kpis.avgOrderValue) : '—'}
          icon={TrendingUp}
          description="Per transaction"
          isLoading={isLoading}
        />
        <StatCard
          title="Units Sold"
          value={data?.kpis.totalUnitsSold ?? '—'}
          icon={Package}
          description="Total quantity"
          isLoading={isLoading}
        />
      </div>

      {/* Daily Revenue Chart */}
      <ReportCard title="Revenue Trend" icon={TrendingUp}>
        <ReportChart
          type="area"
          data={data?.dailySeries ?? []}
          xAxisKey="date"
          series={[{ dataKey: 'revenue', name: 'Revenue', color: 'var(--primary)' }]}
          formatValue={formatCurrency}
          formatXAxis={formatShortDate}
          isLoading={isLoading}
        />
      </ReportCard>

      {/* Two-column: Top Products + Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <ReportCard title="Top Products" icon={BarChart3} isLoading={isLoading}>
          {data?.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No product data for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-4">#</th>
                    <th className="text-left font-medium py-2 pr-4">Product</th>
                    <th className="text-right font-medium py-2 pr-4">Qty</th>
                    <th className="text-right font-medium py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topProducts.map((p, i) => (
                    <tr key={p.productName} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-4 font-medium truncate max-w-50">{p.productName}</td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {formatQuantity(p.totalQuantity)}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(p.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        {/* Payment Breakdown Chart */}
        <ReportCard title="Payment Methods" icon={Layers}>
          <ReportChart
            type="bar"
            data={data?.paymentBreakdown ?? []}
            xAxisKey="method"
            series={[{ dataKey: 'revenue', name: 'Revenue', color: 'var(--primary)' }]}
            formatValue={formatCurrency}
            height={300}
            isLoading={isLoading}
          />
        </ReportCard>
      </div>
    </div>
  );
}

// ─── P&L Tab ─────────────────────────────────────────────────

function ProfitLossTab({ from, to }: { from?: string; to?: string }) {
  const { data, isLoading } = useProfitLossReport(from, to);

  const marginVariant =
    data && data.kpis.grossMarginPercent >= 30
      ? 'success'
      : data && data.kpis.grossMarginPercent >= 15
        ? 'default'
        : 'danger';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={data ? formatCurrency(data.kpis.revenue) : '—'}
          icon={ArrowUpRight}
          variant="success"
          description="Total sales"
          isLoading={isLoading}
        />
        <StatCard
          title="Cost of Goods"
          value={data ? formatCurrency(data.kpis.cogs) : '—'}
          icon={ArrowDownRight}
          variant="danger"
          description="COGS from inventory"
          isLoading={isLoading}
        />
        <StatCard
          title="Gross Profit"
          value={data ? formatCurrency(data.kpis.grossProfit) : '—'}
          icon={DollarSign}
          variant={data && data.kpis.grossProfit >= 0 ? 'success' : 'danger'}
          description="Revenue − COGS"
          isLoading={isLoading}
        />
        <StatCard
          title="Gross Margin"
          value={data ? `${data.kpis.grossMarginPercent}%` : '—'}
          icon={Percent}
          variant={marginVariant}
          description="Profit / Revenue"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue vs COGS Chart */}
      <ReportCard title="Revenue vs Cost of Goods" icon={TrendingUp}>
        <ReportChart
          type="area"
          data={data?.dailySeries ?? []}
          xAxisKey="date"
          series={[
            { dataKey: 'revenue', name: 'Revenue', color: 'hsl(142, 71%, 45%)' },
            { dataKey: 'cogs', name: 'COGS', color: 'hsl(0, 84%, 60%)' },
            { dataKey: 'profit', name: 'Profit', color: 'var(--primary)' },
          ]}
          formatValue={formatCurrency}
          formatXAxis={formatShortDate}
          height={350}
          isLoading={isLoading}
        />
      </ReportCard>

      {/* P&L Summary Table */}
      <ReportCard title="P&L Summary" icon={BarChart3} isLoading={isLoading}>
        <div className="space-y-0">
          {[
            { label: 'Revenue (Sales)', value: data?.kpis.revenue ?? 0, bold: true },
            {
              label: '  Less: Cost of Goods Sold',
              value: -(data?.kpis.cogs ?? 0),
              indent: true,
            },
            {
              label: 'Gross Profit',
              value: data?.kpis.grossProfit ?? 0,
              bold: true,
              divider: true,
            },
            { label: '  Tax Collected', value: data?.kpis.taxCollected ?? 0, indent: true },
            {
              label: '  Discounts Given',
              value: -(data?.kpis.discountsGiven ?? 0),
              indent: true,
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-2.5 px-1 ${
                row.divider ? 'border-t border-b border-border' : ''
              }`}
            >
              <span
                className={`text-sm ${row.bold ? 'font-semibold' : 'text-muted-foreground'} ${
                  row.indent ? 'pl-4' : ''
                }`}
              >
                {row.label}
              </span>
              <span
                className={`text-sm font-mono ${row.bold ? 'font-semibold' : ''} ${
                  row.value < 0 ? 'text-red-500' : ''
                }`}
              >
                {row.value < 0 ? '−' : ''} {formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>
      </ReportCard>
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────

function InventoryTab({ from, to }: { from?: string; to?: string }) {
  const [lowStockPage, setLowStockPage] = React.useState(1);
  const [movementsPage, setMovementsPage] = React.useState(1);
  const { data, isLoading } = useInventoryReport(lowStockPage, 10, movementsPage, 10, from, to);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Value (Cost)"
          value={data ? formatCurrency(data.kpis.totalStockValue) : '—'}
          icon={Boxes}
          description="At cost price"
          isLoading={isLoading}
        />
        <StatCard
          title="Active SKUs"
          value={data?.kpis.activeSkus ?? '—'}
          icon={Package}
          description={`${data?.kpis.inactiveSkus ?? 0} inactive`}
          isLoading={isLoading}
        />
        <StatCard
          title="Low Stock"
          value={data?.kpis.lowStockCount ?? '—'}
          icon={AlertTriangle}
          variant={data && data.kpis.lowStockCount > 0 ? 'warning' : 'default'}
          description="Below reorder point"
          isLoading={isLoading}
        />
        <StatCard
          title="Out of Stock"
          value={data?.kpis.outOfStockCount ?? '—'}
          icon={PackageMinus}
          variant={data && data.kpis.outOfStockCount > 0 ? 'danger' : 'default'}
          description="Zero quantity"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <ReportCard title="Stock Value by Category" icon={BarChart3}>
          <ReportChart
            type="pie"
            data={data?.categoryBreakdown ?? []}
            xAxisKey="categoryName"
            series={[
              {
                dataKey: 'stockValue',
                name: 'Stock Value',
                color: 'var(--primary)',
              },
            ]}
            formatValue={formatCurrency}
            height={300}
            isLoading={isLoading}
          />
        </ReportCard>

        {/* Movement Summary */}
        <ReportCard
          title={from || to ? 'Movement Summary' : 'Movement Summary (30 days)'}
          icon={TrendingUp}
          isLoading={isLoading}
        >
          {data?.movementSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No inventory movements recorded in this period
            </p>
          ) : (
            <div className="space-y-4">
              {data?.movementSummary.map((m) => {
                const styles: Record<string, { color: string; label: string }> = {
                  PURCHASE: { color: 'text-emerald-500', label: 'Purchases In' },
                  SALE: { color: 'text-blue-500', label: 'Sales Out' },
                  RETURN: { color: 'text-amber-500', label: 'Returns' },
                  ADJUSTMENT: { color: 'text-orange-500', label: 'Adjustments' },
                };
                const style = styles[m.type] ?? {
                  color: 'text-muted-foreground',
                  label: m.type,
                };

                return (
                  <div
                    key={m.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className={`text-sm font-medium ${style.color}`}>{style.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.count} movement{m.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatQuantity(m.totalQuantity)} units
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(m.totalValue)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportCard>
      </div>

      {/* Low Stock Items Table */}
      <ReportCard title="Low Stock Items" icon={AlertTriangle} isLoading={isLoading}>
        {data?.lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            All products are well stocked! 🎉
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-4">Product</th>
                    <th className="text-left font-medium py-2 pr-4">SKU</th>
                    <th className="text-right font-medium py-2 pr-4">Stock</th>
                    <th className="text-right font-medium py-2 pr-4">Reorder At</th>
                    <th className="text-right font-medium py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.lowStockItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 font-medium truncate max-w-50">{item.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">
                        {item.sku || '—'}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <span
                          className={
                            item.stock <= 0
                              ? 'text-red-500 font-semibold'
                              : item.stock <= item.reorderPoint
                                ? 'text-amber-500 font-semibold'
                                : ''
                          }
                        >
                          {formatQuantity(item.stock)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {formatQuantity(item.reorderPoint)}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(item.stock * item.costPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.lowStockTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(lowStockPage - 1) * 10 + 1} to{' '}
                  {Math.min(lowStockPage * 10, data.lowStockTotal)} of {data.lowStockTotal} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLowStockPage((prev) => Math.max(prev - 1, 1))}
                    disabled={lowStockPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-medium">
                    Page {lowStockPage} of {data.lowStockTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLowStockPage((prev) => Math.min(prev + 1, data.lowStockTotalPages))
                    }
                    disabled={lowStockPage === data.lowStockTotalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ReportCard>

      {/* Detailed Movements Log */}
      <ReportCard title="Detailed Movements Log" icon={TrendingUp} isLoading={isLoading}>
        {data?.movements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No movements recorded during this period
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-4">Product</th>
                    <th className="text-left font-medium py-2 pr-4">SKU</th>
                    <th className="text-left font-medium py-2 pr-4">Type</th>
                    <th className="text-right font-medium py-2 pr-4">Qty</th>
                    <th className="text-right font-medium py-2 pr-4">Cost Price</th>
                    <th className="text-right font-medium py-2 pr-4">Date</th>
                    <th className="text-left font-medium py-2 pr-4">User</th>
                    <th className="text-left font-medium py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-2 pr-4 font-medium truncate max-w-37.5">{m.productName}</td>
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                        {m.productSku || '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.type === 'PURCHASE'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : m.type === 'SALE'
                                ? 'bg-blue-500/10 text-blue-600'
                                : m.type === 'RETURN'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-orange-500/10 text-orange-600'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono font-medium">
                        <span className={m.quantity < 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {m.quantity > 0 ? '+' : ''}
                          {formatQuantity(m.quantity)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-muted-foreground">
                        {formatCurrency(m.costPrice)}
                      </td>
                      <td className="py-2 pr-4 text-right text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(m.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground truncate max-w-25">
                        {m.userName || 'System'}
                      </td>
                      <td
                        className="py-2 text-xs text-muted-foreground max-w-37.5 truncate"
                        title={m.remarks || m.reason || ''}
                      >
                        {m.remarks || m.reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.movementsTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-2">
                <p className="text-xs text-muted-foreground">
                  Showing {(movementsPage - 1) * 10 + 1} to{' '}
                  {Math.min(movementsPage * 10, data.movementsTotal)} of {data.movementsTotal} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={movementsPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-medium">
                    Page {movementsPage} of {data.movementsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMovementsPage((prev) => Math.min(prev + 1, data.movementsTotalPages))
                    }
                    disabled={movementsPage === data.movementsTotalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ReportCard>
    </div>
  );
}

// ─── Main Reports Page ───────────────────────────────────────

export default function ReportsPage() {
  // Default to last 30 days
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const to = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  return (
    <DashboardContainer size="wide">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Sales analytics, profitability, and inventory insights.
            </p>
          </div>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>

        {/* Tabbed Reports */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales">Sales Summary</TabsTrigger>
            <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesTab from={from} to={to} />
          </TabsContent>

          <TabsContent value="pnl">
            <ProfitLossTab from={from} to={to} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab from={from} to={to} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContainer>
  );
}
