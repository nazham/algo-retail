'use client';

import { cn } from '@repo/ui/lib/utils';
import { Skeleton } from './stat-card';

interface ReportCardProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  skeletonHeight?: string;
}

/**
 * Consistent card wrapper for report sections (charts, tables, etc.)
 * Provides header with icon + title, loading skeleton, and consistent styling.
 */
export function ReportCard({
  title,
  icon: Icon,
  children,
  className,
  isLoading,
  skeletonHeight = 'h-64',
}: ReportCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card min-w-0 flex flex-col', className)}>
      <div className="flex items-center gap-2 p-5 border-b border-border">
        {Icon && <Icon className="h-4.5 w-4.5 text-primary" />}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {isLoading ? <Skeleton className={cn('w-full flex-1', skeletonHeight)} /> : children}
      </div>
    </div>
  );
}
