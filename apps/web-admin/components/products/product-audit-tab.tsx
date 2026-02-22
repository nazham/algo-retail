'use client';

import { useProductAudit, AuditLog } from '@/hooks/use-audit';
import { format } from 'date-fns';
import { Loader2, History, User } from 'lucide-react';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Button } from '@repo/ui/components/ui/button';
import { cn } from '@repo/ui/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface ProductAuditTabProps {
  productId: string;
}

const PAGE_SIZE = 10;

export function ProductAuditTab({ productId }: ProductAuditTabProps) {
  const [page, setPage] = useState(1);
  const {
    data: logs,
    isLoading,
    isFetching,
  } = useProductAudit(productId, { page, limit: PAGE_SIZE });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs?.length && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <History className="h-12 w-12 mb-4 opacity-10" />
        <p className="text-sm">No metadata changes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6 pl-4 border-l-2 border-muted py-2">
          {logs?.map((log: AuditLog) => (
            <div key={log.id} className="relative">
              {/* Dot */}
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="capitalize">{log.action.toLowerCase()}d</span>
                    <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> {log.userName || log.userId || 'System'}
                    </span>
                  </div>
                  <time className="text-[10px] text-muted-foreground">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                  </time>
                </div>

                {log.payload && (
                  <div className="bg-muted/30 rounded-md p-2 text-xs space-y-2 border border-muted/50">
                    {Object.entries(log.payload).map(
                      ([field, diff]: [string, { old: any; new: any }]) => (
                        <div key={field} className="flex flex-col gap-0.5">
                          <span className="font-medium text-muted-foreground capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded line-through decoration-red-500/50">
                              {formatValue(field, diff.old)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-medium">
                              {formatValue(field, diff.new)}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t mt-2">
        <div className="text-xs text-muted-foreground">
          Page {page} {isFetching && <span className="animate-pulse ml-2">Refreshing...</span>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="h-7 text-xs"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!logs?.length || logs.length < PAGE_SIZE || isLoading}
            className="h-7 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Basic value formatter for audit logs
 */
function formatValue(field: string, value: any): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  // Format prices (assuming fields containing 'price' or 'Price' are cents)
  if (field.toLowerCase().includes('price')) {
    const val = typeof value === 'string' ? parseFloat(value) : value;
    return formatCurrency(val);
  }

  // Handle Dates
  if (field.toLowerCase().includes('date') && typeof value === 'string') {
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return value;
    }
  }

  return String(value);
}
