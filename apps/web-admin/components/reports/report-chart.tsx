'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ChartType = 'area' | 'bar' | 'pie';

interface SeriesConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface ReportChartProps {
  type?: ChartType;
  data: Record<string, unknown>[];
  xAxisKey: string;
  series: SeriesConfig[];
  height?: number;
  formatValue?: (value: number) => string;
  formatXAxis?: (value: string) => string;
  stacked?: boolean;
  isLoading?: boolean;
}

/**
 * Thin recharts wrapper for consistent report chart styling.
 * Supports area and bar chart types with multiple series.
 */
export function ReportChart({
  type = 'area',
  data,
  xAxisKey,
  series,
  height = 300,
  formatValue,
  formatXAxis,
  stacked = false,
  isLoading = false,
}: ReportChartProps) {
  if (isLoading) {
    if (type === 'area') {
      return <AreaChartSkeleton height={height} />;
    }
    if (type === 'pie') {
      return <PieChartSkeleton height={height} />;
    }
    return <BarChartSkeleton height={height} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        <p className="text-sm">No data for this period</p>
      </div>
    );
  }

  const tooltipFormatter = (value: number) =>
    formatValue ? formatValue(value) : value.toLocaleString();

  const xAxisFormatter = (value: string) => (formatXAxis ? formatXAxis(value) : value);

  const yAxisTickFormatter = (value: number) => {
    if (formatValue) {
      const formatted = formatValue(value);
      if (formatted.includes('Rs.')) {
        // Currency is in cents. Convert to Rupees.
        const rupees = value / 100;
        const absRupees = Math.abs(rupees);
        const sign = rupees < 0 ? '-' : '';

        if (absRupees >= 1000000) {
          return `${sign}Rs. ${(absRupees / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        }
        if (absRupees >= 1000) {
          return `${sign}Rs. ${(absRupees / 1000).toFixed(1).replace(/\.0$/, '')}k`;
        }
        return `${sign}Rs. ${absRupees.toFixed(0)}`;
      }
      return formatted;
    }

    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absVal >= 1000000) {
      return `${sign}${(absVal / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (absVal >= 1000) {
      return `${sign}${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${sign}${absVal.toLocaleString()}`;
  };

  const shouldRotate = type === 'bar' && data.length > 4;

  const commonProps = {
    data,
    margin: shouldRotate
      ? { top: 20, right: 20, left: 20, bottom: 45 }
      : { top: 20, right: 20, left: 20, bottom: 10 },
  };

  const commonAxisProps = {
    xAxis: (
      <XAxis
        dataKey={xAxisKey}
        tickFormatter={xAxisFormatter}
        tick={
          shouldRotate
            ? ({
                fontSize: 10,
                angle: -45,
                textAnchor: 'end',
                fill: 'var(--muted-foreground)',
              } as any)
            : { fontSize: 12, fill: 'var(--muted-foreground)' }
        }
        height={shouldRotate ? 60 : 30}
        interval={shouldRotate ? 0 : 'preserveEnd'}
        stroke="var(--muted-foreground)"
        tickLine={false}
        axisLine={false}
      />
    ),
    yAxis: (
      <YAxis
        tickFormatter={yAxisTickFormatter}
        tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
        stroke="var(--muted-foreground)"
        tickLine={false}
        axisLine={false}
        width={80}
      />
    ),
    grid: <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />,
    tooltip: (
      <Tooltip
        formatter={tooltipFormatter}
        labelFormatter={xAxisFormatter}
        contentStyle={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '12px',
        }}
        itemStyle={{ color: 'var(--card-foreground)' }}
        labelStyle={{ color: 'var(--muted-foreground)' }}
        cursor={{ fill: 'var(--muted)', stroke: 'var(--border)', strokeWidth: 1, opacity: 0.15 }}
      />
    ),
    legend: <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />,
  };

  return (
    <div className="w-full relative flex-1" style={{ minHeight: height }}>
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart {...commonProps}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {series.length > 1 && commonAxisProps.legend}
              {series.map((s) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  stackId={stacked ? 'stack' : undefined}
                />
              ))}
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart {...commonProps}>
              {commonAxisProps.grid}
              {commonAxisProps.xAxis}
              {commonAxisProps.yAxis}
              {commonAxisProps.tooltip}
              {series.length > 1 && commonAxisProps.legend}
              {series.map((s) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  stackId={stacked ? 'stack' : undefined}
                />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              {commonAxisProps.tooltip}
              <Pie
                data={data}
                dataKey={series[0]?.dataKey || 'value'}
                nameKey={xAxisKey}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                fill="var(--primary)"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AreaChartSkeleton({ height }: { height: number }) {
  return (
    <div className="w-full relative flex flex-col justify-between" style={{ height }}>
      {/* Pulse SVG representing Area Chart */}
      <div className="flex-1 w-full relative overflow-hidden animate-pulse">
        <svg className="w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M0,80 Q15,40 30,60 T60,30 T90,50 T100,40 L100,100 L0,100 Z"
            fill="var(--primary)"
          />
          <path
            d="M0,80 Q15,40 30,60 T60,30 T90,50 T100,40"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="var(--border)" strokeDasharray="3 3" />
          <line x1="0" y1="40" x2="100" y2="40" stroke="var(--border)" strokeDasharray="3 3" />
          <line x1="0" y1="60" x2="100" y2="60" stroke="var(--border)" strokeDasharray="3 3" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="var(--border)" strokeDasharray="3 3" />
        </svg>
      </div>
      {/* X Axis ticks placeholders */}
      <div className="flex justify-between mt-2 px-2">
        <div className="h-3 w-10 bg-muted rounded animate-pulse" />
        <div className="h-3 w-10 bg-muted rounded animate-pulse" />
        <div className="h-3 w-10 bg-muted rounded animate-pulse" />
        <div className="h-3 w-10 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

function BarChartSkeleton({ height }: { height: number }) {
  return (
    <div className="w-full relative flex flex-col justify-between" style={{ height }}>
      {/* Pulse Bars representing Bar Chart */}
      <div className="flex-1 w-full flex items-end justify-around px-4 gap-4 animate-pulse">
        {[40, 75, 55, 90, 65].map((h, i) => (
          <div key={i} className="w-full bg-primary/20 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
      {/* X Axis ticks placeholders */}
      <div className="flex justify-around mt-2">
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        <div className="h-3 w-12 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

const PIE_COLORS = [
  'var(--primary)',
  'oklch(0.627 0.265 303.9)', // Vibrant Purple
  'oklch(0.609 0.126 221.72)', // Sky Blue
  'oklch(0.627 0.194 149.21)', // Emerald Green
  'oklch(0.769 0.188 70.08)', // Amber Yellow
  'oklch(0.608 0.22  18.66)', // Rose Red
];

function PieChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full relative flex flex-col items-center justify-center animate-pulse"
      style={{ height }}
    >
      {/* Donut representation */}
      <div className="relative flex items-center justify-center h-44 w-44 rounded-full border-18 border-primary/20 border-t-primary/10 border-r-primary/15 border-b-primary/5" />
      {/* Legend placeholders */}
      <div className="flex justify-center gap-4 mt-6">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
