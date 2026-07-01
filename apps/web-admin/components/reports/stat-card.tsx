'use client';

import { cn } from '@repo/ui/lib/utils';

// Skeleton for loading states — shared across dashboard & reports
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

// KPI Stat Card — used by dashboard and reports pages
export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  isLoading?: boolean;
}) {
  const iconStyles: Record<string, string> = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-500',
    success: 'bg-emerald-500/10 text-emerald-500',
    danger: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div
          className={cn('h-9 w-9 rounded-lg flex items-center justify-center', iconStyles[variant])}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
