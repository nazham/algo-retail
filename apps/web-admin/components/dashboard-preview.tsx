'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/ui/tabs';
import {
  Users,
  CreditCard,
  Activity,
  Search,
  Bell,
  Package,
  ShoppingCart,
  ArrowUpIcon,
  ArrowDownIcon,
  LayoutDashboard,
  FileText,
  Settings,
  Menu,
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';

interface ChartDataPoint {
  date: string;
  sales: number;
}

function SimpleLineChart({ data }: { data: ChartDataPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.sales));
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 75 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data
    .map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.sales / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = padding.top + (i / 4) * chartHeight;
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="var(--border)"
            strokeDasharray="3 3"
            opacity={0.3}
          />
        );
      })}

      {/* Y-axis labels */}
      {[0, 1, 2, 3, 4].map((i) => {
        const value = maxValue - (i / 4) * maxValue;
        const y = padding.top + (i / 4) * chartHeight;
        return (
          <text
            key={i}
            x={padding.left - 10}
            y={y + 4}
            textAnchor="end"
            className="text-xs fill-muted-foreground"
          >
            {`Rs. ${(value / 1000).toFixed(0)}k`}
          </text>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        return (
          <text
            key={i}
            x={x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {d.date}
          </text>
        );
      })}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (d.sales / maxValue) * chartHeight;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="var(--primary)" />
            <title>{`${d.date}: Rs. ${d.sales.toLocaleString()}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export function DashboardPreview() {
  const chartData: ChartDataPoint[] = [
    { date: 'Mon', sales: 12500 },
    { date: 'Tue', sales: 18900 },
    { date: 'Wed', sales: 15600 },
    { date: 'Thu', sales: 21000 },
    { date: 'Fri', sales: 25800 },
    { date: 'Sat', sales: 32400 },
    { date: 'Sun', sales: 28700 },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border/60 shadow-2xl bg-card overflow-hidden">
      {/* App Header */}
      <div className="border-b h-16 flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="hidden md:flex items-center gap-2 font-bold text-lg text-foreground">
            <div className="bg-primary/10 p-1 rounded">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            Algo Retail
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md w-[300px]">
            <Search className="h-4 w-4" />
            <span>Search transactions...</span>
            <span className="ml-auto text-xs border border-border/80 px-1 rounded bg-background">
              ⌘K
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background"></span>
          </Button>
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-foreground">Kasun Perera</div>
              <div className="text-xs text-muted-foreground">Store Manager</div>
            </div>
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary/10 text-primary">KP</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="flex h-[600px] bg-muted/10 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:flex w-[240px] flex-col border-r bg-background p-4 gap-2">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-2">MAIN MENU</div>
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: ShoppingCart, label: 'POS Terminal', active: false },
            { icon: FileText, label: 'Orders', active: false },
            { icon: Users, label: 'Customers', active: false },
            { icon: Package, label: 'Inventory', active: false },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item) => (
            <Button
              key={item.label}
              variant={item.active ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${
                item.active
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}

          <div className="mt-auto">
            <Card className="bg-primary text-primary-foreground border-none shadow-lg py-4">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-primary-foreground font-semibold">
                  <Package className="h-4 w-4" />
                  Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs opacity-90">
                3 items are running low. Reorder needed for "Keerthi Samba".
                <Button
                  size="sm"
                  className="w-full mt-3 h-7 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 border-none text-primary-foreground font-medium"
                >
                  View Items
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, here's what's happening at your store today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Export Report</Button>
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" /> Open POS
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-background/50 backdrop-blur border border-border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-muted-foreground/50 cursor-default select-none">
                Analytics
              </span>
              <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-muted-foreground/50 cursor-default select-none">
                Reports
              </span>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="py-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium pb-0">Total Sales</CardTitle>
                    <span className="h-4 w-4 text-muted-foreground font-semibold pb-1">Rs.</span>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground pt-1">145,231</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">+20.1%</span>
                      <span className="ml-1">from yesterday</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">142</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">+12%</span>
                      <span className="ml-1">from yesterday</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium whitespace-nowrap">
                      New Customers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">12</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <ArrowUpIcon className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">+4%</span>
                      <span className="ml-1">from yesterday</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="py-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">7 Items</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      <ArrowDownIcon className="h-3 w-3 text-destructive mr-1" />
                      <span className="text-destructive font-medium">Needs attention</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4 py-4">
                  <CardHeader>
                    <CardTitle>Weekly Revenue</CardTitle>
                    <CardDescription>Sales performance over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <SimpleLineChart data={chartData} />
                  </CardContent>
                </Card>

                {/* Recent Sales */}
                <Card className="col-span-3 py-4">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest 5 sales from all terminals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          name: 'Nimal Perera',
                          items: '2 items',
                          amount: 'Rs. 2,450',
                          time: 'Just now',
                          initial: 'NP',
                        },
                        {
                          name: 'Sarah Silva',
                          items: '5 items',
                          amount: 'Rs. 8,900',
                          time: '5 min ago',
                          initial: 'SS',
                        },
                        {
                          name: 'Kamal Dias',
                          items: '1 item',
                          amount: 'Rs. 450',
                          time: '12 min ago',
                          initial: 'KD',
                        },
                        {
                          name: 'Ravi Kumar',
                          items: '3 items',
                          amount: 'Rs. 3,200',
                          time: '25 min ago',
                          initial: 'RK',
                        },
                        {
                          name: 'Priya Raj',
                          items: 'Grocery haul',
                          amount: 'Rs. 12,450',
                          time: '1 hour ago',
                          initial: 'PR',
                        },
                      ].map((sale, i) => (
                        <div key={i} className="flex items-center">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {sale.initial}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none text-foreground">
                              {sale.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{sale.items}</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-sm font-semibold text-foreground">{sale.amount}</p>
                            <p className="text-xs text-muted-foreground">{sale.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
