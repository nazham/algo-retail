'use client';

import { cn } from '@repo/ui/lib/utils';

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide' | 'full';
}

export function DashboardContainer({
  children,
  className,
  size = 'default',
}: DashboardContainerProps) {
  const sizeClasses = {
    narrow: 'max-w-4xl',
    default: 'max-w-5xl',
    wide: 'max-w-7xl',
    full: 'max-w-none',
  };

  return (
    <div
      className={cn(
        'container mx-auto py-8 animate-in fade-in duration-500',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
