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
} from 'recharts';

type ChartType = 'area' | 'bar';

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
}: ReportChartProps) {
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
      ? { top: 5, right: 10, left: 10, bottom: 45 }
      : { top: 5, right: 10, left: 10, bottom: 5 },
  };

  const commonAxisProps = {
    xAxis: (
      <XAxis
        dataKey={xAxisKey}
        tickFormatter={xAxisFormatter}
        tick={
          shouldRotate ? ({ fontSize: 10, angle: -45, textAnchor: 'end' } as any) : { fontSize: 12 }
        }
        height={shouldRotate ? 60 : 30}
        interval={shouldRotate ? 0 : 'preserveEnd'}
        stroke="hsl(var(--muted-foreground))"
        tickLine={false}
        axisLine={false}
      />
    ),
    yAxis: (
      <YAxis
        tickFormatter={yAxisTickFormatter}
        tick={{ fontSize: 12 }}
        stroke="hsl(var(--muted-foreground))"
        tickLine={false}
        axisLine={false}
        width={80}
      />
    ),
    grid: <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />,
    tooltip: (
      <Tooltip
        formatter={tooltipFormatter}
        labelFormatter={xAxisFormatter}
        contentStyle={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          fontSize: '12px',
        }}
      />
    ),
    legend: <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />,
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
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
      ) : (
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
      )}
    </ResponsiveContainer>
  );
}
